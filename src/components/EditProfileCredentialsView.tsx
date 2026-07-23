import React, { useState } from 'react';
import { ArrowLeft, User, Lock, Save, ArrowRight, Eye, EyeOff, Phone, Calendar, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { scopedStorage } from '../utils/storage';

interface EditProfileCredentialsViewProps {
  onBack: () => void;
  currentUsername: string;
  onSaveAndLogout: (newUsername: string, newPassword?: string) => void;
}

export default function EditProfileCredentialsView({ onBack, currentUsername, onSaveAndLogout }: EditProfileCredentialsViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1 State
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [secretCode, setSecretCode] = useState('');

  // Step 2 State
  const [verifyUsername, setVerifyUsername] = useState('');

  // Step 3 State
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyStep1 = async () => {
    if (!mobileNumber.trim() || !dateOfBirth.trim() || !secretCode.trim()) {
      setError('Please fill in all verification details');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(API_BASE_URL + '/api/auth/verify-step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ mobileNumber, dateOfBirth, secretCode })
      });

      if (response.ok) {
        setStep(2);
      } else {
        const data = await response.json();
        setError(data.error || 'Verification failed. Details do not match.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyStep2 = () => {
    if (verifyUsername.trim().toLowerCase() !== currentUsername.toLowerCase()) {
      setError('Incorrect current username');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSave = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    onSaveAndLogout(newUsername, newPassword || undefined);
  };

  return (
    <div className="absolute inset-0 bg-neutral-950 z-[100] flex flex-col font-sans animate-fade-in custom-scrollbar overflow-y-auto">
      <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5 safe-area-top">
        <button
          onClick={step === 3 ? () => setStep(2) : step === 2 ? () => setStep(1) : onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-lg font-semibold tracking-tight">
          {step === 1 ? 'Verify Identity' : step === 2 ? 'Verify Username' : 'Edit Credentials'}
        </h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-6 pt-8 pb-32 flex flex-col">
        <p className="text-neutral-400 text-sm mb-8">
          {step === 1 
            ? "Enter your registered Mobile Number, Date of Birth, and 8-digit Secret Code."
            : step === 2
            ? "Verification part 1 complete. Now enter your current username."
            : "Update your username or password. You will be logged out after saving."}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* MOBILE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter registered mobile"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* SECRET CODE */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Secret Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="password"
                  maxLength={8}
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, '').substring(0, 8))}
                  placeholder="8-digit secret code"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              onClick={handleVerifyStep1}
              disabled={isLoading || !mobileNumber || !dateOfBirth || secretCode.length !== 8}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Current Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  value={verifyUsername}
                  onChange={(e) => setVerifyUsername(e.target.value)}
                  placeholder="Confirm current username"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleVerifyStep2}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8"
            >
              Verify Username
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">New Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
