import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, User, Shield, CreditCard, CheckCircle2, Building2, UploadCloud, Phone, RefreshCw } from 'lucide-react';
import { registerUser, loginUser, verifyPhoneOTP, verifyPAN, linkBankAccount, verifyDocuments } from '../lib/authController';

export const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [registrationStep, setRegistrationStep] = useState(1);

    // Step 1 fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    // OTP fields (between step 1 & 2)
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [devOtp, setDevOtp] = useState(null);
    const [otpTimer, setOtpTimer] = useState(0);
    const otpRefs = useRef([]);

    // Step 2: PAN
    const [pan, setPan] = useState('');
    // Step 3: Bank
    const [bankAccount, setBankAccount] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [bankName, setBankName] = useState('');
    // Step 4: Aadhaar
    const [aadhaarLast4, setAadhaarLast4] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const navigate = useNavigate();

    // OTP countdown timer
    useEffect(() => {
        if (otpTimer <= 0) return;
        const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
        return () => clearTimeout(t);
    }, [otpTimer]);

    // Handle OTP input (auto-focus next field)
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (isLogin) {
                await loginUser({ email, password });
                navigate('/dashboard');
                return;
            }

            // Registration flow
            if (registrationStep === 1 && !showOtp) {
                // Create account + send OTP
                const result = await registerUser({ email, password, fullName, phone });
                if (result.session) {
                    setDevOtp(result.devOtp || null);
                    setShowOtp(true);
                    setOtpTimer(30);
                    setSuccessMsg(`OTP sent to ${phone}` + (result.devOtp ? ` (Dev: ${result.devOtp})` : ''));
                } else {
                    setSuccessMsg('Please check your email for verification, then log in.');
                    setIsLogin(true);
                }
            }
            else if (registrationStep === 1 && showOtp) {
                // Verify OTP
                const otpString = otp.join('');
                if (otpString.length !== 6) throw new Error('Please enter all 6 digits');
                await verifyPhoneOTP(phone.replace(/\s/g, ''), otpString);
                setShowOtp(false);
                setRegistrationStep(2);
                setSuccessMsg('Phone verified! Now let\'s verify your PAN.');
            }
            else if (registrationStep === 2) {
                const result = await verifyPAN(pan, fullName);
                setSuccessMsg(`PAN verified: ${result.maskedPan}`);
                setRegistrationStep(3);
            }
            else if (registrationStep === 3) {
                const result = await linkBankAccount(bankAccount, ifsc, bankName || 'Bank');
                setSuccessMsg(`Bank linked: ${result.maskedAccount}`);
                setRegistrationStep(4);
            }
            else if (registrationStep === 4) {
                await verifyDocuments(aadhaarLast4);
                setRegistrationStep(5);
                setSuccessMsg('KYC complete! Welcome to NexusTrade.');
            }
            else if (registrationStep === 5) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const RegistrationProgress = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--border-strong)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '15px', left: '10%', width: `${((registrationStep - 1) / 4) * 80}%`, height: '2px', backgroundColor: 'var(--accent-primary)', zIndex: 0, transition: 'width 0.3s ease' }} />
            {[
                { step: 1, icon: User, label: "Account" },
                { step: 2, icon: Shield, label: "PAN" },
                { step: 3, icon: Building2, label: "Bank" },
                { step: 4, icon: UploadCloud, label: "Aadhaar" },
                { step: 5, icon: CheckCircle2, label: "Done" }
            ].map(s => {
                const isActive = registrationStep === s.step;
                const isCompleted = registrationStep > s.step;
                const Icon = s.icon;
                return (
                    <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: isActive || isCompleted ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                            border: `2px solid ${isActive || isCompleted ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isActive || isCompleted ? 'white' : 'var(--text-muted)',
                            transition: 'all 0.3s ease'
                        }}>
                            {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: isActive || isCompleted ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? '600' : '500' }}>
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    // OTP Input UI
    const OtpInput = () => (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-surface-highlight)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} /> Enter the 6-digit OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="form-input"
                        style={{
                            width: '48px', height: '56px', textAlign: 'center',
                            fontSize: '1.5rem', fontWeight: '600', padding: 0,
                            letterSpacing: '0.1em'
                        }}
                    />
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {otpTimer > 0 ? (
                    <span>Resend in {otpTimer}s</span>
                ) : (
                    <button type="button" onClick={async () => {
                        const { sendOTP } = await import('../lib/otp');
                        const r = await sendOTP(phone.replace(/\s/g, ''));
                        if (r.success) { setOtpTimer(30); setSuccessMsg('OTP resent!'); if (r.otp) setDevOtp(r.otp); }
                    }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <RefreshCw size={14} /> Resend OTP
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', padding: '2rem' }}>
            <div className="card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', position: 'relative' }}>
                <Link to="/" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>← Back to Home</Link>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="flex-center" style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                        color: 'white', fontWeight: 'bold', fontSize: '1.5rem',
                        margin: '0 auto 1rem auto'
                    }}>N</div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>NexusTrade</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLogin ? 'Sign in to access your portfolio.' :
                            showOtp ? 'Verify your phone number.' :
                                registrationStep === 1 ? 'Create your account.' : 'Complete your KYC Profile.'}
                    </p>
                </div>

                {!isLogin && <RegistrationProgress />}

                {error && (
                    <div style={{
                        padding: '0.75rem 1rem', backgroundColor: 'var(--color-danger-bg)',
                        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px',
                        color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <AlertCircle size={16} /> <span>{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div style={{
                        padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px',
                        color: 'var(--color-success)', fontSize: '0.875rem', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <CheckCircle2 size={16} /> <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Step 1: Create Account */}
                    {(isLogin || (!isLogin && registrationStep === 1 && !showOtp)) && (
                        <>
                            {!isLogin && (
                                <>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Legal Full Name</label>
                                        <input type="text" className="form-input" placeholder="As per PAN card" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Phone Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input type="tel" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required={!isLogin} />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="email" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="password" className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* OTP Verification */}
                    {!isLogin && registrationStep === 1 && showOtp && <OtpInput />}

                    {/* Step 2: PAN */}
                    {!isLogin && registrationStep === 2 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface-highlight)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <Shield size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                                Enter your Permanent Account Number. Required per SEBI regulations. Your PAN is encrypted before storage.
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">PAN Number</label>
                                <input type="text" className="form-input text-mono" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} required pattern="[A-Z]{5}[0-9]{4}[A-Z]" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Bank */}
                    {!isLogin && registrationStep === 3 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface-highlight)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <Building2 size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                                Link your primary bank account. A ₹1 penny-drop will verify it instantly.
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Bank Name</label>
                                <input type="text" className="form-input" placeholder="State Bank of India" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Account Number</label>
                                <input type="text" className="form-input text-mono" placeholder="XXXXXXXXX234" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">IFSC Code</label>
                                <input type="text" className="form-input text-mono" placeholder="SBIN0001234" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} maxLength={11} required />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Aadhaar / Documents */}
                    {!isLogin && registrationStep === 4 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-surface-highlight)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <UploadCloud size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                                Final step — Aadhaar verification. In production, this uses DigiLocker eKYC.
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Aadhaar Last 4 Digits</label>
                                <input type="text" className="form-input text-mono" placeholder="1234" value={aadhaarLast4} onChange={(e) => setAadhaarLast4(e.target.value)} maxLength={4} required pattern="\d{4}" />
                            </div>
                            <div style={{ border: '2px dashed var(--border-strong)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', opacity: 0.6 }}>
                                <UploadCloud size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selfie capture (simulated in demo)</div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {!isLogin && registrationStep === 5 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
                            <CheckCircle2 size={64} style={{ color: 'var(--color-success)', margin: '0 auto' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>You're all set!</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Your KYC has been verified and saved. Your account is ready for trading.
                            </p>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? 'Processing...' : (
                            isLogin ? 'Sign In' :
                                showOtp ? 'Verify OTP' :
                                    registrationStep === 1 ? 'Create Account & Send OTP' :
                                        registrationStep === 5 ? 'Go to Dashboard' : 'Continue'
                        )}
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>

                {(isLogin || (!isLogin && registrationStep === 1 && !showOtp)) && (
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); setShowOtp(false); setRegistrationStep(1); }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500', fontFamily: 'var(--font-sans)', padding: 0 }}>
                            {isLogin ? "Sign up" : "Sign in"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
