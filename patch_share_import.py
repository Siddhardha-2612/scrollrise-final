# Check if Share is actually imported
with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    print("Share" in f.read())
