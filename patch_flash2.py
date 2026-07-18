import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """            <button
              className="w-full bg-[#1e1e1e] border border-white/5 text-white p-5 rounded-[20px] font-bold text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
              onClick={() => {
                const postId = postAddMenu;
                setPostAddMenu(null);
                setPostFlashPermission(postId);
              }}
            >
              <div className="flex-1 flex justify-center items-center">
                <span className="pl-6">Add to Flash</span>
              </div>
              <span className="text-[#0091FF] text-2xl font-black mr-2">›</span>
            </button>
            
            <button
              className="w-full bg-[#2a2a2a] border border-white/5 text-white p-5 rounded-[20px] font-normal text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
              onClick={() => {
                setPostAddMenu(null);
                triggerToast("Post added to your scroll stream.");
              }}
            >
              <div className="flex-1 flex justify-center items-center">
                <span className="pl-6">Add to scroll</span>
              </div>
              <span className="text-[#0055FF] text-2xl font-black mr-2">›</span>
            </button>"""

replacement = """            <button
              className="w-full bg-[#1e1e1e] border border-white/5 text-white p-5 rounded-[20px] font-bold text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
              onClick={() => {
                const postId = postAddMenu;
                setPostAddMenu(null);
                setPostFlashPermission(postId);
              }}
            >
              <div className="flex-1 flex justify-center items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="pl-2">Add to Flash</span>
              </div>
              <span className="text-[#0091FF] text-2xl font-black mr-2">›</span>
            </button>
            
            <button
              className="w-full bg-[#2a2a2a] border border-white/5 text-white p-5 rounded-[20px] font-normal text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
              onClick={() => {
                setPostAddMenu(null);
                triggerToast("Post added to your scroll stream.");
              }}
            >
              <div className="flex-1 flex justify-center items-center gap-2">
                <Film className="w-5 h-5 text-blue-400" />
                <span className="pl-2">Add to scroll</span>
              </div>
              <span className="text-[#0055FF] text-2xl font-black mr-2">›</span>
            </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched flash2 successfully.")
else:
    print("Target not found.")
