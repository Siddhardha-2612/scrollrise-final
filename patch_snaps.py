import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """          {/* ROW 3: Instagram-Style Live Feed Stream */}
          <section className="space-y-4 pt-4 pb-8 border-t border-white/5 mt-2">
            <button
              className="flex w-[calc(100%-8px)] mx-1 bg-[#222222] hover:bg-[#2a2a2a] rounded-[24px] py-4 justify-center items-center gap-2 mb-4 transition-colors shadow-lg"
              onClick={() => {
                setActiveFeedTab("snaps");
                setVirals((prev) => {
                  const adPosts = prev.filter((p) =>
                    p.id?.startsWith("ad-"),
                  );
                  const regularPosts = prev.filter(
                    (p) => !p.id?.startsWith("ad-"),
                  );
                  regularPosts.sort(() => Math.random() - 0.5);

                  const combined = [];
                  let adIdx = 0;
                  let regIdx = 0;
                  while (
                    regIdx < regularPosts.length ||
                    adIdx < adPosts.length
                  ) {
                    if (
                      combined.length > 0 &&
                      combined.length % 5 === 0 &&
                      adIdx < adPosts.length
                    ) {
                      combined.push(adPosts[adIdx++]);
                    } else if (regIdx < regularPosts.length) {
                      combined.push(regularPosts[regIdx++]);
                    } else if (adIdx < adPosts.length) {
                      combined.push(adPosts[adIdx++]);
                    } else break;
                  }
                  return combined;
                });
              }}
            >
              <Image className="w-5 h-5 text-white" />
              <span className="text-white text-[17px] font-normal tracking-wide">Snaps</span>
            </button>

            <div className="space-y-6">"""

replacement = """          {/* ROW 3: Instagram-Style Live Feed Stream */}
          <section className="space-y-4 pt-4 pb-8 border-t border-white/5 mt-2">
            <div className="relative w-[calc(100%-8px)] mx-1 mb-4">
              <button
                className="flex w-full bg-[#222222] hover:bg-[#2a2a2a] rounded-[24px] py-4 justify-center items-center gap-2 transition-colors shadow-lg"
                onClick={() => {
                  setActiveFeedTab("snaps");
                  setVirals((prev) => {
                    const adPosts = prev.filter((p) =>
                      p.id?.startsWith("ad-"),
                    );
                    const regularPosts = prev.filter(
                      (p) => !p.id?.startsWith("ad-"),
                    );
                    regularPosts.sort(() => Math.random() - 0.5);

                    const combined = [];
                    let adIdx = 0;
                    let regIdx = 0;
                    while (
                      regIdx < regularPosts.length ||
                      adIdx < adPosts.length
                    ) {
                      if (
                        combined.length > 0 &&
                        combined.length % 5 === 0 &&
                        adIdx < adPosts.length
                      ) {
                        combined.push(adPosts[adIdx++]);
                      } else if (regIdx < regularPosts.length) {
                        combined.push(regularPosts[regIdx++]);
                      } else if (adIdx < adPosts.length) {
                        combined.push(adPosts[adIdx++]);
                      } else break;
                    }
                    return combined;
                  });
                }}
              >
                <Image className="w-5 h-5 text-white" />
                <span className="text-white text-[17px] font-normal tracking-wide">Snaps</span>
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-orange-500 rounded px-2.5 py-1 shadow-md hover:scale-105 active:scale-95 transition-transform"
              >
                <span className="text-white font-bold text-xs tracking-wider">PRO</span>
              </button>
            </div>

            <div className="space-y-6">"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully.")
else:
    print("Target not found.")
