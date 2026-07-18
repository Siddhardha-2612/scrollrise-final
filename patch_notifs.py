import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """        const savedExplore = scopedStorage.getItem(
          "booran_explore_chat_histories",
        );
        if (savedExplore) {
          const histories = JSON.parse(savedExplore);
          Object.values(histories).forEach((msgs: any) => {
            count += msgs.length;
          });
        }"""

replacement = """        const savedExplore = scopedStorage.getItem(
          "booran_explore_chat_histories",
        );
        if (savedExplore) {
          const histories = JSON.parse(savedExplore);
          count += Object.keys(histories).length;
        }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched ChannelFeedDashboard notifs.")
else:
    print("Target not found in ChannelFeedDashboard.")
