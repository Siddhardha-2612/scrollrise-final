import re

with open('src/components/ExploreRequestsPanel.tsx', 'r') as f:
    content = f.read()

# Replace the condition to always true for preview avatar connection status
content = re.sub(
    r'\{connectionList\.some\(c => \s*c\.toLowerCase\(\) === previewAvatar\.name\.toLowerCase\(\) \|\|\s*c\.toLowerCase\(\) === `\@\$\{previewAvatar\.name\.toLowerCase\(\)\.replace\(\/\\s\+\/g, \'_\\\'\)\}`\.toLowerCase\(\)\s*\) \? \(',
    r'{true ? (',
    content
)

# And earlier in that same block, there's a className conditionally applied.
# Let's just find and replace the whole thing safely using regex or just replace checkIsConnected() logic.
