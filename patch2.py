import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

with open('/tmp/target.txt', 'r') as f:
    target = f.read()
    
with open('/tmp/replacement2.txt', 'r') as f:
    replacement = f.read()

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully.")
else:
    print("Target not found.")
