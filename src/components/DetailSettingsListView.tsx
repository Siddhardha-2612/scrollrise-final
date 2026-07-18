import { scopedStorage } from "../utils/storage";
import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, UserCog, Sparkles, Image, Palette, Sun } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface DetailSettingsListViewProps {
  onBack: () => void;
  onNavigateToBlocked: () => void;
  onNavigateToEditProfilePic: () => void;
  onNavigateToEditCredentials: () => void;
  onNavigateToPrivacy: () => void;
  dataSaver: boolean;
  onToggleDataSaver: (val: boolean) => void;
  onLogout: () => void;
  onLogoutAllDevices: () => void;
}

export default function DetailSettingsListView({
  onBack,
  onNavigateToBlocked,
  onNavigateToEditProfilePic,
  onNavigateToEditCredentials,
  onNavigateToPrivacy,
  dataSaver,
  onToggleDataSaver,
  onLogout,
  onLogoutAllDevices
}: DetailSettingsListViewProps) {
  const isPremium = scopedStorage.getItem("booran_is_premium") === "true";
  const [selectedQuality, setSelectedQuality] = useState<'original' | 'ai'>('ai');
  const [blockedCount, setBlockedCount] = useState<number>(0);

  const [bgBrightness, setBgBrightness] = useState<number>(() => parseFloat(scopedStorage.getItem("app-background-brightness") || "1"));
  const [glassmorphism, setGlassmorphism] = useState<boolean>(() => scopedStorage.getItem("app-glassmorphism") === "true");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    scopedStorage.setItem("app-background-brightness", bgBrightness.toString());
    window.dispatchEvent(new CustomEvent("app-background-brightness-change", { detail: bgBrightness }));

    if (isPremium) {
      fetch(API_BASE_URL + '/api/auth/update-pro-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ backgroundBrightness: bgBrightness })
      });
    }
  }, [bgBrightness, isPremium]);

  useEffect(() => {
    scopedStorage.setItem("app-glassmorphism", glassmorphism.toString());
    window.dispatchEvent(new CustomEvent("app-glassmorphism-change", { detail: glassmorphism }));

    if (isPremium) {
      fetch(API_BASE_URL + '/api/auth/update-pro-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ glassmorphism })
      });
    }
  }, [glassmorphism, isPremium]);

  const handleSetBgColor = async (color: string) => {
    scopedStorage.setItem("app-background-color", color);
    scopedStorage.removeItem("app-background");
    window.dispatchEvent(new CustomEvent("app-background-color-change", { detail: color }));
    window.dispatchEvent(new CustomEvent("app-background-change", { detail: null }));

    if (isPremium) {
      await fetch(API_BASE_URL + '/api/auth/update-pro-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
        },
        body: JSON.stringify({ backgroundColor: color, backgroundUrl: "" })
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        scopedStorage.setItem("app-background", result);
        scopedStorage.removeItem("app-background-color");
        window.dispatchEvent(new CustomEvent("app-background-change", { detail: result }));
        window.dispatchEvent(new CustomEvent("app-background-color-change", { detail: null }));

        if (isPremium) {
          await fetch(API_BASE_URL + '/api/auth/update-pro-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`
            },
            body: JSON.stringify({ backgroundUrl: result, backgroundColor: "" })
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => {
    const syncCount = () => {
      try {
        const stored = scopedStorage.getItem('booran_blocked_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setBlockedCount(parsed.length);
          } else {
            setBlockedCount(12);
          }
        } else {
          setBlockedCount(12);
        }
      } catch (_) {
        setBlockedCount(12);
      }
    };

    syncCount();
    window.addEventListener('booran-blocked-sync', syncCount);
    window.addEventListener('focus', syncCount);

    return () => {
      window.removeEventListener('booran-blocked-sync', syncCount);
      window.removeEventListener('focus', syncCount);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-16 relative overflow-y-auto">
      {/* Centered Settings title with neat back arrow aligned left */}
      <header className="relative flex items-center justify-center mb-8 pt-2">
        <button 
          onClick={onBack}
          className="absolute left-0 p-1.5 rounded-full hover:bg-neutral-800 text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <h2 className="text-[19px] font-semibold text-white tracking-wide">Settings</h2>
      </header>

      <main className="space-y-6 max-w-xs mx-auto">
        <div className="space-y-2">
          <div className="w-full bg-black/40 border border-white/10 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide">
            Snaps & Scrolls Quality
          </div>
          
          <div className="space-y-1 pl-1">
            <button
              onClick={() => onToggleDataSaver(true)}
              className="w-full text-left text-[16px] text-white py-2.5 px-3 hover:bg-neutral-900 rounded-lg transition-all flex items-center justify-between"
            >
              <span>Data saver</span>
              {dataSaver && <span className="text-white text-lg font-bold">✓</span>}
            </button>

            <button
              onClick={() => onToggleDataSaver(false)}
              className="w-full text-left text-[16px] text-white py-2.5 px-3 hover:bg-neutral-900 rounded-lg transition-all flex items-center justify-between"
            >
              <span>Original</span>
              {!dataSaver && <span className="text-white text-lg font-bold">✓</span>}
            </button>
          </div>
        </div>

        {/* Blocked Users Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToBlocked}
            className="w-full bg-black/40 border border-white/10 hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center justify-between transition-all"
          >
            <span>Blocked users</span>
            <span className="text-zinc-400 font-normal mr-1">{blockedCount}</span>
          </button>
        </div>

        {/* Edit Section */}
        <div className="space-y-2">
          <button
            onClick={() => {
              // Toggle edit section
              const el = document.getElementById('edit-submenu');
              if (el) {
                el.classList.toggle('hidden');
              }
            }}
            className="w-full bg-black/40 border border-white/10 hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center gap-2.5 transition-all text-left"
          >
            <UserCog className="w-5 h-5 text-white shrink-0" />
            <span>Edit</span>
          </button>
          
          <div id="edit-submenu" className="hidden pl-6 pr-2 py-2 space-y-2 border-l-2 border-white/10 ml-2 animate-in slide-in-from-top-2">
            <button
              onClick={onNavigateToEditProfilePic}
              className="w-full bg-transparent hover:bg-white/5 text-white px-4 py-2.5 rounded-lg text-sm font-normal tracking-wide text-left transition-all"
            >
              Edit profile pic
            </button>
            <button
              onClick={onNavigateToEditCredentials}
              className="w-full bg-transparent hover:bg-white/5 text-white px-4 py-2.5 rounded-lg text-sm font-normal tracking-wide text-left transition-all"
            >
              Edit username & password
            </button>
          </div>
        </div>

        {/* Terms and conditions Section */}
        <div className="space-y-2">
          <button
            className="w-full bg-black/40 border border-white/10 hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center justify-between transition-all"
          >
            <span>Terms and conditions</span>
          </button>
        </div>

        {/* Privacy Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToPrivacy}
            className="w-full bg-black/40 border border-white/10 hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center gap-2.5 transition-all text-left"
          >
            <Lock className="w-5 h-5 text-white shrink-0" />
            <span>Privacy & Security</span>
          </button>
        </div>

        {/* PRO CUSTOMIZATION SECTION */}
        {isPremium && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-neutral-400">Pro Customization</h3>
            </div>

            <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl space-y-5">
              {/* Background Image Upload */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <Image className="w-3.5 h-3.5" /> Background Image
                </label>
                <div
                  onClick={() => document.getElementById('bg-upload')?.click()}
                  className="w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all"
                >
                  <Plus className="w-6 h-6 text-neutral-500 mb-1" />
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Select Wall</span>
                  <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Background Color Presets */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <Palette className="w-3.5 h-3.5" /> Solid Colors
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {['#000000', '#0a0a0c', '#1a1c1d', '#0c1421', '#1a0b12'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleSetBgColor(color)}
                      className="w-8 h-8 rounded-full border border-white/10 transition-transform active:scale-90"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Brightness Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                    <Sun className="w-3.5 h-3.5" /> Brightness
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">{Math.round(bgBrightness * 100)}%</span>
                </div>
                <input
                  type="range" min="0.1" max="1" step="0.05"
                  value={bgBrightness}
                  onChange={(e) => setBgBrightness(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Glassmorphism Toggle */}
              <div
                onClick={() => setGlassmorphism(!glassmorphism)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-bold text-neutral-300">Glassmorphism Blur</span>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${glassmorphism ? 'bg-blue-600' : 'bg-neutral-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${glassmorphism ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className="pt-6 space-y-3">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-neutral-400 hover:text-red-400 px-4 py-3 rounded-xl text-[14px] font-semibold tracking-wide transition-all"
          >
            Log out
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-transparent text-neutral-600 hover:text-neutral-400 text-[12px] font-medium transition-all"
          >
            Log out from all devices
          </button>
        </div>
      </main>

      {/* Confirmation Modals */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-neutral-900 border border-white/10 p-6 rounded-[2rem] w-full max-w-xs text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2">Log out?</h3>
            <p className="text-neutral-400 text-sm mb-6">You will need to enter your passcode to log back in.</p>
            <div className="space-y-3">
              <button
                onClick={onLogout}
                className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Log out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-2xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-neutral-900 border border-white/10 p-6 rounded-[2rem] w-full max-w-xs text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-red-500">Global logout</h3>
            <p className="text-neutral-400 text-sm mb-6">This will sign you out of every device currently logged into your account.</p>
            <div className="space-y-3">
              <button
                onClick={onLogoutAllDevices}
                className="w-full bg-white text-black py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Sign out everywhere
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-2xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
