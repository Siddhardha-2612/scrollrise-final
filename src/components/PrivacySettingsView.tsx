import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Shield, EyeOff, Eye, Trash2, Lock, Unlock, Mail, Phone, LogOut, MapPin, Calendar, Briefcase, Globe } from 'lucide-react';
import { api } from "../services/api";
import { API_BASE_URL } from '../config';

interface PrivacySettingsViewProps {
  onBack: () => void;
  isPremium?: boolean;
  onTogglePremium?: (val: boolean) => void;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
}

export default function PrivacySettingsView({ 
  onBack,
  isPremium = false,
  onTogglePremium,
  onDeleteAccount,
  onLogout
}: PrivacySettingsViewProps) {
  // Account privacy state: 'public' or 'private'
  const [isPrivate, setIsPrivate] = useState(() => {
    return scopedStorage.getItem('booran_is_private') === 'true';
  });

  // Personal details vault
  const [mobileNo, setMobileNo] = useState(() => {
    return scopedStorage.getItem('booran_mobile_no') || '';
  });
  const [emailAddress, setEmailAddress] = useState(() => {
    return scopedStorage.getItem('booran_email_address') || '';
  });
  const [homeAddress, setHomeAddress] = useState(() => {
    return scopedStorage.getItem('booran_home_address') || '';
  });
  const [country, setCountry] = useState(() => {
    return scopedStorage.getItem('booran_country') || '';
  });
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    return scopedStorage.getItem('booran_date_of_birth') || '';
  });
  const [profession, setProfession] = useState(() => {
    return scopedStorage.getItem('booran_profession') || '';
  });

  const [hideDetails, setHideDetails] = useState(() => {
    return scopedStorage.getItem('booran_hide_details') === 'true';
  });

  const [profileLocked, setProfileLocked] = useState(() => {
    return scopedStorage.getItem('booran_profile_locked') === 'true';
  });

  // Sync with MongoDB on mount
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const response = await fetch(API_BASE_URL + '/api/auth/me', {
          headers: { 'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.hideDetails !== undefined) {
            setHideDetails(data.hideDetails);
            scopedStorage.setItem('booran_hide_details', data.hideDetails.toString());
          }
          if (data.isPrivate !== undefined) {
            setIsPrivate(data.isPrivate);
            scopedStorage.setItem('booran_is_private', data.isPrivate.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch privacy settings", err);
      }
    };
    fetchPrivacy();
  }, []);

  const handleToggleHide = async () => {
    const nextVal = !hideDetails;
    setHideDetails(nextVal);
    scopedStorage.setItem('booran_hide_details', nextVal.toString());

    try {
      await fetch(API_BASE_URL + '/api/auth/update-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ hideDetails: nextVal })
      });
      triggerToast(nextVal ? "Profile details hidden from public." : "Profile details now visible.");
    } catch (err) {
      console.error("Failed to update hideDetails", err);
    }
  };

  const handleTogglePrivate = async () => {
    const nextVal = !isPrivate;
    setIsPrivate(nextVal);
    scopedStorage.setItem('booran_is_private', nextVal.toString());

    try {
      await fetch(API_BASE_URL + '/api/auth/update-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ isPrivate: nextVal })
      });
      triggerToast(nextVal ? "Account set to PRIVATE. You are hidden from search." : "Account set to PUBLIC.");
    } catch (err) {
      console.error("Failed to update isPrivate", err);
    }
  };

  const handleToggleLock = async () => {
    const nextVal = !isPrivate; // Toggle Private state
    setIsPrivate(nextVal);
    setProfileLocked(nextVal); // Mirror to lock state for UI
    scopedStorage.setItem('booran_is_private', nextVal.toString());
    scopedStorage.setItem('booran_profile_locked', nextVal.toString());

    try {
      await fetch(API_BASE_URL + '/api/auth/update-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ isPrivate: nextVal })
      });
      triggerToast(nextVal ? "Profile LOCKED & HIDDEN from search." : "Profile visibility unlocked.");
    } catch (err) {
      console.error("Failed to update privacy", err);
    }
  };

  const handleSaveVault = async () => {
    scopedStorage.setItem('booran_mobile_no', mobileNo);
    scopedStorage.setItem('booran_email_address', emailAddress);
    scopedStorage.setItem('booran_home_address', homeAddress);
    scopedStorage.setItem('booran_country', country);
    scopedStorage.setItem('booran_date_of_birth', dateOfBirth);
    scopedStorage.setItem('booran_profession', profession);
    scopedStorage.setItem('booran_hide_details', hideDetails.toString());
    triggerToast("Personal credentials saved successfully.");
  };

  const [isLocked, setIsLocked] = useState(true);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const triggerToast = (message: string) => {
    setToast({ message, id: Math.random() });
  };

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white p-6 pb-24 relative select-none overflow-y-auto">
      <header className="mb-6 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-neutral-800 text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <h1 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Total App Privacy</h1>
      </header>

      {toast && (
        <div key={toast.id} className="mb-4 bg-white/10 border border-white/20 p-2.5 rounded-xl flex items-center gap-2 text-xs text-white text-center animate-fade-in">
          <Check className="w-4 h-4 shrink-0 text-white" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          {/* Section: Account Privacy Audience (Choose Public / Private) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Profile Visibility</span>
              <span className="text-[10px] bg-white/10 text-white border border-white/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-widest font-semibold">
                Control
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={handleToggleHide}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all select-none ${
                  hideDetails
                    ? 'bg-neutral-900 border-white text-white shadow-lg'
                    : 'bg-neutral-950 border-white/5 text-neutral-500 opacity-60 hover:opacity-85'
                }`}
              >
                {hideDetails ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-neutral-500" />}
                <div>
                  <span className="text-xs font-bold block">{hideDetails ? 'Hidden' : 'Visible'}</span>
                  <span className="text-[8.5px] text-neutral-500 block mt-0.5 leading-tight">Hide personal details from public</span>
                </div>
              </div>

              <div
                onClick={handleTogglePrivate}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all select-none ${
                  isPrivate
                    ? 'bg-neutral-900 border-white text-white shadow-lg'
                    : 'bg-neutral-950 border-white/5 text-neutral-500 opacity-60 hover:opacity-85'
                }`}
              >
                {isPrivate ? <Lock className="w-5 h-5 text-white" /> : <Unlock className="w-5 h-5 text-neutral-500" />}
                <div>
                  <span className="text-xs font-bold block">{isPrivate ? 'Private' : 'Public'}</span>
                  <span className="text-[8.5px] text-neutral-500 block mt-0.5 leading-tight">Hide profile globally from search</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section: Add Personal Details (Fully customizable black & white input elements) */}
          <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-row">
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                Personal Credentials Vault
              </h3>
              <div className="flex items-center gap-1">
                {isLocked ? (
                  <span className="text-[9px] text-red-400 font-mono uppercase bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">LOCKED</span>
                ) : (
                  <span className="text-[9px] text-green-400 font-mono uppercase bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">UNLOCKED</span>
                )}
              </div>
            </div>

            {/* Mobile no field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Mobile No
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "tel"}
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Enter mobile number"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                Email Address
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "email"}
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Enter email address"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Home Address field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                Home Address
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "text"}
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Enter home address"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Country field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                Country
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "text"}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Enter country"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Date of Birth field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Date of Birth
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "date"}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Select date of birth"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Profession field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                Profession
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "text"}
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Enter profession"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>

            {/* Selector: Lock / Unlock row with monochromatic highlight */}
            <div className="flex items-center justify-center gap-6 pt-2 font-sans select-none">
              <button
                type="button"
                onClick={() => {
                  setIsLocked(true);
                  triggerToast("🔒 Personal Credentials Vault locked securely.");
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl border transition-all ${
                  isLocked 
                    ? 'bg-white text-black border-white' 
                    : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold tracking-wide">Lock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLocked(false);
                  triggerToast("🔓 Credentials Vault unlocked for editing.");
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl border transition-all ${
                  !isLocked 
                    ? 'bg-neutral-800 text-white border-white' 
                    : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <Unlock className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold tracking-wide">Unlock</span>
              </button>
            </div>
            
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveVault}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide text-xs py-3 rounded-xl transition-all shadow-lg"
              >
                Save Details
              </button>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Section: Session Security (Log Out) */}
          <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2 text-white">
              <LogOut className="w-5 h-5 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider">Session Security</span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-neutral-950 border border-white/10 hover:bg-neutral-900 text-white px-4 py-3 rounded-xl text-[13px] font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out of App</span>
            </button>
          </div>

          <hr className="border-white/5" />

          {/* Section 4: GDPR & Account Deletion (The User Requested This) */}
          <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Account Deletion & Data Right</span>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-950/40 border border-red-900/30 hover:bg-red-900/40 text-red-400 px-4 py-3 rounded-xl text-[13px] font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Account & Personal Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 w-[85%] max-w-[320px] flex flex-col items-center shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-white text-[16px] font-bold text-center tracking-wide">Delete your account?</h3>
            <p className="text-neutral-400 text-[11px] text-center mt-2 mb-6 leading-relaxed">
              This action is permanent and irreversible. All your private settings, custom vendor pins, and saved credentials will be instantly purged.
            </p>
            
            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-neutral-900 border border-white/5 text-neutral-300 text-[13px] font-bold py-3 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteAccount) {
                    onDeleteAccount();
                  } else {
                    // Fallback local clear
                    scopedStorage.removeItem("booran_token");
                    scopedStorage.removeItem("booran_username");
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-red-600 text-white text-[13px] font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 w-[85%] max-w-[320px] flex flex-col items-center shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white text-[16px] font-bold text-center tracking-wide">Log out?</h3>
            <p className="text-neutral-400 text-[11px] text-center mt-2 mb-6 leading-relaxed">
              Are you sure you would like to log out of your current session? You can sign back in anytime.
            </p>
            
            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-neutral-900 border border-white/5 text-neutral-300 text-[13px] font-bold py-3 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    scopedStorage.removeItem("booran_token");
                    scopedStorage.removeItem("booran_username");
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-white text-black text-[13px] font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors text-center"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
