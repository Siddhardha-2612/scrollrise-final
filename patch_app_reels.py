import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """      case "reels":
        return (
          <ReelsView
            onBack={popRoute}"""

replacement = """      case "reels":
        return (
          <ReelsView
            onBack={() => {
              setCurrentRoute("dashboard");
              setActiveTab(0);
            }}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched App.tsx successfully.")
else:
    print("Target not found.")
