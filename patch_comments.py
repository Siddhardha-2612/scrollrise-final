import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """      {showShareSheet && <ShareSheetModal onClose={() => setShowShareSheet(false)} activePostSrc={activeShareSrc || undefined} activePostMediaType={activeShareMediaType} />}"""

replacement = """      {activeCommentsPost && (
        <div className="fixed inset-0 z-[100000] bg-black/20 flex flex-col items-center justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121214] rounded-t-3xl h-[50vh] flex flex-col shadow-2xl overflow-hidden border-t border-white/10 relative">
            <div className="flex items-center justify-center p-3 border-b border-white/5 relative">
              <span className="font-bold text-white text-sm tracking-widest uppercase">
                Comments
              </span>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="absolute right-4 text-zinc-400 hover:text-white p-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {(commentsMap[activeCommentsPost] || []).length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full text-zinc-500 text-sm">
                  No comments yet. Be the first!
                </div>
              ) : (
                (commentsMap[activeCommentsPost] || []).map((comment) => (
                  <div key={comment.id} className="flex space-x-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white uppercase text-center align-middle relative">
                      {comment.author.charAt(1) || "A"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-zinc-200 font-bold text-[13px]">
                          {comment.author}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {comment.time}
                        </span>
                      </div>
                      <span className="text-zinc-300 text-[13px] leading-relaxed mt-0.5">
                        {comment.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = commentInputs[activeCommentsPost] || "";
                if (!text.trim()) return;
                const newComment = {
                  id: `c-dyn-${Date.now()}`,
                  author: "@you",
                  text: text.trim(),
                  time: "Just now",
                };
                setCommentsMap((prev) => ({
                  ...prev,
                  [activeCommentsPost]: [
                    ...(prev[activeCommentsPost] || []),
                    newComment,
                  ],
                }));
                setCommentInputs((prev) => ({
                  ...prev,
                  [activeCommentsPost]: "",
                }));
              }}
              className="p-4 border-t border-white/5 bg-[#0a0a0c] flex items-center space-x-3"
            >
              <input
                type="text"
                autoFocus
                value={commentInputs[activeCommentsPost] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [activeCommentsPost]: e.target.value,
                  }))
                }
                placeholder="Add a comment..."
                className="flex-1 bg-zinc-900/50 rounded-full border border-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                disabled={!(commentInputs[activeCommentsPost] || "").trim()}
                className="text-[#0091FF] font-bold text-sm disabled:opacity-50 transition-opacity"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
      
      {showShareSheet && <ShareSheetModal onClose={() => setShowShareSheet(false)} activePostSrc={activeShareSrc || undefined} activePostMediaType={activeShareMediaType} />}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched comments modal successfully.")
else:
    print("Target not found.")
