import { scopedStorage } from "../utils/storage";
import { API_BASE_URL } from "../config";
import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';

interface LoginFormViewProps {
  onBack: () => void;
  onSuccess: (username: string) => void;
  onFaceLoginSelected?: () => void;
}

export default function LoginFormView({ onBack, onSuccess, onFaceLoginSelected }: LoginFormViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Recovery States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [recoveryMobile, setRecoveryMobile] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    try {
      // 1. Switch from Firebase to your MongoDB Backend API
      const response = await fetch(API_BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Incorrect username or password.');
        return;
      }

      // 2. Save the Secure Token and User Details
      scopedStorage.setItem('booran_token', data.token);
      scopedStorage.setItem('booran_username', data.username);
      
      if (data.user) {
        scopedStorage.setItem('booran_personal_mobile', data.user.mobileNumber || '');
        scopedStorage.setItem('booran_hide_details', JSON.stringify(!!data.user.hideDetails));
      }

      // 3. Move to the Dashboard
      onSuccess(data.username);
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMessage('Login failed. Please check your connection or server status.');
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedUser = recoveryUsername.trim();
    const trimmedSecret = recoverySecret.trim();

    if (!trimmedUser || !trimmedSecret) {
      setErrorMessage('Please enter both your username and secret code.');
      return;
    }

    try {
      // Switch from Firebase query to your MongoDB Verification API
      const response = await fetch(API_BASE_URL + '/api/auth/verify-secret-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, secretCode: trimmedSecret })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Verification failed. Details do not match.');
        return;
      }
      
      // Save temp token so we can update password next
      scopedStorage.setItem('booran_token', data.token);

      setOtpRequested(true);
      setSuccessMessage(`Account verified! You can now reset your password.`);
    } catch (err: any) {
      console.error("Recovery error:", err);
      setErrorMessage('Verification failed. Server might be offline.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.trim().length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    try {
      // In your MongoDB system, we update via the /api/auth/update-credentials or similar
      // For now, let's assume we use a dedicated password update endpoint
      const response = await fetch(API_BASE_URL + '/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to reset password.');
        return;
      }
      
      setSuccessMessage('Password updated successfully! Redirecting to login...');

      setTimeout(() => {
        setIsForgotPassword(false);
        setOtpRequested(false);
        setNewPassword('');
        setSuccessMessage('');
        // Clear temp recovery token
        scopedStorage.removeItem('booran_token');
      }, 3000);
    } catch (err: any) {
      setErrorMessage('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-full bg-black text-white p-6 md:p-12 flex flex-col justify-between relative overflow-y-auto">
      
      {/* Top action bar */}
      <div className="flex items-center">
        <button 
          onClick={isForgotPassword ? () => { setIsForgotPassword(false); setErrorMessage(''); setSuccessMessage(''); } : onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-90 transition-all text-white hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        {isForgotPassword && (
          <span className="text-xs font-mono text-neutral-300 ml-2">Back to main Login</span>
        )}
      </div>

      <div className="w-full max-w-sm mx-auto mt-4 mb-auto py-4">
        
        {isForgotPassword ? (
          /* FORGOT PASSWORD RECOVERY WORKFLOW VIEW */
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-[#EC5384]" /> Account Recovery
            </h2>
            <p className="text-sm text-neutral-200 mb-6">
              Enter your username, secret code, and registered mobile number to reset your password.
            </p>

            {errorMessage && (
              <div className="p-3 mb-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 mb-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {!otpRequested ? (
              /* PANEL A - RECOVERY CONTACT DETAILS INPUT */
              <form onSubmit={handleRequestRecovery} className="space-y-6">
                
                {/* RECOVERY USERNAME */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
                    Username
                  </label>
                  <div className="h-11 bg-white rounded-full flex items-center px-4 border-2 border-transparent focus-within:border-brand-pink/50">
                    <input
                      type="text"
                      value={recoveryUsername}
                      onChange={(e) => {
                        setRecoveryUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Username of account"
                      className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium"
                    />
                  </div>
                </div>


                {/* RECOVERY SECRET CODE */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
                    Secret Code
                  </label>
                  <div className="h-11 bg-white rounded-full flex items-center px-4 border-2 border-transparent focus-within:border-brand-pink/50">
                    <input
                      type="password"
                      maxLength={8}
                      value={recoverySecret}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 8) val = val.substring(0, 8);
                        setRecoverySecret(val);
                        setErrorMessage('');
                      }}
                      placeholder="8-digit secret code"
                      className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium font-mono tracking-widest"
                    />
                  </div>
                </div>

                {/* RECOVERY MOBILE NUMBER */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
                    Mobile Number
                  </label>
                  <div className="h-11 bg-white rounded-full flex items-center px-4 border-2 border-transparent focus-within:border-brand-pink/50">
                    <input
                      type="tel"
                      maxLength={11}
                      value={recoveryMobile}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 11) val = val.substring(0, 11);
                        setRecoveryMobile(val);
                        setErrorMessage('');
                      }}
                      placeholder="Enter mobile number"
                      className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium tracking-wide"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#EC5384] text-white font-bold text-sm tracking-wide rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer block font-sans text-center"
                >
                  Verify Details
                </button>
              </form>
            ) : (
              /* PANEL B - OTP VERIFICATION AND NEW PASSWORD REDIRECT */
              <form onSubmit={handleResetPassword} className="space-y-6">
                
                {/* CHOOSE NEW PASSWORD FIELD */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
                    New Account Password
                  </label>
                  <div className="h-11 bg-white rounded-full flex items-center px-4 border-2 border-transparent focus-within:border-brand-pink/50">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Choose new safe password"
                      className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium pr-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-neutral-500 hover:text-black transition-colors focus:outline-none cursor-pointer p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black font-bold text-sm tracking-wide rounded-full hover:bg-neutral-200 active:scale-95 transition-all shadow-md cursor-pointer block font-sans text-center"
                >
                  Reset Password
                </button>
              </form>
            )}

            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={() => { setIsForgotPassword(false); setErrorMessage(''); setSuccessMessage(''); }}
                className="text-sm text-neutral-300 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Back to normal Login screen
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD LOGIN WORKFLOW VIEW (Without Secret Code and with Password Recovery) */
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-8">
              Login account
            </h2>
            

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* USERNAME INPUT */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
                  <span className={errorMessage && !username ? 'text-red-500' : 'text-neutral-200'}>
                    Username (Id/contact)
                  </span>
                </label>
                <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
                  errorMessage ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-brand-pink/50'
                }`}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter username"
                    className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium"
                  />
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
                    <span className={errorMessage && !password ? 'text-red-500' : 'text-neutral-200'}>
                      Password
                    </span>
                  </label>
                  
                  {/* FORGOT PASSWORD INITIATOR BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[12px] text-[#EC5384] hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
                  errorMessage ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-[#EC5384]/50'
                }`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter password"
                    className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium pr-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-500 hover:text-black transition-colors focus:outline-none cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Bottom actions container */}
              <div className="flex items-center justify-between pt-4">
                {onFaceLoginSelected ? (
                  <button
                    type="button"
                    onClick={onFaceLoginSelected}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm tracking-wide rounded-full hover:bg-blue-500 active:scale-95 transition-all shadow-md cursor-pointer inline-flex items-center justify-center font-sans"
                  >
                    Face login
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#EC5384] text-white font-bold text-sm tracking-wide rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer inline-flex items-center justify-center font-sans"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
