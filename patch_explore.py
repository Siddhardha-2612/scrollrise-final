import sys

with open('src/components/ExploreRequestsPanel.tsx', 'r') as f:
    content = f.read()

target = """  useEffect(() => {
    if (totalRawNotifications < seenNotificationsCount) {
      scopedStorage.setItem(
        "booran_seen_notifications_count",
        totalRawNotifications.toString(),
      );
      setSeenNotificationsCount(totalRawNotifications);
    }
  }, [totalRawNotifications, seenNotificationsCount]);"""

replacement = """  useEffect(() => {
    // Whenever this panel renders, if notifications exist, clear the global red dot for the bell.
    if (totalRawNotifications !== seenNotificationsCount) {
      scopedStorage.setItem(
        "booran_seen_notifications_count",
        totalRawNotifications.toString(),
      );
      setSeenNotificationsCount(totalRawNotifications);
    }
  }, [totalRawNotifications, seenNotificationsCount]);"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ExploreRequestsPanel.tsx', 'w') as f:
        f.write(content)
    print("Patched ExploreRequestsPanel.")
else:
    print("Target not found.")
