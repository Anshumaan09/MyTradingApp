// A-02: OTP Service
// Simulated OTP service for phone verification during registration.
// In production, integrate with MSG91, Twilio, or AWS SNS.

import { supabase } from './supabase';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// In-memory store for demo (production: Redis or DB)
const otpStore = new Map();

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    const num = (arr[0] * 16777216 + arr[1] * 65536 + arr[2] * 256 + arr[3]) % 1000000;
    return String(num).padStart(OTP_LENGTH, '0');
}

/**
 * Send OTP to a phone number (simulated)
 * In production: call MSG91/Twilio API
 * @returns {{ success: boolean, message: string, otp?: string }}
 */
export async function sendOTP(phone) {
    if (!phone || phone.length < 10) {
        return { success: false, message: 'Invalid phone number' };
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(phone, { otp, expiresAt, attempts: 0 });

    // --- PRODUCTION: Replace with real SMS API call ---
    // await fetch('https://api.msg91.com/api/v5/otp', { ... });
    console.log(`[OTP Service] Sent OTP ${otp} to ${phone} (demo mode)`);

    return {
        success: true,
        message: `OTP sent to ${phone}`,
        // Only expose OTP in development
        otp: import.meta.env.DEV ? otp : undefined
    };
}

/**
 * Verify an OTP
 * @returns {{ success: boolean, message: string }}
 */
export async function verifyOTP(phone, inputOtp) {
    const stored = otpStore.get(phone);

    if (!stored) {
        return { success: false, message: 'No OTP sent to this number. Please request a new one.' };
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(phone);
        return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    stored.attempts += 1;
    if (stored.attempts > 3) {
        otpStore.delete(phone);
        return { success: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    if (stored.otp !== inputOtp) {
        return { success: false, message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.` };
    }

    // OTP verified — clean up
    otpStore.delete(phone);
    return { success: true, message: 'Phone number verified successfully' };
}

/**
 * Resend OTP with rate limiting (minimum 30s between sends)
 */
export async function resendOTP(phone) {
    const stored = otpStore.get(phone);
    if (stored && (Date.now() - (stored.expiresAt - OTP_EXPIRY_MS)) < 30000) {
        return { success: false, message: 'Please wait 30 seconds before requesting a new OTP.' };
    }
    return sendOTP(phone);
}
