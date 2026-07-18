import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """import {
  Bell,
  MessageSquare,
  Search,
  Plus,
  Compass,"""

replacement = """import {
  Bell,
  MessageSquare,
  Search,
  Plus,
  Compass,
  UserCog,"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched lucide import.")
else:
    print("Target not found.")
