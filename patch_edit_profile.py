import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """      {/* PRO Options Modal */}
      {showProModal && document.getElementById("modal-portal-root") && createPortal("""

replacement = """      {/* Edit Profile Modal */}
      {showEditProfile && document.getElementById("modal-portal-root") && createPortal(
        <div className="absolute inset-0 z-[110000] pointer-events-auto bg-black flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black">
            <button
              onClick={() => setShowEditProfile(false)}
              className="text-white hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[22px] font-black tracking-tight text-white font-sans">EDIT PROFILE</span>
            </div>
            <div className="w-6" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400">Profile Picture</label>
                <div className="w-24 h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center relative cursor-pointer group" onClick={() => triggerToast("Avatar update feature locked in Sandbox.")}>
                  <img src={currentUserAvatar} alt="Profile" className="w-full h-full object-cover rounded-full opacity-50 group-hover:opacity-30 transition-opacity" />
                  <Camera className="w-6 h-6 absolute text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400">Username</label>
                <input type="text" defaultValue={currentUsername} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <button 
                onClick={() => {
                  triggerToast("Profile updated!");
                  setShowEditProfile(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors mt-4"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal-root")!
      )}

      {/* PRO Options Modal */}
      {showProModal && document.getElementById("modal-portal-root") && createPortal("""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched Edit Profile Modal.")
else:
    print("Target not found.")
