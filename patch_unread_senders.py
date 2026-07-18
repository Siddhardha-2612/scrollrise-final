import sys

with open('src/components/ExploreRequestsPanel.tsx', 'r') as f:
    content = f.read()

target = """  const [unreadSenders, setUnreadSenders] = useState<string[]>(() => {
    const saved = scopedStorage.getItem('booran_unread_senders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });"""

replacement = """  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  
  useEffect(() => {
    scopedStorage.setItem('booran_unread_senders', '[]');
  }, []);"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ExploreRequestsPanel.tsx', 'w') as f:
        f.write(content)
    print("Patched unreadSenders to be empty.")
else:
    print("Target not found.")
