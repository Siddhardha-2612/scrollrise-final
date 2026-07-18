import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """                                    <button
                                      onClick={() => {
                                        setActiveShareSrc(post.mediaUrl || null);
                                        const isVideo = post.mediaUrl?.includes(".mp4") || post.mediaType === "video" || post.format === "video";
                                        setActiveShareMediaType(isVideo ? "video" : "image");
                                        setShowShareSheet(true);
                                      }}
                                      className="text-white hover:text-zinc-300 transition-colors"
                                    >
                                      <Share2 className="w-6 h-6 stroke-[2]" />
                                    </button>"""

replacement = """                                    <button
                                      onClick={() => {
                                        setActiveShareSrc(post.mediaUrl || null);
                                        const isVideo = post.mediaUrl?.includes(".mp4") || post.mediaType === "video" || post.format === "video";
                                        setActiveShareMediaType(isVideo ? "video" : "image");
                                        setShowShareSheet(true);
                                      }}
                                      className="text-white hover:text-zinc-300 transition-colors"
                                    >
                                      <Share className="w-6 h-6 stroke-[2]" />
                                    </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched share successfully.")
else:
    print("Target not found.")
