import { scopedStorage } from "./storage";

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function cleanupExpiredData() {
  const now = Date.now();

  const keysToClean = [
    "booran_public_posts",
    "booran_story_groups",
    "booran_direct_message_history",
    "booran_explore_chat_histories",
    // Ads might just be inside booran_public_posts or other arrays.
  ];

  keysToClean.forEach((key) => {
    try {
      const stored = scopedStorage.getItem(key);
      if (stored) {
        let data = JSON.parse(stored);
        
        // Some structures are objects (like histories by user), some are arrays
        if (Array.isArray(data)) {
          // Flatten / Check if it's an array of items with createdAt
          const cleanData = data.filter((item) => {
            // For story groups, filter segments
            if (item.stories && Array.isArray(item.stories)) {
              item.stories = item.stories.filter((story: any) => {
                 if (!story.createdAt) return true; // keep if no createdAt yet (or should we delete?)
                 return now - story.createdAt < TWENTY_FOUR_HOURS_MS;
              });
              // maybe remove group if empty? 
              // we will just keep the logic simple, check item.createdAt if exists
            }
            if (!item.createdAt && !item.timestamp) return true;
            const itemTime = item.createdAt || item.timestamp;
            return now - itemTime < TWENTY_FOUR_HOURS_MS;
          });
          scopedStorage.setItem(key, JSON.stringify(cleanData));
        } else if (typeof data === "object" && data !== null) {
          // Object map (like chat histories where key is user, value is array of messages)
          let hasChanges = false;
          for (const dictKey in data) {
            const arr = data[dictKey];
            if (Array.isArray(arr)) {
              data[dictKey] = arr.filter((msg) => {
                 if (!msg.createdAt && !msg.timestamp) return true;
                 const msgTime = msg.createdAt || msg.timestamp;
                 return now - msgTime < TWENTY_FOUR_HOURS_MS;
              });
              hasChanges = true;
            }
          }
          if (hasChanges) {
            scopedStorage.setItem(key, JSON.stringify(data));
          }
        }
      }
    } catch (e) {
      console.error("Cleanup error for key", key, e);
    }
  });
}
