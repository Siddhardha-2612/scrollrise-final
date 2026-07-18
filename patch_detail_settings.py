import sys

with open('src/components/DetailSettingsListView.tsx', 'r') as f:
    content = f.read()

target = """        {/* Privacy Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToPrivacy}
            className="w-full bg-[#1E1E1F] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center gap-2.5 transition-all text-left"
          >
            <Lock className="w-5 h-5 text-white shrink-0" />
            <span>Privacy</span>
          </button>
        </div>

        {/* Blocked Users Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToBlocked}
            className="w-full bg-[#1E1E1F] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center justify-between transition-all"
          >
            <span>Blocked users</span>
            <span className="text-zinc-400 font-normal mr-1">{blockedCount}</span>
          </button>
        </div>

        {/* Edit profile pic Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToEditProfilePic}
            className="w-full bg-[#1E1E1F] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center justify-between transition-all"
          >
            <span>Edit profile pic</span>
          </button>
        </div>

        {/* Edit Username & Password Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToEditCredentials}
            className="w-full bg-[#1E1E1F] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center justify-between transition-all"
          >
            <span>Edit username & password</span>
          </button>
        </div>"""

replacement = """        {/* Blocked Users Section */}
        <div className="space-y-2">
          <button
            onClick={onNavigateToBlocked}
            className="w-full bg-[#1E1E1F] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center justify-between transition-all"
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
            className="w-full bg-[#1E1E1F] hover:bg-neutral-800 text-white px-4 py-3 rounded-xl text-[16px] font-normal tracking-wide flex items-center gap-2.5 transition-all text-left"
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
        </div>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/DetailSettingsListView.tsx', 'w') as f:
        f.write(content)
    print("Patched DetailSettingsListView.")
else:
    print("Target not found.")
