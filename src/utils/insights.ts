import { scopedStorage } from "./storage";
import { getHumanAvatar } from '../utils/avatar';

export interface PostInsightUser {
  id: string;
  name: string;
  avatar: string;
  time: string;
  timestamp?: number;
  stared: boolean;
  reported: boolean;
}

export function fetchOrCreatePostInsights(postId: string): PostInsightUser[] {
  try {
    const key = `booran_insights_${postId}`;
    const stored = scopedStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}

  const isUserPost = postId.startsWith("user-post-");
  let postCreationTime = Date.now() - 24 * 60 * 60 * 1000;
  if (isUserPost) {
    const parts = postId.split("-");
    const ts = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(ts)) {
      postCreationTime = ts;
    }
    
    const initialList = [{
      id: "you",
      name: "You",
      avatar: getHumanAvatar("booran"),
      time: "",
      timestamp: postCreationTime,
      stared: false,
      reported: false
    }];
    
    try {
      scopedStorage.setItem(`booran_insights_${postId}`, JSON.stringify(initialList));
    } catch (e) {}
    
    return initialList;
  }

  const baseUsersList = [
    { name: "Sophia Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
    { name: "Raj Patel", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" },
    { name: "Elena Rodriguez", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" },
    { name: "David Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    { name: "Aisha Taylor", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
    { name: "Michael Chang", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
    { name: "Zack Holmes", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
    { name: "Diana Prince", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
    { name: "Sarah Connor", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop" },
    { name: "Vikram Sen", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
    { name: "Lars Ulrich", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop" },
    { name: "Isabella Moore", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop" },
    { name: "Sofia Jackson", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
    { name: "Yuki Tanaka", avatar: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=100&h=100&fit=crop" },
    { name: "Liam Smith", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop" },
    { name: "Emma Lopez", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop" },
    { name: "Olivia Gonzalez", avatar: "https://images.unsplash.com/photo-1534751516642-a131ffd473fd?w=100&h=100&fit=crop" },
    { name: "Charlotte Thomas", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop" },
    { name: "Ava Taylor", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
  ];

  const watchedUsersCount = 1452;

  const generated = Array.from({ length: watchedUsersCount }).map((_, i) => {
    const baseUser = baseUsersList[i % baseUsersList.length];
    
    let stared = false;
    let reported = false;
    if (i < 6) {
      stared = [true, false, true, false, true, false][i];
      reported = [false, false, true, false, false, true][i];
    } else {
      stared = i >= 6 && i <= 136;
      reported = i >= 137 && i <= 155;
    }

    const viewTimestamp = postCreationTime + Math.random() * (Date.now() - postCreationTime);

    const name = i < 6 ? baseUser.name : `${baseUser.name} #${i + 1}`;
    const avatar = i < 6 ? baseUser.avatar : `https://i.pravatar.cc/100?img=${((i + 12) % 70) + 1}`;

    return {
      id: `w-${postId}-${i}`,
      name,
      avatar,
      time: "",
      timestamp: viewTimestamp,
      stared,
      reported,
    };
  });

  generated.sort((a, b) => b.timestamp - a.timestamp);

  try {
    scopedStorage.setItem(`booran_insights_${postId}`, JSON.stringify(generated));
  } catch (e) {}

  return generated;
}

export function trackUserInteractionInInsights(postId: string, action: "watch" | "star" | "unstar" | "report" | "delete", username: string = "You") {
  const list = fetchOrCreatePostInsights(postId);
  const youIdx = list.findIndex((u) => u.id === "you");
  
  if (action === "watch") {
    if (youIdx === -1) {
      list.unshift({
        id: "you",
        name: `${username} (@you)`,
        avatar: getHumanAvatar("booran"),
        time: "",
        timestamp: Date.now(),
        stared: false,
        reported: false
      });
    }
  } else if (action === "star") {
    if (youIdx === -1) {
      list.unshift({
        id: "you",
        name: `${username} (@you)`,
        avatar: getHumanAvatar("booran"),
        time: "",
        timestamp: Date.now(),
        stared: true,
        reported: false
      });
    } else {
      list[youIdx].stared = true;
    }
  } else if (action === "unstar") {
    if (youIdx !== -1) {
      list[youIdx].stared = false;
    }
  } else if (action === "report") {
    if (youIdx === -1) {
      list.unshift({
        id: "you",
        name: `${username} (@you)`,
        avatar: getHumanAvatar("booran"),
        time: "",
        timestamp: Date.now(),
        stared: false,
        reported: true
      });
    } else {
      list[youIdx].reported = true;
    }
  }

  try {
    scopedStorage.setItem(`booran_insights_${postId}`, JSON.stringify(list));
  } catch (e) {}
}
