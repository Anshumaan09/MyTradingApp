// A-04 + A-05: Auth & KYC Controllers
// Business logic for authentication flows and KYC verification.
// These functions handle the multi-step registration process with real DB writes.

import { supabase } from './supabase';
import { sendOTP, verifyOTP } from './otp';
import { encrypt, sha256, maskSensitive } from './crypto';
import { generateReferralCode, generateRequestId } from './jwt';
import { logAudit } from './middleware.jsx';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'nexustrade-demo-key-2026';

// ==========================================
// A-04: Auth Controllers
// ==========================================

/**
 * Step 1: Register a new user with email + password
 * Creates auth user → triggers auth_trigger → seeds users, wallet, prefs
 */
export async function registerUser({ email, password, fullName, phone }) {
    // Validate inputs
    if (!email || !password || !fullName || !phone) {
        throw new Error('All fields are required');
    }
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
        throw new Error('Invalid phone number format');
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, phone: phone.replace(/\s/g, '') }
        }
    });

    if (error) throw error;

    // Send OTP for phone verification
    const otpResult = await sendOTP(phone.replace(/\s/g, ''));

    return {
        user: data.user,
        session: data.session,
        otpSent: otpResult.success,
        otpMessage: otpResult.message,
        // DEV only: expose OTP for testing
        ...(import.meta.env.DEV && { devOtp: otpResult.otp })
    };
}

/**
 * Login with email + password
 */
export async function loginUser({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Log successful login
    await logAudit(data.user.id, 'login', 'user', data.user.id);

    // Update last_login_at
    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

    return { user: data.user, session: data.session };
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOTP(phone, otp) {
    const result = await verifyOTP(phone, otp);
    if (!result.success) throw new Error(result.message);

    // Update user's phone verification status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('users').update({ kyc_status: 1 }).eq('id', user.id);
    }

    return result;
}

/**
 * Logout
 */
export async function logoutUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await logAudit(user.id, 'logout', 'user', user.id);
    await supabase.auth.signOut();
}


// ==========================================
// A-05: KYC Controllers
// ==========================================

/**
 * Step 2: Verify PAN
 * Validates PAN format, encrypts, and stores in kyc_documents
 */
export async function verifyPAN(pan, panName) {
    // Validate PAN format: AAAAA0000A
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        throw new Error('Invalid PAN format. Expected: ABCDE1234F');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Encrypt PAN before storing
    const panEncrypted = await encrypt(pan, ENCRYPTION_KEY);
    const panHash = await sha256(pan);

    // Upsert KYC document
    const { error } = await supabase.from('kyc_documents').upsert({
        user_id: user.id,
        pan_encrypted: panEncrypted,
        pan_name: panName || null,
        pan_verified: true, // In production: call NSDL/CKYC API to verify
        verification_method: 'auto',
        verified_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) throw error;

    // Update kyc_status on users table
    await supabase.from('users').update({ kyc_status: 2 }).eq('id', user.id);
    await logAudit(user.id, 'kyc_pan_verified', 'kyc', null, { pan_last4: pan.slice(-4) });

    return { verified: true, maskedPan: maskSensitive(pan) };
}

/**
 * Step 3: Link bank account
 * Encrypts account number and stores with IFSC
 */
export async function linkBankAccount(accountNo, ifsc, bankName) {
    if (!accountNo || accountNo.length < 8) {
        throw new Error('Invalid bank account number');
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        throw new Error('Invalid IFSC code format');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const accountNoEnc = await encrypt(accountNo, ENCRYPTION_KEY);

    const { error } = await supabase.from('bank_accounts').insert({
        user_id: user.id,
        account_no_enc: accountNoEnc,
        ifsc: ifsc,
        bank_name: bankName || 'Unknown',
        account_type: 'savings',
        is_primary: true,
        is_verified: true, // In production: penny-drop verification
        penny_drop_ref: `MOCK-${generateRequestId().slice(0, 8)}`
    });

    if (error) throw error;

    // Update kyc_status
    await supabase.from('users').update({ kyc_status: 3 }).eq('id', user.id);
    await logAudit(user.id, 'kyc_bank_linked', 'bank_account', null, { ifsc, bank: bankName });

    return { linked: true, maskedAccount: maskSensitive(accountNo) };
}

/**
 * Step 4: Upload Aadhaar / Selfie (mock for demo)
 * In production: DigiLocker eSign API or document upload to S3
 */
export async function verifyDocuments(aadhaarLast4) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update KYC documents with Aadhaar
    await supabase.from('kyc_documents').update({
        aadhaar_last4: aadhaarLast4 || '0000',
        aadhaar_verified: true
    }).eq('user_id', user.id);

    // Mark KYC as complete
    await supabase.from('users').update({ kyc_status: 4 }).eq('id', user.id);
    await logAudit(user.id, 'kyc_complete', 'kyc', null);

    return { complete: true };
}

/**
 * Get KYC progress for a user
 */
export async function getKycProgress(userId) {
    const [{ data: user }, { data: kyc }, { data: bank }] = await Promise.all([
        supabase.from('users').select('kyc_status, full_name').eq('id', userId).single(),
        supabase.from('kyc_documents').select('pan_verified, aadhaar_verified, verification_method').eq('user_id', userId).maybeSingle(),
        supabase.from('bank_accounts').select('is_verified, bank_name, ifsc').eq('user_id', userId).eq('is_primary', true).maybeSingle()
    ]);

    return {
        status: user?.kyc_status || 0,
        steps: {
            account: true, // If they're logged in, Step 1 is done
            pan: kyc?.pan_verified || false,
            bank: bank?.is_verified || false,
            documents: kyc?.aadhaar_verified || false,
        },
        bankInfo: bank ? { bank: bank.bank_name, ifsc: bank.ifsc } : null
    };
}
