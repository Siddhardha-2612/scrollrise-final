import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      triggerToast("ℹ️ Privacy controls have been moved to Settings.");
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Privacy Guard
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Block status node
                      </span>
                    </div>
                  </button>"""

replacement = """                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      setShowEditProfile(true);
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <UserCog className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Edit
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Profile & details
                      </span>
                    </div>
                  </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched quick menu.")
else:
    print("Target not found.")
