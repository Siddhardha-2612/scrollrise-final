import React, { useState } from 'react';
import { ArrowLeft, User, Image as ImageIcon, Check, Trash2, Camera } from 'lucide-react';
import { DynamicElegantStorySquircle } from './DynamicElegantStorySquircle';
import ProfilePicEditor from './ProfilePicEditor';

interface EditProfilePicGridDashboardProps {
  onBack: () => void;
  currentAvatar: string;
  onSelectAvatar: (url: string) => void;
}

export default function EditProfilePicGridDashboard({
  onBack,
  currentAvatar,
  onSelectAvatar
}: EditProfilePicGridDashboardProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = () => {
    // Reset to empty string (which returns the standard grey avatar)
    onSelectAvatar('');
    showToast('Profile photo removed.');
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPendingAvatar(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (pendingAvatar) {
    return (
      <ProfilePicEditor
        image={pendingAvatar}
        onCancel={() => setPendingAvatar(null)}
        onApply={(croppedImage) => {
          setIsUpdating(true);
          onSelectAvatar(croppedImage);
          setPendingAvatar(null);
          setIsUpdating(false);
          showToast('Profile photo updated!');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="flex items-center space-x-4 mb-12 relative z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5.5 h-5.5" />
        </button>
        <div>
          <h2 className="text-[20px] font-bold font-display tracking-tight text-white leading-tight">Edit profile pic</h2>
          <p className="text-xs text-neutral-500 font-medium">Customize your digital identity</p>
        </div>
      </header>

      <main className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-10 relative z-10">
        {/* Large Centered Avatar using the DynamicElegantStorySquircle for consistency */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            {/* Outer Glow */}
            <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />

            <DynamicElegantStorySquircle size={120}>
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Active display"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-[40%] h-[40%] text-neutral-500" />
              )}
            </DynamicElegantStorySquircle>

            {/* Floating Camera Icon */}
            <button
               onClick={() => document.getElementById('profile-pic-upload')?.click()}
               className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-600 rounded-full border-2 border-black flex items-center justify-center text-white shadow-lg hover:bg-blue-500 transition-colors active:scale-90"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Toast info bar */}
          <div className="h-8 flex items-center justify-center">
            {toast && (
              <div className="bg-white/5 border border-white/20 px-4 py-1.5 rounded-full text-[12px] text-white font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>{toast}</span>
              </div>
            )}
            {isUpdating && (
              <div className="flex items-center gap-2 text-neutral-500 text-xs animate-pulse">
                <div className="w-3 h-3 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                <span>Updating profile...</span>
              </div>
            )}
          </div>

          {/* Horizontal Action Chips */}
          <div className="flex flex-col items-center w-full space-y-3">
            <button
              onClick={() => document.getElementById('profile-pic-upload')?.click()}
              className="w-full max-w-[240px] px-6 py-4 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
            >
              <ImageIcon className="w-4 h-4" />
              Choose from Gallery
            </button>

            <button
              onClick={handleRemove}
              disabled={!currentAvatar}
              className="w-full max-w-[240px] px-6 py-4 rounded-2xl bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Remove current photo
            </button>

            <input
              type="file" 
              id="profile-pic-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleGalleryUpload} 
            />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-[280px]">
          <h3 className="text-neutral-200 font-semibold text-sm">Public visibility</h3>
          <p className="text-xs text-neutral-500">
            Your profile picture is visible to everyone on the network. Make sure it represents you well.
          </p>
        </div>
      </main>

      <footer className="absolute bottom-12 left-0 right-0 text-center text-[10px] text-neutral-700 font-medium uppercase tracking-widest pointer-events-none">
        Scrollrise Identity Protocol v2.0
      </footer>
    </div>
  );
}
