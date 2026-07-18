import sys

with open('src/components/ChannelFeedDashboard.tsx', 'r') as f:
    content = f.read()

target = """  useEffect(() => {
    // If notifications drop below what we've seen (e.g. they get accepted/cleared), adjust seen count down so we don't have a negative baseline forever
    if (totalRawNotifications < seenNotificationsCount) {
      scopedStorage.setItem(
        "booran_seen_notifications_count",
        totalRawNotifications.toString(),
      );
      setSeenNotificationsCount(totalRawNotifications);
    }
  }, [totalRawNotifications, seenNotificationsCount]);"""

replacement = """  useEffect(() => {
    const handleSync = () => {
      const storedSeen = parseInt(scopedStorage.getItem("booran_seen_notifications_count") || "0", 10);
      setSeenNotificationsCount(storedSeen);
    };
    window.addEventListener('booran-msg-notif-sync', handleSync);
    return () => window.removeEventListener('booran-msg-notif-sync', handleSync);
  }, []);

  useEffect(() => {
    // If notifications drop below what we've seen (e.g. they get accepted/cleared), adjust seen count down so we don't have a negative baseline forever
    if (totalRawNotifications < seenNotificationsCount) {
      scopedStorage.setItem(
        "booran_seen_notifications_count",
        totalRawNotifications.toString(),
      );
      setSeenNotificationsCount(totalRawNotifications);
    }
  }, [totalRawNotifications, seenNotificationsCount]);"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/ChannelFeedDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched ChannelFeedDashboard notif sync.")
else:
    print("Target not found.")
