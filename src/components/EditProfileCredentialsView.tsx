import React, { useState } from 'react';
import { ArrowLeft, User, Lock, Save, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface EditProfileCredentialsViewProps {
  onBack: () => void;
  currentUsername: string;
  onSaveAndLogout: (newUsername: string, newPassword?: string) => void;
}

export default function EditProfileCredentialsView({ onBack, currentUsername, onSaveAndLogout }: EditProfileCredentialsViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1 State
  const [oldUsername, setOldUsername] = useState('');

  // Step 2 State
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOld = () => {
    if (!oldUsername.trim()) {
      setError('Please enter your current username');
      return;
    }
    // Simulate verification check (in real app we'd verify with Firebase)
    if (oldUsername.trim().toLowerCase() !== currentUsername.toLowerCase()) {
      setError('Incorrect current username');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleSave = () => {
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

    // Simulate saving to Backend / Auth
    setTimeout(() => {
      setIsLoading(false);
      onSaveAndLogout(newUsername, newPassword || undefined);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-neutral-950 z-[100] flex flex-col font-sans animate-fade-in custom-scrollbar overflow-y-auto">
      <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5">
        <button
          onClick={step === 2 ? () => setStep(1) : onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-lg font-semibold tracking-tight">
          {step === 1 ? 'Verify Current' : 'Edit Credentials'}
        </h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-6 pt-8 pb-32 flex flex-col">
        <p className="text-neutral-400 text-sm mb-8">
          {step === 1 
            ? "Please verify your current credentials before making changes to your account."
            : "Update your username or password. For security reasons, you will be logged out after changes are saved."}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Current Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  value={oldUsername}
                  onChange={(e) => setOldUsername(e.target.value)}
                  placeholder="Enter current username"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleVerifyOld}
              disabled={isLoading || !oldUsername.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8"
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
        ) : (
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
                  placeholder="Leave blank to keep current"
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

            {newPassword.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium text-neutral-300 ml-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-neutral-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
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
            )}

            <button
              onClick={handleSave}
              disabled={isLoading || (!newUsername.trim() && !newPassword)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8"
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
