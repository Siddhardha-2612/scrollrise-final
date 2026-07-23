import { scopedStorage, getAds } from "../utils/storage";
import {
  fetchOrCreatePostInsights,
  trackUserInteractionInInsights,
  PostInsightUser,
} from "../utils/insights";
import React, { useState, useEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  Bell,
  Link2,
  Link2Off,
  User,
  Sparkles,
  Trophy,
  Tv,
  Users,
  Settings, UserCog,
  CreditCard,
  Image,
  Compass,
  Plus,
  Minus,
  Grid,
  HelpCircle,
  Shield,
  ShoppingBag,
  Award,
  Check,
  X,
  UserCheck,
  UserX,
  Link,
  Star,
  QrCode,
  ChevronRight,
  Share2,
  ArrowRight,
  MoreHorizontal,
  ArrowLeft,
  Smartphone, Camera, AlertCircle
} from "lucide-react";
import StoriesManager, {
  StoryGroup,
  INITIAL_STORY_GROUPS,
} from "./StoriesView";
import StarDoubleTap from "./StarDoubleTap";
import CrystalStarIcon from "./CrystalStarIcon";
import { DynamicElegantStorySquircle } from "./DynamicElegantStorySquircle";
import QRCodeLib from "qrcode";
import QRCode from "react-qr-code";
import { ShareSheetModal } from "./ShareSheetModal";
import { getHumanAvatar } from '../utils/avatar';
import { api } from '../services/api';
import { socket } from '../utils/socket';

interface ChannelFeedDashboardProps {
  feedRefreshTrigger?: number;
  currentUserAvatar: string;
  username?: string;
  onOpenDMs: (targetUser?: string) => void;
  onNavigateToSettings: () => void;
  onExploreSelected?: () => void;
  onShopiSelected?: () => void;
  onOpenConnectionsHub?: (username?: string) => void;
  onOpenQRProfile?: () => void;
  onOpenCreatePost?: () => void;
  onViralSelected?: (id: string) => void;
  onPushRoute?: (route: any) => void;
  onOpenCamera?: () => void;
  dataSaverEnabled?: boolean;
  connectionList?: string[];
  isPremium?: boolean;
}

const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) return '1h ago';
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

interface FeedItem {
  id: string;
  name: string;
  image: string;
  detailText: string;
  music?: string;
  time?: string;
  timestamp?: number;
  createdAt?: number;
  format?: "photo" | "video";
  mediaUrl?: string;
  mediaType?: "image" | "video";
  link?: string;
  contact?: string;
  visibility?: string;
  overlayText?: string;
  textStyleIdx?: number;
  textPosX?: number;
  textPosY?: number;
  magicEffectStyle?: number;
  authorAvatar?: string;
  likes?: string[];
  comments?: any[];
}

function FeedMedia({
  post,
  dataSaverEnabled,
}: {
  post: any;
  dataSaverEnabled: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const fallbackImage =
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=100&w=1200&auto=format&fit=crop";
  const imageSrc = hasError ? fallbackImage : post.image || fallbackImage;

  useEffect(() => {
    if (imageSrc.startsWith("data:")) {
      setIsLoaded(true);
    }
  }, [imageSrc]);

  return (
    <div className="relative w-full overflow-hidden bg-[#0f0f12]">
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#0f0f12] flex items-center justify-center z-0" />
      )}
      {post.format === "video" ? (
        <div 
          className="relative cursor-pointer w-full flex justify-center items-center"
          onClick={() => setIsMuted((m) => !m)}
        >
          <video
            src={imageSrc}
            className={`w-full h-auto object-contain ${
              dataSaverEnabled ? "blur-[2px]" : ""
            }`}
            loop
            muted={isMuted}
            autoPlay
            playsInline
            onLoadedData={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              setIsLoaded(true);
            }}
          />
          {isLoaded && (
            <div className="absolute bottom-3 right-3 bg-black/20 backdrop-blur-sm p-1.5 rounded-full hover:bg-black/20 transition text-white text-xs z-10 flex items-center gap-1">
              <span>{isMuted ? "🔇" : "🔊"}</span>
              <span className="text-[9px] font-bold uppercase font-mono mr-1">
                {isMuted ? "Muted" : "Unmuted"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <img
          src={imageSrc}
          alt="Post asset content"
          className={`w-full h-auto object-contain ${
            dataSaverEnabled ? "blur-[2px]" : ""
          }`}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      )}
    </div>
  );
}

function AdVideoPlayer({ src }: { src: string }) {
  const [isMuted, setIsMuted] = useState(true);
  return (
    <div 
      className="w-full relative bg-neutral-900 border-y border-white/5 group cursor-pointer aspect-video flex justify-center items-center"
      onClick={() => setIsMuted((m) => !m)}
    >
      <video
        src={src}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        autoPlay
        loop
      />
      <div className="absolute bottom-3 right-3 bg-black/20 backdrop-blur-sm p-1.5 rounded-full hover:bg-black/20 transition text-white text-xs z-10 flex items-center gap-1">
        <span>{isMuted ? "🔇" : "🔊"}</span>
        <span className="text-[9px] font-bold uppercase font-mono mr-1">
          {isMuted ? "Muted" : "Unmuted"}
        </span>
      </div>
    </div>
  );
}

export default function ChannelFeedDashboard({
  feedRefreshTrigger,
  currentUserAvatar,
  username,
  onOpenDMs,
  onNavigateToSettings,
  onExploreSelected,
  onShopiSelected,
  onOpenConnectionsHub,
  onOpenQRProfile,
  onOpenCreatePost,
  onViralSelected,
  onPushRoute,
  onOpenCamera,
  dataSaverEnabled,
  connectionList = [],
  isPremium,
}: ChannelFeedDashboardProps) {
  // Toast state inside dashboard
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000); // 30 seconds
    return () => clearInterval(timer);
  }, []);

  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showShareSheet, setShowShareSheet] = useState<boolean>(false);
  const [activeShareSrc, setActiveShareSrc] = useState<string | null>(null);
  const [activeShareMediaType, setActiveShareMediaType] = useState<'image' | 'video'>('video');
  const [postAddMenu, setPostAddMenu] = useState<string | null>(null);
  const [postAddMenuPos, setPostAddMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [postFlashPermission, setPostFlashPermission] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);

  const generateNewFlashRef = React.useRef<() => void>(() => {});

  // Save changes to storyGroups
  useEffect(() => {
    try {
      scopedStorage.setItem("booran_story_groups", JSON.stringify(storyGroups));
    } catch {
      console.warn("Storage quota exceeded for stories.");
    }
  }, [storyGroups]);

  // Keep the "you" story group avatar synced with the global avatar
  useEffect(() => {
    setStoryGroups((prev) => {
      const copy = [...prev];
      const youIndex = copy.findIndex((g) => g.userId === "you");
      if (youIndex !== -1 && copy[youIndex].userAvatar !== currentUserAvatar) {
        copy[youIndex] = { ...copy[youIndex], userAvatar: currentUserAvatar };
        return copy;
      }
      return prev;
    });
  }, [currentUserAvatar]);

  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<
    number | null
  >(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isViewingStories, setIsViewingStories] = useState<boolean>(false);
  const [isCreatingStory, setIsCreatingStory] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("stories-camera-active", {
        detail: { active: isCreatingStory || isViewingStories },
      })
    );
  }, [isCreatingStory, isViewingStories]);

  const [pendingConnections, setPendingConnections] = useState<
    {
      id: string;
      name: string;
      avatar: string;
      info: string;
      requested?: boolean;
    }[]
  >(() => {
    const saved = scopedStorage.getItem("booran_pending_connections");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0)
          return parsed.filter((p: any) => p && typeof p.name === "string");
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    scopedStorage.setItem(
      "booran_pending_connections",
      JSON.stringify(pendingConnections),
    );
  }, [pendingConnections]);

  useEffect(() => {
    setStoryGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      let changed = false;

      connectionList.forEach((connName) => {
        const username = `@${connName.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
        const exists = newGroups.some((g) => g.username === username);

        if (!exists && connName !== "User") {
          newGroups.push({
            userId: `u_${Date.now()}_${Math.random()}`,
            username,
            userAvatar: getHumanAvatar(String(connName)),
            hasUnseen: true,
            stories: [
              {
                id: `s_${Date.now()}_${Math.random()}`,
                type: "image",
                url: getHumanAvatar(String(connName)),
                duration: 5,
                timestamp: "2h",
              },
            ],
          });
          changed = true;
        }
      });

      return changed ? newGroups : prevGroups;
    });
  }, [connectionList]);

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activityNotificationsCount, setActivityNotificationsCount] =
    useState<number>(() => {
      let count = 0;
      try {
        const savedExplore = scopedStorage.getItem(
          "booran_explore_chat_histories",
        );
        if (savedExplore) {
          const parsed = JSON.parse(savedExplore);
          Object.keys(parsed).forEach((key) => {
            const msgs = parsed[key];
            if (
              Array.isArray(msgs) &&
              msgs.filter((m) => m.sender === "them" || m.sender === "user")
                .length > 0
            ) {
              count++;
            }
          });
        }
      } catch {}

      try {
        const savedDm = scopedStorage.getItem("booran_direct_message_history");
        if (savedDm) {
          const parsed = JSON.parse(savedDm);
          if (
            Array.isArray(parsed) &&
            parsed.filter(
              (m: any) => m.sender === "user" || m.sender === "them",
            ).length > 0
          ) {
            count++;
          }
        }
      } catch {}

      try {
        const savedLogs = scopedStorage.getItem("feed_logs");
        if (savedLogs) {
          const parsed = JSON.parse(savedLogs);
          if (Array.isArray(parsed)) {
            count += parsed.filter(
              (log: any) =>
                log && log.text && log.text.toLowerCase().includes("connect"),
            ).length;
          }
        }
      } catch {}

      try {
        const savedStories = scopedStorage.getItem("booran_story_groups");
        if (savedStories) {
          const parsed = JSON.parse(savedStories);
          if (Array.isArray(parsed)) {
            count += parsed.filter(
              (group: any) =>
                group &&
                group.userId !== "you" &&
                group.username !== "your_story" &&
                group.stories &&
                group.stories.length > 0,
            ).length;
          }
        }
      } catch {}

      return Math.min(count, 20);
    });

  // Compute total notifications available
  const totalRawNotifications =
    pendingConnections.filter((c) => c.requested !== false).length +
    activityNotificationsCount;

  const [seenNotificationsCount, setSeenNotificationsCount] = useState<number>(
    () => {
      return parseInt(
        scopedStorage.getItem("booran_seen_notifications_count") || "0",
        10,
      );
    },
  );

  useEffect(() => {
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
  }, [totalRawNotifications, seenNotificationsCount]);

  const unreadCount = Math.max(
    0,
    totalRawNotifications - seenNotificationsCount,
  );
  const displayCount = Math.min(unreadCount, 99);
  const [virals, setVirals] = useState<FeedItem[]>([]);
  const [allVirals, setAllVirals] = useState<FeedItem[]>([]);
  const [viralsPage, setViralsPage] = useState<number>(1);
  const [channelsList, setChannelsList] = useState<FeedItem[]>([]);
  const [connectionsList, setConnectionsList] = useState<FeedItem[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreChannelsRef = useRef<HTMLDivElement>(null);
  const loadMoreConnectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allVirals.length > 0) {
      setVirals(allVirals.slice(0, viralsPage * 10));
    }
  }, [allVirals, viralsPage]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = viralsPage + 1;
          // If we are nearing the end of sliced allVirals, generate and append more mock items!
          if (nextPage * 10 >= allVirals.length && allVirals.length > 0) {
            const extraPosts: FeedItem[] = Array.from({ length: 10 }).map((_, idx) => {
              const basePost = allVirals[idx % allVirals.length];
              const uniqueId = `infinite-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
              const captions = [
                "Absolutely stellar view of the horizon! 🌟",
                "Syncing metrics on high-fidelity channels... ✨",
                "Loving the vibe here, retro star update is solid!",
                "A pristine design setup with beveled features. 📈",
                "Continuing the journey on the decentralized feed...",
                "High stereo feedback locked in. 🎵",
                "Just launched the secondary oscillator modules!",
                "Smooth scrolling feeds and customized widgets.",
                "Captured this beautiful snapshot from the device."
              ];
              return {
                ...basePost,
                id: uniqueId,
                name: `@user_inf_${nextPage}_${idx}`, // unique username to prevent repetitions!
                detailText: captions[idx % captions.length] + ` (Infinite Scroll #${nextPage * 10 + idx + 1})`,
                time: `${idx + 1}H AGO`,
                timestamp: Date.now() - ((idx + 1) * 3600 * 1000),
              };
            });
            setAllVirals((current) => [...current, ...extraPosts]);
          }
          setViralsPage(nextPage);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [allVirals, viralsPage]);

  // High fidelity Instagram state fields
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, boolean>>(
    () => {
      try {
        const stored = scopedStorage.getItem("booran_hidden_posts");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    scopedStorage.setItem("booran_hidden_posts", JSON.stringify(hiddenPostIds));
  }, [hiddenPostIds]);
  const [dashboardConnectedUsers, setDashboardConnectedUsers] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (connectionList) {
      const connectedMap: Record<string, boolean> = {};
      connectionList.forEach(c => {
        connectedMap[c.toLowerCase().replace(/^@+/, "")] = true;
      });
      setDashboardConnectedUsers(prev => {
        let changed = false;
        const next = { ...prev };
        for (const [key] of Object.entries(next)) {
          if (!connectedMap[key.toLowerCase().replace(/^@+/, "")]) {
            changed = true;
            next[key] = false;
          }
        }
        for (const key of Object.keys(connectedMap)) {
          if (!next[key]) {
            changed = true;
            next[key] = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [connectionList]);

  const [starAnimIds, setStarAnimIds] = useState<Record<string, boolean>>({});
  const [activeCommentsPost, setActiveCommentsPost] = useState<string | null>(
    null,
  );
  const [activeInsightsPost, setActiveInsightsPost] = useState<string | null>(
    null,
  );
  const [activeInsightsTab, setActiveInsightsTab] = useState<
    "watched" | "stared" | "reports"
  >("watched");
  const [postMenu, setPostMenu] = useState<{
    id: string;
    isOwner: boolean;
  } | null>(null);
  const [doubleTapHeartPostIds, setDoubleTapHeartPostIds] = useState<
    Record<string, string>
  >({});
  const [starCounts, setStarCounts] = useState<Record<string, number>>({});
  const [doubleTapStoryIds, setDoubleTapStoryIds] = useState<
    Record<string, string>
  >({});
  const [starredStories, setStarredStories] = useState<Record<string, boolean>>(
    {},
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [commentsMap, setCommentsMap] = useState<
    Record<
      string,
      Array<{ id: string; author: string; text: string; time: string }>
    >
  >({
    r1: [
      {
        id: "c1",
        author: "@ambient_glow",
        text: "This oscillator loop is absolute magic! 🔥",
        time: "2h",
      },
      {
        id: "c2",
        author: "@tech_guru",
        text: "The sub bass is incredibly clean.",
        time: "1h",
      },
    ],
    r2: [
      {
        id: "c3",
        author: "@vinyl_head",
        text: "Stunning afternoon vibes here.",
        time: "4h",
      },
    ],
    r3: [
      {
        id: "c4",
        author: "@mod_analog",
        text: "Is it clocked by the master LFO clock?",
        time: "20h",
      },
    ],
  });

  const handleTapProfile = (item: FeedItem) => {
    let targetUsername = item.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!targetUsername.startsWith("@") && item.name.includes(" ")) {
      targetUsername = item.name.toLowerCase().replace(/\s+/g, "_");
    } else if (targetUsername.startsWith("_")) {
      targetUsername = targetUsername.substring(1);
    }
    if (!targetUsername.startsWith("@")) {
      targetUsername = `@${targetUsername}`;
    }

    let groupIndex = storyGroups.findIndex(
      (g) =>
        g.username.toLowerCase() === targetUsername.toLowerCase() ||
        g.userId === item.id,
    );

    if (groupIndex === -1) {
      const newGroup: StoryGroup = {
        userId: item.id,
        username: targetUsername,
        userAvatar: item.authorAvatar || item.image,
        hasUnseen: false,
        stories: [
          {
            id: `${item.id}_s1`,
            mediaUri: item.authorAvatar || item.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=100&w=1200&auto=format&fit=crop",
            mediaType: "image",
            timestamp: "Just now",
            duration: 5,
            caption: `${item.detailText || "Profile showcase highlight."} 🌟 #connected`,
            createdAt: Date.now()
          },
          {
            id: `${item.id}_s2`,
            mediaUri: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=100&w=1200&auto=format&fit=crop",
            mediaType: "image",
            timestamp: "1h ago",
            duration: 5,
            caption:
              "Creative design elements of the network nodes. Synchronized! 📟",
          },
        ],
      };
      const updatedGroups = [...storyGroups, newGroup];
      setStoryGroups(updatedGroups);
      groupIndex = updatedGroups.length - 1;
    }

    setActiveStoryGroupIndex(groupIndex);
    setActiveStoryIndex(0);
    setIsViewingStories(true);
    setIsPlaying(true);
  };

  // Pull-to-refresh gesture tracker states
  const [startY, setStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setPullDistance(75); // Keep indicator visible at default threshold height

    setTimeout(() => {
      // 1. Mark currently rendered virals as viewed
      try {
        const storedViewed = scopedStorage.getItem("booran_viewed_posts");
        const viewedIds = storedViewed ? JSON.parse(storedViewed) : [];
        const newIdsToMark = virals
          .filter(
            (v) =>
              !(
                v.name === username ||
                v.name === `@${username}` ||
                v.name === "@you" ||
                v.name === "you" ||
                v.id.startsWith("user-post")
              ),
          )
          .map((v) => v.id);
        const updatedViewed = Array.from(
          new Set([...viewedIds, ...newIdsToMark]),
        );
        scopedStorage.setItem(
          "booran_viewed_posts",
          JSON.stringify(updatedViewed),
        );
      } catch (e) {
        console.error("Failed to mark posts as viewed", e);
      }

      // 2. Prepend dynamic new interactive logs to the feed logs / notifications row
      const newLog1 = {
        id: `fresh-log-${Date.now()}`,
        text: "⚡ High-fidelity virtual oscillators synced with Booran network!",
        time: "Just now",
      };

      const newLog2 = {
        id: `fresh-log-${Date.now() + 1}`,
        text: "⭐ Star system metrics updated. Added to cloud save profile.",
        time: "Just now",
      };

      setNotifications((prev) => [newLog1, newLog2, ...prev]);

      // 3. Prepend a stunning, real viral post by saving to public posts
      const newViralPost = {
        id: `viral-${Date.now()}`,
        username: "@starlight_retro",
        mediaUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=100&w=1200&auto=format&fit=crop",
        caption:
          "Check out the high-fidelity beveled metallic 3D star update! ⭐ Fully localized with saved high stereo soundtrack feedback. Click to inspect details.",
        mediaType: "photo",
      };

      try {
        const storedString = scopedStorage.getItem("booran_public_posts");
        const userList = storedString ? JSON.parse(storedString) : [];
        scopedStorage.setItem(
          "booran_public_posts",
          JSON.stringify([newViralPost, ...userList]),
        );
      } catch (e) {}

      // 4. Complete states and trigger fetch
      setRefreshTick((prev) => prev + 1);
      setIsRefreshing(false);
      setPullDistance(0);
      generateNewFlashRef.current();
      triggerToast("✨ Feeds updated and synchronized successfully!");
    }, 1250);
  };

  const [activeFeedTab, setActiveFeedTab] = useState<"snaps" | "reels">(
    "snaps",
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const safeGetStorage = (key: string) => {
    try {
      return scopedStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const safeSetStorage = (key: string, value: string) => {
    try {
      scopedStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage set error", e);
    }
  };

  const safeRemoveStorage = (key: string) => {
    try {
      scopedStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage remove error", e);
    }
  };

  const [glassmorphismActive, setGlassmorphismActive] = useState<boolean>(
    safeGetStorage("app-glassmorphism") === "true"
  );
  const [proBgImage, setProBgImage] = useState<string | null>(safeGetStorage("app-background") || null);
  const [proBgColor, setProBgColor] = useState<string | null>(safeGetStorage("app-background-color") || null);
  const [proGlowColor, setProGlowColor] = useState<string | null>(safeGetStorage("app-glow-color") || "cyan");
  const [proBgBrightness, setProBgBrightness] = useState<number>(parseFloat(safeGetStorage("app-background-brightness") || "1"));
  const [colorSliderPercent, setColorSliderPercent] = useState<number>(0);
  const colorSliderRef = useRef<HTMLDivElement>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // REAL-TIME SYNC FROM MONGODB & SOCKET.IO
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [postsData, flashesData] = await Promise.all([
          api.getPosts(),
          api.getFlashes()
        ]);

        const formattedPosts = postsData.map((data: any) => ({
          id: data._id,
          name: data.username || "@anonymous",
          image: data.mediaUrl,
          detailText: data.caption || "",
          music: data.musicTitle || "Original Audio",
          timestamp: new Date(data.createdAt).getTime(),
          format: data.mediaType === "video" ? "video" : "photo",
          likes: data.likes || [],
          comments: data.comments || [],
          ...data
        }));
        setAllVirals(formattedPosts);
        setViralsPage(1);

        const initialCommentsMap: Record<string, any[]> = {};
        postsData.forEach((p: any) => {
          initialCommentsMap[p._id] = (p.comments || []).map((c: any) => ({
             id: c._id,
             author: c.username,
             text: c.text,
             time: 'Just now'
          }));
        });
        setCommentsMap(initialCommentsMap);

        // Process Flashes (Stories)
        const groups: Record<string, StoryGroup> = {};
        flashesData.forEach((f: any) => {
          const userId = f.userId || "unknown";
          if (!groups[userId]) {
            groups[userId] = {
              userId: userId,
              username: f.username || "User",
              userAvatar: getHumanAvatar(f.username || "user"),
              hasUnseen: true,
              stories: []
            };
          }
          groups[userId].stories.push({
            id: f._id,
            mediaUri: f.mediaUrl,
            mediaType: f.mediaType || "image",
            timestamp: formatRelativeTime(new Date(f.createdAt).getTime()),
            duration: 5,
            caption: f.caption,
            createdAt: new Date(f.createdAt).getTime(),
            likes: f.likes || [],
            comments: f.comments || []
          });
        });

        setStoryGroups(prev => {
           const you = prev.find(g => g.userId === "you");
           const otherGroups = Object.values(groups).filter(g => g.username !== username);
           const myGroup = Object.values(groups).find(g => g.username === username);

           const final = [];
           if (you) final.push(you);
           return [...final, ...otherGroups, ...(myGroup ? [myGroup] : [])];
        });

      } catch (err) {
        console.error("Failed to fetch initial feed data:", err);
      }
    };

    fetchInitialData();

    // Socket.io Real-time Listeners
    socket.on('post-update', (newPost) => {
      setAllVirals(prev => [{
        id: newPost._id,
        name: newPost.username,
        image: newPost.mediaUrl,
        detailText: newPost.caption,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        ...newPost
      }, ...prev]);
    });

    socket.on('post-stats-update', (update) => {
      setAllVirals(prev => prev.map(p =>
        p.id === update.id ? { ...p, likes: update.likedBy } : p
      ));
    });

    socket.on('post-comment-update', (update) => {
      setAllVirals(prev => prev.map(p =>
        p.id === update.id ? { ...p, comments: update.comments } : p
      ));

      // Update comments map if used for UI
      setCommentsMap(prev => ({
        ...prev,
        [update.id]: update.comments.map((c: any) => ({
          id: c._id || Math.random().toString(),
          author: c.username,
          text: c.text,
          time: 'Just now'
        }))
      }));
    });

    socket.on('flash-update', () => {
      // Re-fetch flashes when updated
      api.getFlashes().then(flashesData => {
          const groups: Record<string, StoryGroup> = {};
          flashesData.forEach((f: any) => {
            const userId = f.userId || "unknown";
            if (!groups[userId]) {
              groups[userId] = {
                userId: userId,
                username: f.username || "User",
                userAvatar: getHumanAvatar(f.username || "user"),
                hasUnseen: true,
                stories: []
              };
            }
            groups[userId].stories.push({
              id: f._id,
              mediaUri: f.mediaUrl,
              mediaType: f.mediaType || "image",
              timestamp: formatRelativeTime(new Date(f.createdAt).getTime()),
              duration: 5,
              caption: f.caption,
              createdAt: new Date(f.createdAt).getTime(),
              likes: f.likes || [],
              comments: f.comments || []
            });
          });

          setStoryGroups(prev => {
             const you = prev.find(g => g.userId === "you");
             const otherGroups = Object.values(groups).filter(g => g.username !== username);
             const myGroup = Object.values(groups).find(g => g.username === username);
             const final = [];
             if (you) final.push(you);
             return [...final, ...otherGroups, ...(myGroup ? [myGroup] : [])];
          });
      });
    });

    return () => {
      socket.off('post-update');
      socket.off('post-stats-update');
      socket.off('post-comment-update');
      socket.off('flash-update');
    };
  }, [username]);

  // Remove the old useEffect that used refreshTick and localStorage for virals
  useEffect(() => {
    // Disabled old local storage sync to prioritize Firestore real-time sync
  }, [connectionList, username, feedRefreshTrigger]);

  // Background Adjustment States & Handlers
  const [adjustingBgImageSrc, setAdjustingBgImageSrc] = useState<string | null>(null);
  const [bgZoom, setBgZoom] = useState<number>(1);
  const [bgOffset, setBgOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDraggingBg, setIsDraggingBg] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const handleBgDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingBg(true);
    setDragStart({ x: e.clientX - bgOffset.x, y: e.clientY - bgOffset.y });
  };

  const handleBgDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingBg) return;
    setBgOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleBgDragEnd = () => {
    setIsDraggingBg(false);
    setTouchStartDist(null);
  };

  const handleBgTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setIsDraggingBg(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setTouchStartZoom(bgZoom);
    } else if (e.touches.length === 1) {
      setTouchStartDist(null);
      setIsDraggingBg(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - bgOffset.x, y: touch.clientY - bgOffset.y });
    }
  };

  const handleBgTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      const nextZoom = touchStartZoom * factor;
      setBgZoom(Math.min(Math.max(nextZoom, 0.8), 6.0));
    } else if (e.touches.length === 1 && isDraggingBg) {
      const touch = e.touches[0];
      setBgOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleBgWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const delta = e.deltaY < 0 ? 1 : -1;
    setBgZoom((prev) => {
      const next = prev + delta * zoomIntensity;
      return Math.min(Math.max(next, 0.8), 6.0);
    });
  };

  const handleConfirmBgAdjustment = () => {
    if (!adjustingBgImageSrc) return;
    
    const img = new window.Image();
    img.onload = () => {
      const frameW = 280;
      const frameH = 498;
      const scaleFactor = 1080 / frameW;
      
      const imgW = originalImageDimensions.width;
      const imgH = originalImageDimensions.height;
      if (!imgW || !imgH) return;
      
      const imgRatio = imgW / imgH;
      
      let fitW = 0;
      let fitH = 0;
      if (imgW >= imgH) {
        fitH = frameH;
        fitW = frameH * imgRatio;
      } else {
        fitW = frameW;
        fitH = frameW / imgRatio;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1080, 1920);
        
        ctx.save();
        ctx.translate(540, 960);
        
        const canvasOffsetX = bgOffset.x * scaleFactor;
        const canvasOffsetY = bgOffset.y * scaleFactor;
        ctx.translate(canvasOffsetX, canvasOffsetY);
        
        ctx.scale(bgZoom, bgZoom);
        
        const drawW = fitW * scaleFactor;
        const drawH = fitH * scaleFactor;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        
        let quality = 0.85;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        let saved = false;
        while (!saved && quality > 0.1) {
          try {
            safeSetStorage("app-background", result);
            saved = true;
          } catch(e) {
            quality -= 0.15;
            result = canvas.toDataURL('image/jpeg', quality);
          }
        }
        
        setProBgImage(result);
        window.dispatchEvent(new CustomEvent("app-background-change", { detail: result }));
        triggerToast("✨ Custom background applied successfully!");
        setAdjustingBgImageSrc(null);
      }
    };
    img.src = adjustingBgImageSrc;
  };

  useEffect(() => {
    const handleUpdate = () => setRefreshTick((prev) => prev + 1);
    window.addEventListener("booran_posts_updated", handleUpdate);
    window.addEventListener("adsUpdated", handleUpdate);
    
    const handleGoHome = () => {
      setShowProModal(false);
      setShowCreateModal(false);
      setShowShareSheet(false);
    };
    window.addEventListener("go-home", handleGoHome);
    
    return () => {
      window.removeEventListener("booran_posts_updated", handleUpdate);
      window.removeEventListener("adsUpdated", handleUpdate);
      window.removeEventListener("go-home", handleGoHome);
    };
  }, []);

  useEffect(() => {
    const scroller = document.getElementById("main-scroll-container");
    if (scroller) {
      if (showProModal || showCreateModal || showShareSheet || adjustingBgImageSrc) {
        scroller.style.overflow = "hidden";
      } else {
        scroller.style.overflow = "";
      }
    }
  }, [showProModal, showCreateModal, showShareSheet, adjustingBgImageSrc]);

  useEffect(() => {
    const portalRoot = document.getElementById("modal-portal-root");
    if (!portalRoot) return;
    const isAnyModalActive = !!(showCreateModal || showProModal || adjustingBgImageSrc);
    if (isAnyModalActive) {
      portalRoot.classList.remove("pointer-events-none");
      portalRoot.classList.add("pointer-events-auto");
    } else {
      portalRoot.classList.remove("pointer-events-auto");
      portalRoot.classList.add("pointer-events-none");
    }
    return () => {
      portalRoot.classList.remove("pointer-events-auto");
      portalRoot.classList.add("pointer-events-none");
    };
  }, [showCreateModal, showProModal, adjustingBgImageSrc]);

  // Old localStorage useEffect removed in favor of Firestore sync

  // Dynamic Notification logs state with local storage support and live sync update
  const [notifications, setNotifications] = useState<
    { id: string; text: string; time: string }[]
  >([]);

  useEffect(() => {
    let customLogs = [];
    try {
      customLogs = JSON.parse(scopedStorage.getItem("feed_logs") || "[]");
    } catch(e) {}
    const defaults = [
      { id: "1", text: "Alex linked with your Booran ID", time: "2m ago" },
      { id: "2", text: "New item uploaded to Shopi Store", time: "1h ago" },
      {
        id: "3",
        text: 'Your Channel submission "Tech" is approved',
        time: "4h ago",
      },
    ];
    setNotifications([...customLogs, ...defaults]);
  }, []);

  useEffect(() => {
    const fetchConnectionsData = async () => {
      try {
        const storedPending = scopedStorage.getItem("booran_pending_connections");
        if (storedPending) {
          const parsed = JSON.parse(storedPending);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChannelsList(
              parsed.filter((p: any) => p.requested !== false).map((p: any, i: number) => ({
                id: p.id || `ch-${i}`,
                name: p.name,
                image: p.avatar || getHumanAvatar(p.name),
                detailText: p.info || "Wants to connect",
              }))
            );
          }
        }
      } catch (e) {}

      if (connectionList && connectionList.length > 0) {
        setConnectionsList(
          connectionList.map((name, i) => ({
            id: `conn-${i}`,
            name: name,
            image: getHumanAvatar(name),
            detailText: "Linked and connected.",
          }))
        );
      }
    };

    fetchConnectionsData();
  }, [connectionList, feedRefreshTrigger]);

  useEffect(() => {
    // Sync logic removed - we now rely on props and local fetchInitialData
  }, [feedRefreshTrigger]);

  // Auto-refresh interval removed per user's instruction. Story generation is now triggered on refresh.
  const allUsersRef = useRef<FeedItem[]>([]);
  useEffect(() => {
    allUsersRef.current = [...channelsList, ...connectionsList];
  }, [channelsList, connectionsList]);

  const generateNewFlashFromOther = () => {
    const allUsers = allUsersRef.current;
    if (allUsers.length === 0) return;
    const targetUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    
    const targetUsername = targetUser.name.toLowerCase().startsWith("@") 
      ? targetUser.name 
      : `@${targetUser.name.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;

    const newFlashId = `flash-${Date.now()}`;
    const mockCaptions = [
      "New updates live from the synthesizer deck! ⚡🎹",
      "A pristine morning with analog waves. 🌅",
      "Connecting with fellow creators. ✨",
      "Sound design session. High fidelity active! 🎧",
      "Vibe check - retro star interface loaded. ⭐",
      "A perfect sunset audio session. 🎛️"
    ];
    const randomCaption = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];
    
    const newSegment = {
      id: newFlashId,
      mediaUri: targetUser.image,
      mediaType: "image" as const,
      timestamp: "Just now",
      duration: 5,
      caption: randomCaption,
      createdAt: Date.now()
    };

    setStoryGroups((prevGroups) => {
      const copy = [...prevGroups];
      const idx = copy.findIndex(
        (g) => g.username.toLowerCase() === targetUsername.toLowerCase() || g.userId === targetUser.id
      );

      if (idx !== -1) {
        const existingGroup = copy[idx];
        if (!existingGroup.stories.some((s) => s.caption === randomCaption)) {
          const updatedStories = [newSegment, ...existingGroup.stories];
          copy[idx] = {
            ...existingGroup,
            hasUnseen: true,
            stories: updatedStories,
          };
        }
      } else {
        copy.push({
          userId: targetUser.id,
          username: targetUsername,
          userAvatar: targetUser.image,
          hasUnseen: true,
          stories: [newSegment],
        });
      }
      return copy;
    });
  };

  useEffect(() => {
    generateNewFlashRef.current = generateNewFlashFromOther;
  }, [channelsList, connectionsList]);

  // Continuously generate flashes
  useEffect(() => {
    const flashTimer = setInterval(() => {
      generateNewFlashFromOther();
    }, 15000); // every 15 seconds
    return () => clearInterval(flashTimer);
  }, []);

  // Trigger new flash when home icon refresh is tapped
  const isInitialTriggerMount = React.useRef(true);
  useEffect(() => {
    if (isInitialTriggerMount.current) {
      isInitialTriggerMount.current = false;
      return;
    }
    if (feedRefreshTrigger && feedRefreshTrigger > 0) {
      generateNewFlashFromOther();
    }
  }, [feedRefreshTrigger]);

  useEffect(() => {
    if (!loadMoreChannelsRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Disabled infinite scroll generation to prevent repeats
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreChannelsRef.current);
    return () => observer.disconnect();
  }, [channelsList.length]);

  useEffect(() => {
    if (!loadMoreConnectionsRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Disabled infinite scroll generation to prevent repeats
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreConnectionsRef.current);
    return () => observer.disconnect();
  }, [connectionsList.length]);

  const [suggestionsList, setSuggestionsList] = useState<FeedItem[]>([
    {
      id: "sg1",
      name: "@alpha_echo",
      image: getHumanAvatar("echo"),
      detailText:
        'Recommended based on your "AI Resolution" settings interest.',
    },
    {
      id: "sg2",
      name: "@booran_prime",
      image: getHumanAvatar("prime"),
      detailText:
        "Official developer notification portal and software patches feed.",
    },
    {
      id: "sg3",
      name: "@shopi_deals",
      image: getHumanAvatar("deals"),
      detailText: "Aggregator channel of the highest-rated digital creations.",
    },
    {
      id: "sg4",
      name: "@neon_vintage",
      image: getHumanAvatar("neon"),
      detailText:
        "Creative feed highlighting neon architecture, glow filters, and low-light styling.",
    },
    {
      id: "sg5",
      name: "@draft_mode",
      image: getHumanAvatar("draft"),
      detailText:
        "Curating behind-the-scenes processes of design tools and wireframe mockups.",
    },
  ]);

  const handleConnectSuggestion = (item: FeedItem) => {
    // Stylize name for comparison and display
    const stylizedName = item.name.startsWith("@")
      ? item.name
          .substring(1)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : item.name;

    // Check if currently connected
    const isCurrentlyConnected = connectionsList.some(
      (c) =>
        c.name.toLowerCase() === stylizedName.toLowerCase() ||
        c.name.toLowerCase() === item.name.toLowerCase(),
    );

    if (isCurrentlyConnected) {
      // Disconnect: remove from connectionsList
      setConnectionsList((prev) =>
        prev.filter(
          (c) =>
            c.name.toLowerCase() !== stylizedName.toLowerCase() &&
            c.name.toLowerCase() !== item.name.toLowerCase(),
        ),
      );

      // Append disconnect request to feed_logs in localStorage
      const newLog = {
        id: Date.now().toString(),
        text: `Disconnected from ${item.name}`,
        time: "Just now",
      };
      let customLogs = [];
      try {
        customLogs = JSON.parse(scopedStorage.getItem("feed_logs") || "[]");
      } catch(e) {}
      scopedStorage.setItem(
        "feed_logs",
        JSON.stringify([newLog, ...customLogs]),
      );

      // Push notification for disconnect
      setNotifications((prev) => [newLog, ...prev]);
    } else {
      // Connect: add to connectionsList
      const newConnectedItem: FeedItem = {
        id: `cn-${item.id}-${Date.now()}`,
        name: stylizedName,
        image: item.image,
        detailText: `Successfully connected active-link keys. Connected with ${item.name}.`,
      };

      setConnectionsList((prev) => [...prev, newConnectedItem]);

      // Append connect request to feed_logs in localStorage
      const newLog = {
        id: Date.now().toString(),
        text: `Linked successfully with ${item.name}!`,
        time: "Just now",
      };
      let customLogs2 = [];
      try {
        customLogs2 = JSON.parse(scopedStorage.getItem("feed_logs") || "[]");
      } catch(e) {}
      scopedStorage.setItem(
        "feed_logs",
        JSON.stringify([newLog, ...customLogs2]),
      );

      // Push notification for connect
      setNotifications((prev) => [newLog, ...prev]);
    }

    if (onPushRoute) {
      onPushRoute("notifications");
    }
  };

  const badgesList: FeedItem[] = [
    {
      id: "bg1",
      name: "Alpha Inker",
      image: getHumanAvatar("badge1"),
      detailText:
        "Awarded for joining Booran during the initial testing period.",
    },
    {
      id: "bg2",
      name: "Linker Core",
      image: getHumanAvatar("badge2"),
      detailText:
        "Awarded for linking 3 or more personal web channels successfully.",
    },
    {
      id: "bg3",
      name: "Shutter Core",
      image: getHumanAvatar("badge3"),
      detailText:
        "Awarded for accessing and utilizing the Production Camera engine.",
    },
    {
      id: "bg4",
      name: "Shopi Patron",
      image: getHumanAvatar("badge4"),
      detailText: "Awarded for inspecting lists in the Shopi product catalog.",
    },
    {
      id: "bg5",
      name: "Curator Elite",
      image: getHumanAvatar("badge5"),
      detailText:
        "Granted for maintaining zero community violations over 90 consecutive days.",
    },
  ];

  const handleConnectPost = async (e: any, post: FeedItem) => {
    e.stopPropagation();
    const cleanName = post.name.toLowerCase().replace(/^@+/, "");
    const isConnected = dashboardConnectedUsers[cleanName];

    try {
      // Toggle logic
      await api.requestConnection(cleanName);

      // Update local state via event
      window.dispatchEvent(
        new CustomEvent("booran-add-connection", {
          detail: { name: cleanName },
        }),
      );

      triggerToast(isConnected ? `Disconnected from ${post.name}` : `Linked with ${post.name}!`);
    } catch (err) {
      console.error("Connection toggle failed:", err);
      triggerToast("Connection failed. Try again.");
    }
  };

  const handleShareConnect = async () => {
    const currentUserId = (username || "guest").toLowerCase().replace(/\s+/g, "-");
    const shareUrl = `https://scrollrise.app/user/${currentUserId}`;
    
    let fileToShare: File | null = null;
    try {
      const dataUrl = await QRCodeLib.toDataURL(shareUrl, { width: 400, margin: 2 });
      const res = await fetch(dataUrl);
      const qrCodeBlob = await res.blob();
      fileToShare = new File([qrCodeBlob], 'my_qr_code.png', { type: 'image/png' });
    } catch (e) {
      console.error("Error generating QR code image for sharing", e);
    }

    const baseShareData = {
      title: 'Connect with me on Scrollrise',
      text: 'Scan my code or tap this link to connect with me! ' + shareUrl,
    };

    if (navigator.share) {
      try {
        if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
          try {
            await navigator.share({
              ...baseShareData,
              files: [fileToShare]
            });
            return; // Success with file
          } catch (fileShareErr) {
            console.error("File share failed, falling back to text only", fileShareErr);
            // Fall through to text-only share
          }
        }
        
        // Text-only fallback
        await navigator.share(baseShareData);
      } catch (err) {
        console.error("Error sharing user profile:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        triggerToast("Profile link copied!");
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };


  const sortProfiles = (list: FeedItem[]) => {
    return [...list].sort((a, b) => {
      const cleanNameA = a.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const cleanNameB = b.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      
      const groupA = storyGroups.find(g => {
        const cleanG = g.username.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        return cleanG === cleanNameA || cleanG === `@${cleanNameA}` || g.userId === a.id;
      });
      const groupB = storyGroups.find(g => {
        const cleanG = g.username.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        return cleanG === cleanNameB || cleanG === `@${cleanNameB}` || g.userId === b.id;
      });
      
      const unseenA = groupA ? groupA.hasUnseen : true;
      const unseenB = groupB ? groupB.hasUnseen : true;
      
      if (unseenA && !unseenB) return -1;
      if (!unseenA && unseenB) return 1;
      return 0;
    });
  };


  return (
    <div
      id="dashboard-root-scroll"
      className="flex flex-col min-h-screen bg-transparent text-white pb-24 relative select-none touch-pan-y w-full transition-all duration-300"
    >
      {/* Physics Content Shift Wrapper */}
      <div
        id="dashboard-scroller"
        className="flex-1 flex flex-col h-full min-h-screen overflow-y-auto z-[2] relative"
      >
        {/* Premium Header conforming to Mockup screen */}
        <header className="sticky top-0 z-30 bg-transparent py-5 px-5 flex items-center justify-between safe-area-top">
          {/* Left Side: Your Story / Custom Navigation Launcher */}
          <div className="flex flex-col items-center">
            {(() => {
              const yourStories =
                storyGroups.find((g) => g.userId === "you")?.stories || [];
              const hasActiveYourStories = yourStories.length > 0;

              return (
                <div className="relative">
                  <DynamicElegantStorySquircle
                    size={74}
                    hasPlusButton={true}
                    onPlusClick={() => {
                      setIsCreatingStory(true);
                    }}
                    onClick={() => {
                      if (hasActiveYourStories) {
                        const yourGroupIdx = storyGroups.findIndex(
                          (g) => g.userId === "you",
                        );
                        setActiveStoryGroupIndex(yourGroupIdx);
                        setActiveStoryIndex(0);
                        setIsViewingStories(true);
                        setIsPlaying(true);
                      } else {
                        setIsCreatingStory(true);
                      }
                    }}
                    onDoubleClick={() => {
                      if (!starredStories["you"]) {
                        setStarredStories((prev) => ({ ...prev, you: true }));
                      }
                      const newId = "you-" + Date.now();
                      setDoubleTapStoryIds((prev) => ({ ...prev, you: newId }));
                      setTimeout(
                        () =>
                          setDoubleTapStoryIds((prev) =>
                            prev["you"] === newId ? { ...prev, you: "" } : prev,
                          ),
                        1800,
                      );
                    }}
                    className="transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {currentUserAvatar ? (
                      <img
                        src={currentUserAvatar}
                        alt="Your profile avatar"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </DynamicElegantStorySquircle>
                  {doubleTapStoryIds["you"] && (
                    <StarDoubleTap key={doubleTapStoryIds["you"]} scale={0.7} />
                  )}
                </div>
              );
            })()}

            <span
              className="text-[13px] font-extrabold text-white tracking-wide mt-2 text-center select-none leading-none hover:text-[#0EA5E9] transition-colors cursor-pointer"
              onClick={() => {
                const yourStories =
                  storyGroups.find((g) => g.userId === "you")?.stories || [];
                if (yourStories.length > 0) {
                  const yourGroupIdx = storyGroups.findIndex(
                    (g) => g.userId === "you",
                  );
                  setActiveStoryGroupIndex(yourGroupIdx);
                  setActiveStoryIndex(0);
                  setIsViewingStories(true);
                  setIsPlaying(true);
                } else {
                  setIsCreatingStory(true);
                }
              }}
            >
              your flash
            </span>
          </div>

          {/* Brand Title / Logo inserted in the middle left area */}
          <div className="flex-1 flex items-center justify-center -translate-y-1 pl-2 gap-3">
            <h1
              onClick={() => {
                if (onOpenConnectionsHub) {
                  onOpenConnectionsHub();
                }
              }}
              className="text-[24px] font-serif font-bold tracking-normal text-white select-none cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform"
              style={{
                filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.9))",
              }}
            >
              Scrollrise
            </h1>
            <button
              onClick={() => setShowQRModal(true)}
              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 transition-colors shadow-sm"
              title="My QR Code"
            >
              <QrCode className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col items-center shrink-0 justify-center">
            <button
              onClick={() => {
                scopedStorage.setItem(
                  "booran_seen_notifications_count",
                  totalRawNotifications.toString()
                );
                setSeenNotificationsCount(totalRawNotifications);
                if (onExploreSelected) onExploreSelected();
              }}
              className="relative flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-transform cursor-pointer shrink-0 animate-fade-in"
              title="Messages & Explore"
            >
              <svg
                className="w-8 h-8 text-white fill-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 4H5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2l2 3.5c.2.2.6.2.8 0l2.2-3.5h4a3 3 0 0 0 3-3V9" />
                <path
                  d="M21 2.5 L21.5 4.5 L23.5 5 L21.5 5.5 L21 7.5 L20.5 5.5 L18.5 5 L20.5 4.5 Z"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Dynamic Scroller lists matching Flutter rows exactly with hardware-accelerated slider snapping */}
        <main className="px-4 py-3 space-y-5">
          {/* ROW 1: Connects */}
          <section className="space-y-2 animate-fade-in mx-1">
            <div className="flex items-center space-x-1 px-3">
              <span className="text-[11px] font-black uppercase text-[#0EA5E9] tracking-widest flex items-center gap-1.5 font-sans drop-shadow-md">
                Connects{" "}
                <Link2 className="w-3.5 h-3.5 text-[#0EA5E9] stroke-[2.5]" />
              </span>
            </div>
            <div className="flex items-center space-x-4 overflow-x-auto py-4 px-3 bg-black/20 backdrop-blur-xl glass-glow border border-white/20  rounded-[32px] shadow-xl custom-scrollbar scroll-smooth snap-x">
              {sortProfiles(channelsList).map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 flex flex-col items-center select-none snap-start group relative"
                >
                  <div className="relative">
                    <DynamicElegantStorySquircle
                      size={74}
                      onClick={() => handleTapProfile(item)}
                      onDoubleClick={() => {
                        if (!starredStories[item.id]) {
                          setStarredStories((prev) => ({
                            ...prev,
                            [item.id]: true,
                          }));
                        }
                        const newId = item.id + "-" + Date.now();
                        setDoubleTapStoryIds((prev) => ({
                          ...prev,
                          [item.id]: newId,
                        }));
                        setTimeout(
                          () =>
                            setDoubleTapStoryIds((prev) =>
                              prev[item.id] === newId
                                ? { ...prev, [item.id]: "" }
                                : prev,
                            ),
                          1800,
                        );
                      }}
                      className="transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <img
                        src={item.image || getHumanAvatar(item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </DynamicElegantStorySquircle>
                    {doubleTapStoryIds[item.id] && (
                      <StarDoubleTap
                        key={doubleTapStoryIds[item.id]}
                        scale={0.7}
                      />
                    )}
                  </div>
                  <span
                    onClick={() => handleTapProfile(item)}
                    className="text-[9px] font-black uppercase text-zinc-100 tracking-widest mt-2 text-center select-none leading-none hover:text-[#e5b858] transition-colors cursor-pointer w-[74px] truncate"
                  >
                    {item.name}
                  </span>
                </div>
              ))}
              <div
                ref={loadMoreChannelsRef}
                className="flex-shrink-0 w-4 h-full"
              />
            </div>
          </section>

          {/* ROW 2: Connections */}
          <section className="space-y-2 animate-fade-in mx-1 mt-4">
            <div className="flex items-center space-x-1 px-3">
              <span className="text-[11px] font-black uppercase text-zinc-100 tracking-widest flex items-center gap-1.5 font-sans drop-shadow-md">
                Connections{" "}
                <Link2 className="w-3.5 h-3.5 text-[#0EA5E9] stroke-[2.5]" />
              </span>
            </div>
            <div className="flex items-center space-x-4 overflow-x-auto py-4 px-3 bg-black/20 backdrop-blur-xl glass-glow border border-white/20  rounded-[32px] shadow-xl custom-scrollbar scroll-smooth snap-x">
              {sortProfiles(connectionsList).map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 flex flex-col items-center select-none snap-start group relative"
                >
                  <div className="relative">
                    <DynamicElegantStorySquircle
                      size={74}
                      onClick={() => handleTapProfile(item)}
                      onDoubleClick={() => {
                        if (!starredStories[item.id]) {
                          setStarredStories((prev) => ({
                            ...prev,
                            [item.id]: true,
                          }));
                        }
                        const newId = item.id + "-" + Date.now();
                        setDoubleTapStoryIds((prev) => ({
                          ...prev,
                          [item.id]: newId,
                        }));
                        setTimeout(
                          () =>
                            setDoubleTapStoryIds((prev) =>
                              prev[item.id] === newId
                                ? { ...prev, [item.id]: "" }
                                : prev,
                            ),
                          1800,
                        );
                      }}
                      className="transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <img
                        src={item.image || getHumanAvatar(item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </DynamicElegantStorySquircle>
                    {doubleTapStoryIds[item.id] && (
                      <StarDoubleTap
                        key={doubleTapStoryIds[item.id]}
                        scale={0.7}
                      />
                    )}
                  </div>
                  <span
                    onClick={() => handleTapProfile(item)}
                    className="text-[9px] font-black uppercase text-zinc-100 tracking-widest mt-2 text-center select-none leading-none hover:text-[#e5b858] transition-colors cursor-pointer w-[74px] truncate"
                  >
                    {item.name}
                  </span>
                </div>
              ))}
              <div
                ref={loadMoreConnectionsRef}
                className="flex-shrink-0 w-4 h-full"
              />
            </div>
          </section>

          {/* ROW 3: Instagram-Style Live Feed Stream */}
          <section className="space-y-4 pt-4 pb-8 border-t border-white/5 mt-2">
            <div className="relative w-[calc(100%-8px)] mx-1 mb-4">
              <button
                className="flex w-full bg-[#222222] hover:bg-[#2a2a2a] rounded-[24px] py-4 justify-center items-center gap-2 transition-colors shadow-lg"
                onClick={() => {
                  setActiveFeedTab("snaps");
                  setVirals((prev) => {
                    const adPosts = prev.filter((p) =>
                      p.id?.startsWith("ad-"),
                    );
                    const regularPosts = prev.filter(
                      (p) => !p.id?.startsWith("ad-"),
                    );
                    regularPosts.sort(() => Math.random() - 0.5);

                    const combined = [];
                    let adIdx = 0;
                    let regIdx = 0;
                    while (
                      regIdx < regularPosts.length ||
                      adIdx < adPosts.length
                    ) {
                      if (
                        combined.length > 0 &&
                        combined.length % 5 === 0 &&
                        adIdx < adPosts.length
                      ) {
                        combined.push(adPosts[adIdx++]);
                      } else if (regIdx < regularPosts.length) {
                        combined.push(regularPosts[regIdx++]);
                      } else if (adIdx < adPosts.length) {
                        combined.push(adPosts[adIdx++]);
                      } else break;
                    }
                    return combined;
                  });
                }}
              >
                <Image className="w-5 h-5 text-white" />
                <span className="text-white text-[17px] font-normal tracking-wide">Snaps</span>
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProModal(true);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-orange-500 rounded px-2.5 py-1 shadow-md hover:scale-105 active:scale-95 transition-transform"
              >
                <span className="text-white font-bold text-xs tracking-wider">PRO</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* New Snap Box */}
              <div className="bg-black/20 backdrop-blur-xl glass-glow border border-white/20  rounded-[32px] p-4 shadow-xl mb-2 flex flex-col space-y-3 mx-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#EAC775] shrink-0 bg-neutral-900 shadow-[0_0_8px_rgba(234,199,117,0.4)]">
                    <img
                      src={
                        currentUserAvatar ||
                        getHumanAvatar("you")
                      }
                      alt="Your avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    onClick={() => {
                      scopedStorage.setItem("booran_create_post_type", "photo");
                      if (onOpenCreatePost) onOpenCreatePost();
                    }}
                    className="flex-1 bg-[#1a1a20] hover:bg-[#22222a] transition-colors border border-white/5 rounded-full px-4 py-2.5 flex items-center justify-center cursor-text mt-1"
                  >
                    <span className="text-base text-white flex items-center justify-center pt-0.5">
                      <span className="text-2xl mr-1.5">+</span> Public
                    </span>
                  </div>
                  <button
                    className="p-2.5 rounded-full bg-[#1a1a20] hover:bg-[#22222a] transition-colors text-[#0EA5E9] border border-white/5 ml-2 mt-1"
                    onClick={() => {
                      scopedStorage.setItem("booran_create_post_type", "photo");
                      if (onOpenCreatePost) onOpenCreatePost();
                    }}
                  >
                    <Image className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Latest User Post Box removed as per user request */}

              {(() => {
                const isScrollsFeed = activeFeedTab === "reels";
                
                // Fetch all public ads (local + from server posts)
                let allAds: any[] = [];
                try {
                  const localAds = getAds();
                  const serverAds = allVirals.filter(v => (v as any).isAd).map(v => ({
                    id: v.id,
                    ownerId: v.name,
                    src: v.image,
                    link: (v as any).link,
                    contact: (v as any).contact,
                    action: (v as any).action,
                    mediaType: v.format === 'video' ? 'video' : 'image',
                    createdAt: v.timestamp
                  }));

                  // Combine and de-duplicate
                  const combined = [...localAds];
                  serverAds.forEach(sa => {
                    if (!combined.some(la => la.id === sa.id)) {
                      combined.push(sa);
                    }
                  });
                  allAds = combined;
                } catch (e) {}
                
                console.log('Ads Found:', allAds.length);

                // Strict Feed-Type Filtering
                const availableAds = allAds.filter(ad => ad.mediaType === (isScrollsFeed ? 'video' : 'image'));
                
                // Universal Ad Backfilling: Tier 1 (owner) then Tier 2 (others)
                availableAds.sort((a, b) => (a.ownerId === username ? -1 : 1) - (b.ownerId === username ? -1 : 1));

                // Base filtered virals for the current tab
                const baseFiltered = virals.filter((post) => {
                  const matchesTab = isScrollsFeed ? post.format === "video" : post.format === "photo";
                  const notHidden = !hiddenPostIds[post.id];
                  const isAd = (post as any).isAd; // Don't show ads in organic feed
                  const isSelf =
                    post.name === username ||
                    post.name === `@${username}` ||
                    post.name === "@you" ||
                    post.name === "you" ||
                    post.id.startsWith("user-post");
                  const cleanName = post.name?.replace("@", "") || "";
                  const isConnection =
                    connectionList?.some(
                      (c) =>
                        c.toLowerCase().replace("@", "") ===
                        cleanName.toLowerCase(),
                    ) || dashboardConnectedUsers[post.name];
                  const visibilityAllowed =
                    !post.visibility ||
                    post.visibility !== "connections_only" ||
                    isSelf ||
                    isConnection;
                  return matchesTab && notHidden && !isAd && visibilityAllowed;
                });

                const finalFeed = baseFiltered.filter(item => isScrollsFeed ? item.format === 'video' : item.format === 'photo');

                if (finalFeed.length === 0) {
                  return (
                    <div className="flex items-center justify-center min-h-[200px] text-center text-zinc-500 text-sm py-10 tracking-widest uppercase">
                      <p>No new posts</p>
                    </div>
                  );
                }

                let adCountInjected = 0;

                return finalFeed.map((post, index) => {
                  const isLiked = (post.likes || []).includes(username || "User");
                  const postComments = post.comments || [];
                  const commentText = commentInputs[post.id] || "";
                  const showHeartPop = !!doubleTapHeartPostIds[post.id];

                  const renderAdvertisementNode = (adToInject: any) => {
                    if (!adToInject) return null;
                    const adPost = {
                      ...post,
                      id: adToInject.id + "-injected-" + index,
                      name: adToInject.ownerId,
                      image: adToInject.src,
                      detailText: `Contact: ${adToInject.contact || 'N/A'} | Link: ${adToInject.link || 'N/A'}`,
                      time: 'Sponsored Ad',
                      timestamp: adToInject.createdAt,
                      format: adToInject.mediaType === 'image' ? 'photo' : 'video',
                      link: adToInject.link,
                      contact: adToInject.contact,
                      action: adToInject.action || 'APPLY',
                      isAd: true
                    };
                    
                    if (!isScrollsFeed && adPost.format === 'video') return null;

                    const adName = adPost.name === "@you" || adPost.name === "you" || adPost.name === username ? "Your" : adPost.name;
                    
                    return (
                      <div
                        key={adPost.id}
                        className="bg-black/20 backdrop-blur-xl glass-glow border border-white/20  rounded-[32px] overflow-hidden flex flex-col text-left mb-4 mt-4 shadow-xl mx-1"
                      >
                        <div className="flex items-center justify-between p-3.5 bg-transparent">
                          <div className="flex items-center space-x-3">
                            <div className="w-11 h-11 rounded-[14px] overflow-hidden border-[1.5px] border-[#EAC775] p-[2px] flex-shrink-0 bg-neutral-950 shadow-[0_0_12px_rgba(234,199,117,0.4)]">
                              <img
                                src={getHumanAvatar(String(encodeURIComponent(adPost.name.replace("@", ""))))}
                                alt={adPost.name}
                                className="w-full h-full object-cover rounded-[10px]"
                              />
                            </div>
                            <div className="flex flex-col justify-center max-w-[200px]">
                              <div className="flex items-center gap-1.5 w-full">
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenDMs) onOpenDMs(adPost.name);
                                  }}
                                  className="text-[16px] font-black text-white hover:text-zinc-300 cursor-pointer tracking-wider truncate whitespace-nowrap max-w-[140px] leading-tight"
                                >
                                  {adName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider bg-white/5 text-white/60 shrink-0">
                                  AD
                                </span>
                              </div>
                              <span className="text-[12px] text-neutral-400 font-medium tracking-wide flex items-center mt-0.5">
                                Just now <span className="mx-1.5">•</span> 0 Comments
                              </span>
                            </div>
                          </div>
                          <button className="text-white/70 hover:text-white transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {adPost.format === "video" ? (
                          <AdVideoPlayer src={adPost.image || ""} />
                        ) : (
                          <div className="w-full relative bg-neutral-900 border-y border-white/5 group cursor-pointer aspect-[4/5]">
                            <img
                              src={adPost.image || undefined}
                              alt="ad"
                              className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
                              loading="lazy"
                            />
                          </div>
                        )}
                        
                        <div className="px-3 pb-3 pt-3 flex items-center justify-between bg-transparent">
                          <div className="flex items-center space-x-5 text-white">
                            <button
                              onClick={() => setActiveCommentsPost(adPost.id)}
                              className="text-white hover:text-zinc-300 transition-colors"
                            >
                              <MessageSquare className="w-6 h-6 stroke-[2]" />
                            </button>
                            <button
                              onClick={() => {
                                setLikedPostIds((prev) => {
                                  const next = { ...prev };
                                  if (next[adPost.id]) {
                                    delete next[adPost.id];
                                  } else {
                                    next[adPost.id] = true;
                                  }
                                  return next;
                                });
                              }}
                              className="text-white hover:text-yellow-400 transition-colors"
                            >
                              <Star
                                className={`w-6 h-6 stroke-[2] ${
                                  likedPostIds[adPost.id]
                                    ? "fill-yellow-400 text-yellow-400"
                                    : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => {
                                setActiveShareSrc(adPost.image || null);
                                const isVideo = adPost.image?.includes(".mp4") || adPost.format === "video";
                                setActiveShareMediaType(isVideo ? "video" : "image");
                                setShowShareSheet(true);
                              }}
                              className="text-white hover:text-zinc-300 transition-colors"
                            >
                              <Share2 className="w-6 h-6 stroke-[2]" />
                            </button>
                          </div>
                          
                          <div className="hidden">Contact: {adPost.contact} | Link: {adPost.link}</div>
                          
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                if (onOpenConnectionsHub) onOpenConnectionsHub(adPost.ownerId || adPost.brand);
                              }}
                              className="text-white hover:text-zinc-300 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] drop-shadow-md">
                                <path d="M12 2l10 18H2L12 2z" />
                                <path d="M12 20v-8" />
                              </svg>
                            </button>
                            
                            {adPost.action !== 'NONE' && (adPost.contact || adPost.link) && (
                              <button 
                                onClick={() => {
                                  if (adPost.link) {
                                    let url = adPost.link.trim();
                                    if (!/^https?:\/\//i.test(url)) {
                                      url = 'https://' + url;
                                    }
                                    window.open(url, '_blank');
                                  } else if (adPost.contact) {
                                    const cleanNumber = adPost.contact.replace(/[^0-9]/g, '');
                                    window.open(`https://wa.me/${cleanNumber}`, '_blank');
                                  }
                                }}
                                className="flex items-center justify-between bg-[#CC1016] hover:bg-[#E51219] transition-colors rounded-lg px-4 py-1.5 min-w-[120px] shadow-lg w-auto gap-2"
                              >
                                <span className="text-white font-black text-[15px] tracking-wide">{(adPost.action || 'APPLY').toUpperCase()}</span>
                                <ArrowRight className="text-white w-5 h-5 stroke-[3]" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  };

                  // Register that the user viewed this post
                  trackUserInteractionInInsights(post.id, "watch", username);

                  const renderOrganicPost = () => {
                    if (!isScrollsFeed && post.format === 'video') return null;

                    if (post.format === "photo") {
                      return (
                        <Fragment key={post.id}>
                          <div
                            className="bg-black/20 backdrop-blur-xl glass-glow border border-white/20  rounded-[32px] overflow-hidden flex flex-col text-left mb-4 shadow-xl mx-1"
                          >
                            {/* Snap Header */}
                          <div className="flex items-center justify-between p-3.5 bg-transparent">
                            <div className="flex items-center space-x-3">
                              {/* Avatar container */}
                              <div 
                                onClick={() => {
                                  const isSelf =
                                    post.name === "@you" ||
                                    post.name === "you" ||
                                    post.id.startsWith("user-post") ||
                                    post.name === username ||
                                    post.name === `@${username}`;
                                  if (!isSelf && onOpenDMs) {
                                    onOpenDMs(post.name);
                                  }
                                }}
                                className="w-11 h-11 rounded-[14px] overflow-hidden border-[1.5px] border-[#EAC775] p-[2px] flex-shrink-0 bg-neutral-950 shadow-[0_0_12px_rgba(234,199,117,0.4)] cursor-pointer active:scale-95 transition-transform hover:opacity-85"
                              >
                                <img
                                  src={
                                    post.name === "you" ||
                                    post.id.startsWith("user-post") ||
                                    post.name.replace(/^@/, '').toLowerCase() === username.toLowerCase()
                                      ? (currentUserAvatar || getHumanAvatar("you"))
                                      : getHumanAvatar(String(encodeURIComponent(post.name.replace(/^@+/, ""))))
                                  }
                                  alt={post.name}
                                  className="w-full h-full object-cover rounded-[10px]"
                                />
                              </div>
                              <div className="flex flex-col justify-center max-w-[180px] sm:max-w-[220px]">
                                <div className="flex items-center gap-1.5 w-full">
                                  <span 
                                    onClick={() => {
                                      const isSelf =
                                        post.name === "you" ||
                                        post.id.startsWith("user-post") ||
                                        post.name.replace(/^@/, '').toLowerCase() === username.toLowerCase();
                                      if (!isSelf && onOpenDMs) {
                                        onOpenDMs(post.name);
                                      }
                                    }}
                                    className="text-[15px] font-bold text-white hover:text-zinc-300 cursor-pointer tracking-wide truncate whitespace-nowrap max-w-[120px] sm:max-w-[150px] leading-tight"
                                  >
                                    {post.name === "you" ||
                                    post.id.startsWith("user-post") ||
                                    post.name.replace(/^@/, '').toLowerCase() === username.toLowerCase()
                                      ? "Your snap"
                                      : (post.name.startsWith('@') ? post.name : `@${post.name}`)}
                                  </span>
                                  {/* PRO BADGE: Only show if isPro is true for this user */}
                                  {(post.isPro || post.name.replace(/^@/, '').toLowerCase() === username.toLowerCase()) && isPremium && (
                                    <span className="text-[9px] font-black text-white bg-gradient-to-r from-amber-400 to-amber-600 px-1.5 py-[2px] rounded uppercase shadow-[0_0_10px_rgba(251,191,36,0.4)] border border-white/20 tracking-[0.15em] ml-1">
                                      PRO
                                    </span>
                                  )}
                                  {!(
                                    post.name === "you" ||
                                    post.id.startsWith("user-post") ||
                                    post.name.replace(/^@/, '').toLowerCase() === username.toLowerCase() ||
                                    dashboardConnectedUsers[post.name.toLowerCase().replace(/^@+/, "")]
                                  ) && (
                                    <>
                                      <button
                                        onClick={(e) =>
                                          handleConnectPost(e, post)
                                        }
                                        className="relative cursor-pointer hover:bg-white/10 rounded-full transition-colors ml-2 flex items-center justify-center p-1"
                                        title="Link (Disconnected)"
                                      >
                                        <Link2Off className="w-4 h-4 text-red-500 rotate-45 shrink-0" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <span className="text-xs font-sans text-zinc-400 font-medium mt-0.5">
                                  {post.timestamp ? formatRelativeTime(post.timestamp) : (post.time || "1h ago")} •{" "}
                                  <span className="text-amber-400 font-bold">{(post.likes || []).length} Stars</span> •{" "}
                                  <button
                                    onClick={() =>
                                      setActiveCommentsPost(post.id)
                                    }
                                    className="hover:text-white hover:underline transition-colors"
                                  >
                                    {postComments.length}{" "}
                                    Comments
                                  </button>
                                </span>
                              </div>
                            </div>
                            {/* Tiny options button */}
                            <button
                              onClick={() => {
                                const isOwner =
                                  post.name === username ||
                                  post.name === `@${username}` ||
                                  post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post");
                                setPostMenu({ id: post.id, isOwner });
                              }}
                              className="text-zinc-300 hover:text-white p-1 hover:bg-white/5 rounded transition-colors text-xs font-bold shrink-0 cursor-pointer"
                              title="Options"
                            >
                              •••
                            </button>
                          </div>

                          {/* Post Image */}
                          <div
                            className="relative w-full bg-neutral-950 cursor-pointer select-none group"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (!isLiked) {
                                setLikedPostIds((prev) => ({
                                  ...prev,
                                  [post.id]: true,
                                }));
                                trackUserInteractionInInsights(post.id, "star", username);
                              }
                              setDoubleTapHeartPostIds((prev) => ({
                                ...prev,
                                [post.id]: true,
                              }));
                              setTimeout(
                                () =>
                                  setDoubleTapHeartPostIds((prev) => ({
                                    ...prev,
                                    [post.id]: false,
                                  })),
                                800,
                              );
                            }}
                          >
                            <FeedMedia
                              post={post}
                              dataSaverEnabled={dataSaverEnabled}
                            />

                            {/* Double tap heart animation */}
                            {showHeartPop && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                                <StarDoubleTap scale={1.2} key={Date.now()} />
                              </div>
                            )}
                          </div>

                          {/* Action Row */}
                          <div className="flex items-center justify-between p-3 bg-transparent">
                            <div className="flex items-center space-x-5">
                              {(() => {
                                const isOwner =
                                  post.name === username ||
                                  post.name === `@${username}` ||
                                  post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post");
                                return (
                                  <>
                                    <button
                                      onClick={() =>
                                        setActiveCommentsPost(post.id)
                                      }
                                      className="text-white hover:text-zinc-300 transition-colors"
                                    >
                                      <MessageSquare className="w-6 h-6 stroke-[2]" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (isOwner) {
                                          setActiveInsightsPost(post.id);
                                          return;
                                        }
                                        try {
                                          await api.likePost(post.id);
                                          // UI updates via Socket.io stats broadcast
                                        } catch (err) {
                                          console.error("Failed to like post:", err);
                                        }
                                      }}
                                      className="text-white hover:text-yellow-400 transition-colors"
                                    >
                                      <Star
                                        className={`w-6 h-6 stroke-[2] ${
                                          isLiked
                                            ? "fill-yellow-400 text-yellow-400"
                                            : ""
                                        }`}
                                      />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveShareSrc(post.mediaUrl || null);
                                        const isVideo = post.mediaUrl?.includes(".mp4") || post.mediaType === "video" || post.format === "video";
                                        setActiveShareMediaType(isVideo ? "video" : "image");
                                        setShowShareSheet(true);
                                      }}
                                      className="text-white hover:text-zinc-300 transition-colors"
                                    >
                                      <Share2 className="w-6 h-6 stroke-[2]" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPostAddMenu(post.id);
                                        setPostAddMenuPos({ top: rect.top, left: rect.left });
                                      }}
                                      className="text-white hover:text-zinc-300 transition-colors"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] drop-shadow-md">
                                        <rect x="9" y="10" width="12" height="12" rx="4" />
                                        <path d="M15 13v6" />
                                        <path d="M12 16h6" />
                                        <path d="M14 10v-1a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h1" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (onOpenConnectionsHub) onOpenConnectionsHub(post.name);
                                      }}
                                      className="text-white hover:text-zinc-300 transition-colors"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[26px] h-[26px] drop-shadow-md">
                                        <path d="M12 2l10 18H2L12 2z" />
                                        <path d="M12 20v-8" />
                                      </svg>
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Post Detail Text & Comments */}
                          <div className="px-3 pb-4 text-sm text-zinc-300 bg-transparent">
                            {post.detailText && (
                              <div className="mb-2">
                                <span className="font-bold text-white mr-2">
                                  {post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post") ||
                                  post.name === username ||
                                  post.name === `@${username}`
                                    ? "Your snap"
                                    : post.name}
                                </span>
                                {post.detailText}
                              </div>
                            )}

                            {/* Inline Comments */}
                            {postComments.length > 0 && (
                              <div className="space-y-1.5 mb-1">
                                {postComments.slice(-2).map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="text-xs flex space-x-2"
                                  >
                                    <span className="font-bold text-white">
                                      {comment.username || comment.author}
                                    </span>
                                    <span className="text-zinc-400 break-words line-clamp-2">
                                      {comment.text}
                                    </span>
                                  </div>
                                ))}
                                {postComments.length > 2 && (
                                  <button
                                    onClick={() =>
                                      setActiveCommentsPost(post.id)
                                    }
                                    className="text-xs text-zinc-500 hover:text-zinc-400 mt-1"
                                  >
                                    View all {postComments.length} comments
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        </Fragment>
                      );
                    }

                    return (
                      <Fragment key={post.id}>
                      <div
                        className="bg-black/20 backdrop-blur-xl glass-glow border border-white/20  rounded-[32px] overflow-hidden shadow-xl animate-fade-in flex flex-col text-left mb-4 mx-1"
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between p-3 border-b border-white/5">
                          <div className="flex items-center space-x-2.5">
                            {/* Avatar container */}
                            <div 
                              onClick={() => {
                                const isSelf =
                                  post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post") ||
                                  post.name === username ||
                                  post.name === `@${username}`;
                                if (!isSelf && onOpenDMs) {
                                  onOpenDMs(post.name);
                                }
                              }}
                              className="w-8 h-8 rounded-lg overflow-hidden border-2 border-[#EAC775] p-0.5 flex-shrink-0 bg-neutral-950 shadow-[0_0_8px_rgba(234,199,117,0.6)] cursor-pointer active:scale-95 transition-transform hover:opacity-85"
                            >
                              <img
                                src={
                                  post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post")
                                    ? (currentUserAvatar || getHumanAvatar("you"))
                                    : getHumanAvatar(String(encodeURIComponent(post.name.replace("@", ""))))
                                }
                                alt={post.name}
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  onClick={() => {
                                    const isSelf =
                                      post.name === "@you" ||
                                      post.name === "you" ||
                                      post.id.startsWith("user-post") ||
                                      post.name === username ||
                                      post.name === `@${username}`;
                                    if (!isSelf && onOpenDMs) {
                                      onOpenDMs(post.name);
                                    }
                                  }}
                                  className="text-[15.5px] font-black text-white hover:text-zinc-300 cursor-pointer tracking-wider"
                                >
                                  {post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post") ||
                                  post.name === username ||
                                  post.name === `@${username}`
                                    ? "Your snap"
                                    : post.name}
                                </span>
                                {!(
                                  post.name === "@you" ||
                                  post.name === "you" ||
                                  post.id.startsWith("user-post") ||
                                  post.name === username ||
                                  post.name === `@${username}` ||
                                  dashboardConnectedUsers[post.name.toLowerCase().replace(/^@+/, "")]
                                ) && (
                                  <>
                                    <span className="text-[9px] font-black text-white bg-gradient-to-r from-amber-400 to-amber-600 px-1.5 py-[2px] rounded uppercase shadow-[0_0_10px_rgba(251,191,36,0.4)] border border-white/20 tracking-[0.15em] ml-1">
                                      PRO
                                    </span>
                                    <button
                                      onClick={(e) => handleConnectPost(e, post)}
                                      className="relative cursor-pointer hover:bg-white/10 rounded-full transition-colors ml-2 flex items-center justify-center p-1"
                                      title="Link (Disconnected)"
                                    >
                                      <Link2Off className="w-4 h-4 text-red-500 rotate-45 shrink-0" />
                                    </button>
                                  </>
                                )}
                              </div>
                              <span className="text-xs font-sans text-zinc-400 font-medium mt-0.5">
                                {post.timestamp ? formatRelativeTime(post.timestamp) : (post.time || "1h ago")} •{" "}
                                <button
                                  onClick={() => setActiveCommentsPost(post.id)}
                                  className="hover:text-white hover:underline transition-colors"
                                >
                                  {(commentsMap[post.id] || []).length} Comments
                                </button>
                              </span>
                            </div>
                          </div>
                          {/* Tiny options button */}
                          <button
                            onClick={() => {
                              const isOwner =
                                post.name === username ||
                                post.name === `@${username}` ||
                                post.name === "@you" ||
                                post.name === "you" ||
                                post.id.startsWith("user-post");
                              setPostMenu({ id: post.id, isOwner });
                            }}
                            className="text-zinc-300 hover:text-white p-1 hover:bg-white/5 rounded transition-colors text-xs font-bold shrink-0 cursor-pointer"
                            title="Options"
                          >
                            •••
                          </button>
                        </div>

                        {/* Post Image Container with Double Tap feature */}
                        <div
                          className="relative w-full overflow-hidden bg-neutral-950 cursor-pointer select-none group"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            // Double tap to like!
                            if (!isLiked) {
                              setLikedPostIds((prev) => ({
                                ...prev,
                                [post.id]: true,
                              }));
                              trackUserInteractionInInsights(post.id, "star", username);
                            }
                            setStarCounts((prev) => ({
                              ...prev,
                              [post.id]: (prev[post.id] || 0) + 1,
                            }));
                            const newId = Date.now().toString();
                            setDoubleTapHeartPostIds((prev) => ({
                              ...prev,
                              [post.id]: newId,
                            }));
                          }}
                        >
                          <FeedMedia
                            post={post}
                            dataSaverEnabled={dataSaverEnabled}
                          />

                          {/* Dynamic Custom Overlays from authoring */}
                          {post.magicEffectStyle === 1 && (
                            <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-green-500/10 pointer-events-none mix-blend-color-dodge z-[5]">
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%] animate-pulse" />
                            </div>
                          )}
                          {post.magicEffectStyle === 2 && (
                            <div className="absolute inset-0 pointer-events-none z-[5]">
                              <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-500/20 to-transparent mix-blend-soft-light" />
                              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent mix-blend-overlay" />
                            </div>
                          )}

                          {post.overlayText && (
                            <div
                              className="absolute z-10 pointer-events-none flex flex-col items-center justify-center p-4 max-w-full"
                              style={{
                                left: post.textPosX
                                  ? `${post.textPosX}%`
                                  : "50%",
                                top: post.textPosY
                                  ? `${post.textPosY}%`
                                  : "50%",
                                transform: "translate(-50%, -50%)",
                                width: "100%",
                              }}
                            >
                              <span
                                className="font-bold text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] px-4 leading-tight break-words uppercase whitespace-pre-wrap max-w-full"
                                style={{
                                  fontSize:
                                    post.textStyleIdx === 1
                                      ? "38px"
                                      : post.textStyleIdx === 3
                                        ? "42px"
                                        : "32px",
                                  color:
                                    post.textStyleIdx === 2
                                      ? "#FFD700"
                                      : post.textStyleIdx === 4
                                        ? "#E1F5FE"
                                        : "white",
                                  fontFamily:
                                    post.textStyleIdx === 5
                                      ? "sans-serif"
                                      : "monospace",
                                  textShadow:
                                    post.textStyleIdx === 2
                                      ? "0 2px 20px rgba(255,215,0,0.5)"
                                      : "0 4px 12px rgba(0,0,0,0.8)",
                                  letterSpacing:
                                    post.textStyleIdx === 3
                                      ? "0.2em"
                                      : "normal",
                                }}
                              >
                                {post.overlayText}
                              </span>
                            </div>
                          )}

                          {(post.contact || post.link) && (
                            <div className="absolute inset-x-0 bottom-0 p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                              <div
                                className="bg-gradient-to-r from-[#8B1A1A] to-[#B22222] rounded flex items-center justify-between shadow-lg px-3 py-1.5 w-[250px] cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (post.link) {
                                    let url = post.link.trim();
                                    if (!/^https?:\/\//i.test(url)) {
                                      url = "https://" + url;
                                    }
                                    window.open(url, "_blank");
                                  } else if (post.contact) {
                                    const cleanNumber = post.contact.replace(
                                      /[^0-9]/g,
                                      "",
                                    );
                                    window.open(
                                      `https://wa.me/${cleanNumber}`,
                                      "_blank",
                                    );
                                  }
                                }}
                              >
                                <span className="text-white font-bold tracking-wide text-[16px]">
                                  {post.contact && post.link
                                    ? "APPLY"
                                    : post.contact
                                      ? "CONTACT"
                                      : "LINK"}
                                </span>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-[20px] h-[20px] text-white"
                                >
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                  <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                              </div>
                              <div className="text-[12px] text-white mt-1 uppercase tracking-widest font-bold drop-shadow-md pb-1">
                                AD
                              </div>
                            </div>
                          )}

                          {/* Massive Star Pop Overlay animation */}
                          {showHeartPop && (
                            <StarDoubleTap
                              key={doubleTapHeartPostIds[post.id]}
                              scale={0.7}
                              onComplete={() =>
                                setDoubleTapHeartPostIds((prev) => ({
                                  ...prev,
                                  [post.id]: "",
                                }))
                              }
                            />
                          )}
                        </div>

                        {/* Operational Toolbar Icons */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-b border-white/5 bg-[#0a0a0d]">
                          <div className="flex items-center space-x-3.5">
                            {(() => {
                              const isOwner =
                                post.name === username ||
                                post.name === `@${username}` ||
                                post.name === "@you" ||
                                post.name === "you" ||
                                post.id.startsWith("user-post");
                              return (
                                <>
                                  {/* Comment trigger */}
                                  <button
                                    onClick={() =>
                                      setActiveCommentsPost(post.id)
                                    }
                                    className="text-zinc-100 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
                                  >
                                    <svg
                                      className="w-5.5 h-5.5 text-zinc-100 stroke-current drop-shadow-md"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                      />
                                    </svg>
                                  </button>

                                  {/* Star / Like trigger */}
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      onClick={() => {
                                        if (isOwner) {
                                          setActiveInsightsPost(post.id);
                                          return;
                                        }
                                        if (!isLiked) {
                                          setLikedPostIds((prev) => ({
                                            ...prev,
                                            [post.id]: true,
                                          }));
                                          trackUserInteractionInInsights(post.id, "star", username);
                                        }
                                        setStarCounts((prev) => ({
                                          ...prev,
                                          [post.id]: (prev[post.id] || 0) + 1,
                                        }));
                                        const newId = Date.now().toString();
                                        setDoubleTapHeartPostIds((prev) => ({
                                          ...prev,
                                          [post.id]: newId,
                                        }));
                                      }}
                                      className="text-zinc-100 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer group"
                                    >
                                      <CrystalStarIcon
                                        className="w-5.5 h-5.5 drop-shadow-md"
                                        isActive={isLiked}
                                      />
                                    </button>
                                    {starCounts[post.id] > 0 && (
                                      <span className="text-[10px] font-bold text-cyan-400 select-none">
                                        {starCounts[post.id]}
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Caption & Live Comments Segment */}
                        <div className="p-3 bg-[#0d0d10] text-left">
                          {/* Main Caption */}
                          {post.detailText && (
                            <div className="text-[11px] leading-relaxed text-zinc-200 mb-2">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isSelf =
                                    post.name === "@you" ||
                                    post.name === "you" ||
                                    post.id.startsWith("user-post") ||
                                    post.name === username ||
                                    post.name === `@${username}`;
                                  if (!isSelf && onOpenDMs) {
                                    onOpenDMs(post.name);
                                  }
                                }}
                                className="font-bold text-white mr-1.5 hover:underline cursor-pointer"
                              >
                                {post.name === "you" ||
                                post.name === "@you" ||
                                post.id.startsWith("user-post") ||
                                post.name === username ||
                                post.name === `@${username}`
                                  ? "Your snap"
                                  : post.name}
                              </span>
                              {post.detailText}
                            </div>
                          )}

                          {/* Inline Comments */}
                          {postComments.length > 0 && (
                            <div className="space-y-1.5 mb-1">
                              {postComments.slice(-2).map((comment) => (
                                <div
                                  key={comment.id}
                                  className="text-[11px] flex space-x-2"
                                >
                                  <span className="font-bold text-white">
                                    {comment.author}
                                  </span>
                                  <span className="text-zinc-400 break-words line-clamp-2">
                                    {comment.text}
                                  </span>
                                </div>
                              ))}
                              {postComments.length > 2 && (
                                <button
                                  onClick={() => setActiveCommentsPost(post.id)}
                                  className="text-[11px] text-zinc-500 hover:text-zinc-400 mt-1"
                                >
                                  View all {postComments.length} comments
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      </Fragment>
                    );
                  };

                  return (
                    <Fragment key={post.id + "-container"}>
                      {(() => {
                        const items = [<Fragment key={post.id + "-post"}>{renderOrganicPost()}</Fragment>];
                        
                        if ((index + 1) % 5 === 0 || (index + 1) % 11 === 0) {
                          if (adCountInjected < availableAds.length) {
                            const adToInject = availableAds[adCountInjected];
                            adCountInjected++;
                            items.push(
                              <Fragment key={`ad-${adToInject.id}`}>
                                {renderAdvertisementNode(adToInject)}
                              </Fragment>
                            );
                          }
                        }
                        
                        return items;
                      })()}
                    </Fragment>
                  );
                })
              })()}
              
              <div
                ref={loadMoreRef}
                className="h-16 w-full flex items-center justify-center text-zinc-500 text-[10px] font-mono tracking-widest uppercase py-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-600 animate-spin" />
                  <span>Loading more scrolls...</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* COMPREHENSIVE CLICK NAVIGATION DECK - JUMP SYSTEM FOR ALL VIEWS */}
        {showQuickMenu && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto animate-fade-in text-white select-none">
            <div className="w-full max-w-sm mx-auto space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-[#F52C68] animate-spin-slow" />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase">
                      Universal Portal Deck
                    </h3>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      Booran Sandbox Engine v4
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickMenu(false)}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                💡 Click any interactive node below to test or navigate
                instantly across different full-fidelity system panels.
              </p>

              {/* 1. Core Tab Switches */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-mono font-bold text-[#F52C68] uppercase tracking-wider block">
                  1. Navigation Tab Modules
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onPushRoute?.("dashboard");
                    }}
                    className="p-2.5 bg-neutral-900 border border-white/5 hover:border-brand-pink/40 hover:bg-neutral-850 rounded-xl text-left cursor-pointer transition-all active:scale-95"
                  >
                    <span className="block text-xs font-bold text-neutral-200">
                      🤖 Feed Dashboard
                    </span>
                    <span className="block text-[8px] text-neutral-500 font-mono">
                      Main social feeds
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onPushRoute?.("category-swiper");
                    }}
                    className="p-2.5 bg-neutral-900 border border-white/5 hover:border-brand-pink/40 hover:bg-neutral-850 rounded-xl text-left cursor-pointer transition-all active:scale-95"
                  >
                    <span className="block text-xs font-bold text-neutral-200">
                      🎬 Vertical Viral
                    </span>
                    <span className="block text-[8px] text-neutral-500 font-mono">
                      11 interactive categories
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      if (onExploreSelected) onExploreSelected();
                    }}
                    className="p-2.5 bg-neutral-900 border border-white/5 hover:border-brand-pink/40 hover:bg-neutral-850 rounded-xl text-left cursor-pointer transition-all active:scale-95"
                  >
                    <span className="block text-xs font-bold text-neutral-200">
                      💬 Explore / Chat
                    </span>
                    <span className="block text-[8px] text-neutral-500 font-mono">
                      Secure chat proposals
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onPushRoute?.("dashboard");
                      // We'll set Active Tab via custom triggers if supported or general layout controls
                    }}
                    className="p-2.5 bg-neutral-900 border border-white/5 hover:border-brand-pink/40 hover:bg-neutral-850 rounded-xl text-left cursor-pointer transition-all active:scale-95"
                  >
                    <span className="block text-xs font-bold text-neutral-200">
                      ⚙️ Bento Settings
                    </span>
                    <span className="block text-[8px] text-neutral-500 font-mono">
                      Robot status dials
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Full Route Switches */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] font-mono font-bold text-[#F52C68] uppercase tracking-wider block">
                  2. Sandbox Route Portals
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenDMs();
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Direct DM Chat
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Linked thread logs
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      if (onOpenConnectionsHub) onOpenConnectionsHub();
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Link2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Connections
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Linked profiles list
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onNavigateToSettings();
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Detail Setup
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Control filters
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      if (onShopiSelected) {
                        onShopiSelected();
                      } else {
                        onPushRoute?.("shopi-market");
                      }
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Shopi Market
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Upload products
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onPushRoute?.("ad-plus");
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Ad + Publisher
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Publish promo links
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onPushRoute?.("stars-graph");
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Stars Standing
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Pro scoreboard
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      setShowEditProfile(true);
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-[#2979ff] rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <UserCog className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Edit
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Profile & details
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      if (onOpenCreatePost) onOpenCreatePost();
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-brand-pink/50 rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Create Post
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Publish new streams
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onPushRoute?.("splash");
                    }}
                    className="p-2 bg-neutral-900 border border-white/5 hover:border-brand-pink/50 rounded-xl text-left cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Tv className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-bold text-neutral-200 leading-tight">
                        Splash Screen
                      </span>
                      <span className="block text-[8px] text-neutral-500 font-mono leading-none mt-0.5">
                        Intro boot logic
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto text-center pt-8 pb-4">
              <button
                onClick={() => setShowQuickMenu(false)}
                className="px-8 py-2.5 bg-white hover:bg-neutral-100 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Close Navigator
              </button>
              <span className="block text-[8.5px] font-sans text-neutral-500 mt-2.5">
                Securely connected and verified
              </span>
            </div>
          </div>
        )}
      </div>

      {activeCommentsPost && (
        <div className="fixed inset-0 z-[100000] bg-black/20 flex flex-col items-center justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121214] rounded-t-3xl h-[50vh] flex flex-col shadow-2xl overflow-hidden border-t border-white/10 relative">
            <div className="flex items-center justify-center p-3 border-b border-white/5 relative">
              <span className="font-bold text-white text-sm tracking-widest uppercase">
                Comments
              </span>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="absolute right-4 text-zinc-400 hover:text-white p-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {(commentsMap[activeCommentsPost] || []).length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full text-zinc-500 text-sm">
                  No comments yet. Be the first!
                </div>
              ) : (
                (commentsMap[activeCommentsPost] || []).map((comment) => (
                  <div key={comment.id} className="flex space-x-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white uppercase text-center align-middle relative">
                      {comment.author.charAt(1) || "A"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-zinc-200 font-bold text-[13px]">
                          {comment.author}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {comment.time}
                        </span>
                      </div>
                      <span className="text-zinc-300 text-[13px] leading-relaxed mt-0.5">
                        {comment.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const text = commentInputs[activeCommentsPost] || "";
                if (!text.trim()) return;

                try {
                  await api.commentPost(activeCommentsPost, text.trim());
                  setCommentInputs((prev) => ({
                    ...prev,
                    [activeCommentsPost]: "",
                  }));
                } catch (err) {
                  console.error("Failed to post comment:", err);
                }
              }}
              className="p-4 border-t border-white/5 bg-[#0a0a0c] flex items-center space-x-3"
            >
              <input
                type="text"
                autoFocus
                value={commentInputs[activeCommentsPost] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [activeCommentsPost]: e.target.value,
                  }))
                }
                placeholder="Add a comment..."
                className="flex-1 bg-zinc-900/50 rounded-full border border-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                disabled={!(commentInputs[activeCommentsPost] || "").trim()}
                className="text-[#0091FF] font-bold text-sm disabled:opacity-50 transition-opacity"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Snap Insights Overlay Modal */}
      {activeInsightsPost &&
        (() => {
          const allInsightsUsers = fetchOrCreatePostInsights(activeInsightsPost);
          
          const watchedUsers = allInsightsUsers;
          const staredUsers = allInsightsUsers.filter((u) => u.stared);
          const reportedUsers = allInsightsUsers.filter((u) => u.reported);

          const watchedUsersCount = watchedUsers.length;
          const staredUsersCount = staredUsers.length;
          const reportCount = reportedUsers.length;

          const displayedUsers =
            activeInsightsTab === "watched"
              ? watchedUsers
              : activeInsightsTab === "stared"
                ? staredUsers
                : reportedUsers;

          return (
            <div className="fixed inset-0 z-[100000] bg-black/20 flex flex-col items-center justify-end animate-in fade-in duration-200">
              <div className="w-[95%] sm:w-full max-w-[340px] bg-[#1c1c1e] rounded-t-3xl h-[50vh] flex flex-col shadow-2xl overflow-hidden relative mx-auto">
                {/* Top Drag Handle Indicator */}
                <div className="w-full flex justify-center py-2 absolute top-0">
                  <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
                </div>

                {/* Header Tabs */}
                <div className="pt-6 pb-2 px-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex bg-[#2c2c2e] p-1 rounded-xl w-[90%] gap-1">
                    <button
                      onClick={() => setActiveInsightsTab("watched")}
                      className={`flex-1 rounded-lg font-bold text-xs py-2 shadow flex justify-center items-center gap-1.5 transition-colors ${activeInsightsTab === "watched" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Watched{" "}
                      <span
                        className={`${activeInsightsTab === "watched" ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400"} px-1.5 py-0.5 rounded text-[10px]`}
                      >
                        {watchedUsersCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveInsightsTab("stared")}
                      className={`flex-1 rounded-lg font-bold text-xs py-2 flex justify-center items-center gap-1.5 transition-colors ${activeInsightsTab === "stared" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${activeInsightsTab === "stared" ? "fill-current" : ""}`}
                      />{" "}
                      Stared{" "}
                      <span className="text-[10px]">{staredUsersCount}</span>
                    </button>
                    <button
                      onClick={() => setActiveInsightsTab("reports")}
                      className={`flex-1 rounded-lg font-bold text-xs py-2 flex justify-center items-center gap-1.5 transition-colors ${activeInsightsTab === "reports" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Reports <span className="text-[10px]">{reportCount}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveInsightsPost(null)}
                    className="p-2 text-zinc-500 hover:text-white active:scale-95 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-4 py-2 text-[10px] text-zinc-500 uppercase tracking-wider text-center border-b border-white/5 bg-[#141415]">
                  Watched by all user in the app
                </div>

                {/* List of watchers */}
                <div className="flex-1 overflow-y-auto pb-6">
                  {displayedUsers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full text-zinc-500 text-sm mt-12">
                      No users to show.
                    </div>
                  ) : (
                    <>
                      {displayedUsers.slice(0, 100).map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border-b border-white/5 group hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar || getHumanAvatar(user.name)}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <div className="text-white font-bold text-sm">
                                {user.name}
                              </div>
                              <div className="text-zinc-500 font-bold text-[10px] mt-0.5 tracking-wider">
                                {user.timestamp ? formatRelativeTime(user.timestamp) : user.time}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {user.stared && activeInsightsTab !== "reports" && (
                              <Star className="w-5 h-5 fill-cyan-400 text-cyan-400" />
                            )}
                            {activeInsightsTab === "reports" && (
                              <div className="text-[#F52C68] text-xs font-bold uppercase mr-2 tracking-wider">
                                Reported
                              </div>
                            )}
                            {user.id !== 'you' && (
                              <button className="bg-[#2c2c2e] hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2 rounded-full transition-colors active:scale-95">
                                Message
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {displayedUsers.length > 100 && (
                        <div className="text-center py-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-[#141415]/40 border-t border-white/5">
                          + {displayedUsers.length - 100} more {activeInsightsTab} entries
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {postMenu && document.getElementById("modal-portal-root") && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[90000] flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-[#1c1c1e] border border-white/10 w-full max-w-[260px] rounded-[18px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
            {postMenu.isOwner ? (
              <button
                onClick={() => {
                  try {
                    const storedPublic = scopedStorage.getItem(
                      "booran_public_posts",
                    );
                    if (storedPublic) {
                      const parsed = JSON.parse(storedPublic);
                      const updated = parsed.filter(
                        (p: any) => p.id !== postMenu.id,
                      );
                      scopedStorage.setItem(
                        "booran_public_posts",
                        JSON.stringify(updated),
                      );
                    }
                    if (
                      typeof window !== "undefined" &&
                      (window as any).booran_volatile_posts
                    ) {
                      (window as any).booran_volatile_posts = (
                        window as any
                      ).booran_volatile_posts.filter(
                        (p: any) => p.id !== postMenu.id,
                      );
                    }
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("booran_posts_updated"));
                    }
                  } catch (e) {
                    console.error(e);
                  }
                  triggerToast("🗑️ Post deleted.");
                  setPostMenu(null);
                }}
                className="py-4 text-[#ff3b30] text-[15px] font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
              >
                Delete Post
              </button>
            ) : (
              <button
                onClick={async () => {
                  const postId = postMenu.id;

                  try {
                    await api.reportItem({
                      reportedItemId: postId,
                      reportedItemType: 'post',
                      reason: 'Community Flag'
                    });
                  } catch (e) {
                    console.error("Report failed:", e);
                  }

                  setHiddenPostIds((prev) => ({ ...prev, [postId]: true }));
                  trackUserInteractionInInsights(postId, "report", username);
                  triggerToast(
                    "Report lodged. Booran AI-Shield checking hash signature.",
                  );
                  setPostMenu(null);
                }}
                className="py-4 text-[#ff3b30] text-[15px] font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
              >
                Report Post
              </button>
            )}
            <div className="h-[1px] bg-white/10 w-full" />
            <button
              onClick={() => setPostMenu(null)}
              className="py-4 text-white text-[15px] font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.getElementById("modal-portal-root")!
      )}

      {/* Invisible Stories Manager player-only container */}
      <StoriesManager
        currentUserAvatar={currentUserAvatar}
        currentUsername="you"
        triggerToast={triggerToast}
        storyGroups={storyGroups}
        setStoryGroups={setStoryGroups}
        isCreatingStory={isCreatingStory}
        setIsCreatingStory={setIsCreatingStory}
        activeStoryGroupIndex={activeStoryGroupIndex}
        setActiveStoryGroupIndex={setActiveStoryGroupIndex}
        activeStoryIndex={activeStoryIndex}
        setActiveStoryIndex={setActiveStoryIndex}
        isViewingStories={isViewingStories}
        setIsViewingStories={setIsViewingStories}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        playerOnly={true}
        onOpenDMs={onOpenDMs}
        onOpenConnectionsHub={onOpenConnectionsHub}
      />

      {/* QR Modal Overlay */}
      {showQRModal && (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-[#111111] rounded-[24px] border border-white/5 p-6 flex flex-col items-center relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full overflow-hidden mb-3 shadow-[0_0_15px_rgba(59,130,246,0.2)] border-2 border-blue-500/50">
              <img
                src={currentUserAvatar || getHumanAvatar(username)}
                alt={username}
                className="w-full h-full object-cover"
              />
            </div>
            <h1
              className="text-xl text-white mb-2 font-medium tracking-tight"
              style={{
                fontFamily: "'Caveat', 'Segoe Script', cursive",
                textShadow: "1px 2px 4px rgba(0,0,0,0.4)",
              }}
            >
              {username}
            </h1>
            <p className="text-[10px] text-neutral-400 text-center mb-6 leading-relaxed max-w-[220px]">
              This is your secure digital identifier. Other users can scan this
              to instantly connect.
            </p>
            <div className="relative group mb-2">
              {/* Subtle glowing pulse */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl opacity-30 blur-lg animate-pulse" />
              <div className="relative bg-white p-3 rounded-[1.25rem] shadow-inner">
                <div id="user-qr-wrapper" className="bg-white rounded-xl overflow-hidden p-1 flex items-center justify-center">
                  <QRCode
                    value={`https://scrollrise.app/user/${(username || "guest").toLowerCase().replace(/\s+/g, "-")}`}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                  />
                </div>
                <button 
                  onClick={() => triggerToast("Scanner opening...")}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold text-white tracking-wide">
                    QR Scanner
                  </span>
                </button>
              </div>
            </div>
            
            <button
              onClick={handleShareConnect}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && document.getElementById("modal-portal-root") && createPortal(
        <div className="absolute inset-0 z-[6000] pointer-events-auto bg-black flex items-center justify-center -translate-y-[10vh] p-6 animate-in fade-in">
          <div className="bg-black w-full text-center max-w-[280px] flex flex-col items-center">
            <h3 className="text-white text-[20px] font-bold mb-6 tracking-wide">
              All Users
            </h3>
            <div className="w-full space-y-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  scopedStorage.setItem("booran_create_post_type", "photo");
                  if (onOpenCreatePost) onOpenCreatePost();
                }}
                className="w-full bg-[#1c1c1c] rounded-[24px] py-5 px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 hover:bg-[#252525] transition-colors"
              >
                <div className="flex justify-start">
                  <span className="font-bold text-white text-[15px]">PRO</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-[17px] tracking-wide">
                    Snaps
                  </span>
                  <span className="text-white font-medium text-[14px] opacity-80">
                    (Images)
                  </span>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-6 h-6 text-[#0EA5E9] stroke-[3]" />
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  scopedStorage.setItem("booran_create_post_type", "video");
                  if (onOpenCreatePost) onOpenCreatePost();
                }}
                className="w-full bg-[#1c1c1c] rounded-[24px] py-5 px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 hover:bg-[#252525] transition-colors"
              >
                <div className="flex justify-start">
                  <span className="font-bold text-white text-[15px]">PRO</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-[17px] tracking-wide">
                    Scrolls
                  </span>
                  <span className="text-white font-medium text-[14px] opacity-80">
                    (Videos)
                  </span>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="w-6 h-6 text-[#0EA5E9] stroke-[3]" />
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              className="mt-10 text-[#0EA5E9] font-medium text-[16px]"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.getElementById("modal-portal-root")!
      )}

      {/* Dynamic customized toast helper */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100000] bg-neutral-900 border border-white/10 px-5 py-3 rounded-2xl shadow-2xl text-sm text-white font-sans font-medium hover:scale-105 transition-transform flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0091FF] animate-pulse shadow-[0_0_8px_#0091FF]" />
          {toastMessage}
        </div>
      )}

      {activeCommentsPost && (
        <div className="fixed inset-0 z-[100000] bg-black/20 flex flex-col items-center justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121214] rounded-t-3xl h-[50vh] flex flex-col shadow-2xl overflow-hidden border-t border-white/10 relative">
            <div className="flex items-center justify-center p-3 border-b border-white/5 relative">
              <span className="font-bold text-white text-sm tracking-widest uppercase">
                Comments
              </span>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="absolute right-4 text-zinc-400 hover:text-white p-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {(commentsMap[activeCommentsPost] || []).length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full text-zinc-500 text-sm">
                  No comments yet. Be the first!
                </div>
              ) : (
                (commentsMap[activeCommentsPost] || []).map((comment) => (
                  <div key={comment.id} className="flex space-x-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white uppercase text-center align-middle relative">
                      {comment.author.charAt(1) || "A"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-zinc-200 font-bold text-[13px]">
                          {comment.author}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {comment.time}
                        </span>
                      </div>
                      <span className="text-zinc-300 text-[13px] leading-relaxed mt-0.5">
                        {comment.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = commentInputs[activeCommentsPost] || "";
                if (!text.trim()) return;
                const newComment = {
                  id: `c-dyn-${Date.now()}`,
                  author: "@you",
                  text: text.trim(),
                  time: "Just now",
                };
                setCommentsMap((prev) => ({
                  ...prev,
                  [activeCommentsPost]: [
                    ...(prev[activeCommentsPost] || []),
                    newComment,
                  ],
                }));
                setCommentInputs((prev) => ({
                  ...prev,
                  [activeCommentsPost]: "",
                }));
              }}
              className="p-4 border-t border-white/5 bg-[#0a0a0c] flex items-center space-x-3"
            >
              <input
                type="text"
                autoFocus
                value={commentInputs[activeCommentsPost] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [activeCommentsPost]: e.target.value,
                  }))
                }
                placeholder="Add a comment..."
                className="flex-1 bg-zinc-900/50 rounded-full border border-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                disabled={!(commentInputs[activeCommentsPost] || "").trim()}
                className="text-[#0091FF] font-bold text-sm disabled:opacity-50 transition-opacity"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
      
      {showShareSheet && document.getElementById("modal-portal-root") && createPortal(
        <ShareSheetModal onClose={() => setShowShareSheet(false)} activePostSrc={activeShareSrc || undefined} activePostMediaType={activeShareMediaType} />,
        document.getElementById("modal-portal-root")!
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && document.getElementById("modal-portal-root") && createPortal(
        <div className="absolute inset-0 z-[110000] pointer-events-auto bg-black flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black">
            <button
              onClick={() => setShowEditProfile(false)}
              className="text-white hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[22px] font-black tracking-tight text-white font-sans">EDIT PROFILE</span>
            </div>
            <div className="w-6" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400">Profile Picture</label>
                <div className="w-24 h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center relative cursor-pointer group" onClick={() => triggerToast("Avatar update feature locked in Sandbox.")}>
                  <img src={currentUserAvatar} alt="Profile" className="w-full h-full object-cover rounded-full opacity-50 group-hover:opacity-30 transition-opacity" />
                  <Camera className="w-6 h-6 absolute text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400">Username</label>
                <input type="text" defaultValue={username} className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-400">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <button 
                onClick={() => {
                  triggerToast("Profile updated!");
                  setShowEditProfile(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors mt-4"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal-root")!
      )}

      {/* PRO Options Modal */}
      {showProModal && document.getElementById("modal-portal-root") && createPortal(
        <div className="absolute inset-0 z-[110000] pointer-events-auto bg-black flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black">
            <button
              onClick={() => setShowProModal(false)}
              className="text-white hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[22px] font-black tracking-tight text-white font-sans">PRO</span>
              <span className="text-[#e5b858] text-[24px]">★</span>
            </div>
            <div className="w-6" /> {/* spacer for balance */}
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 bg-black text-left">
            {/* UI Section */}
            <div className="space-y-6">
              <h2 className="text-[36px] font-black tracking-tight text-white leading-none">UI</h2>
              
              <div className="space-y-6">
                {/* Glassmorphism Toggle */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-[22px] font-bold tracking-tight text-white">Glassmorphism</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !glassmorphismActive;
                      setGlassmorphismActive(nextVal);
                      safeSetStorage("app-glassmorphism", nextVal ? "true" : "false");
                      window.dispatchEvent(new CustomEvent("app-glassmorphism-change", { detail: nextVal }));
                      triggerToast(nextVal ? "Glassmorphism blur active" : "Standard canvas restored");
                    }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                      glassmorphismActive ? "bg-[#007AFF]" : "bg-[#2c2c2e]"
                    }`}
                  >
                    <span
                      className="inline-block h-6 w-6 rounded-full bg-white transition-transform duration-200 ease-in-out"
                      style={{ transform: glassmorphismActive ? "translateX(28px)" : "translateX(4px)" }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Background Section */}
            <div className="space-y-6 pt-4">
              <h2 className="text-[36px] font-black tracking-tight text-white leading-none">Background</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-8">
                  <div className="flex flex-col gap-4">
                    <label 
                      className={`relative w-28 h-28 hover:bg-[#2c2c2e] border border-white/5 cursor-pointer active:scale-95 rounded-3xl flex flex-col items-center justify-center transition-all duration-200 overflow-hidden group`}
                      style={{ backgroundColor: '#1c1c1e' }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const img = new window.Image();
                              img.onload = () => {
                                setOriginalImageDimensions({ width: img.width, height: img.height });
                                setAdjustingBgImageSrc(reader.result as string);
                                setBgZoom(1.0);
                                setBgOffset({ x: 0, y: 0 });
                                e.target.value = "";
                              };
                              img.src = reader.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      {proBgImage ? (
                        <>
                          <img
                            src={proBgImage}
                            alt="Custom background preview"
                            className="w-full h-full object-cover"
                            style={{ filter: `brightness(${proBgBrightness})` }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white bg-black/20 px-2 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                              Change
                            </span>
                          </div>
                        </>
                      ) : !glassmorphismActive ? (
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      ) : (
                        <span className="text-[36px] text-white font-light font-sans">+</span>
                      )}
                    </label>
                    {proBgImage && (
                      <button
                        onClick={() => {
                          setProBgImage(null);
                          safeRemoveStorage("app-background");
                          window.dispatchEvent(new CustomEvent("app-background-change", { detail: null }));
                          triggerToast("Background removed");
                        }}
                        className="text-xs text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg font-medium tracking-wide transition-colors mt-1 w-full flex items-center justify-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {glassmorphismActive && (
                  <div className="flex flex-row items-end gap-6 mt-2">
                    {(proBgImage || proBgColor) && (
                      <div className="flex flex-col gap-2 w-full max-w-[80px]">
                        <span className="text-white text-[11px] font-medium pl-1">Brightness</span>
                        <input
                          type="range"
                          min="0.1"
                          max="2"
                          step="0.05"
                          value={proBgBrightness}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setProBgBrightness(val);
                            safeSetStorage("app-background-brightness", val.toString());
                            window.dispatchEvent(new CustomEvent("app-background-brightness-change", { detail: val }));
                          }}
                          className="w-full h-2.5 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer shadow-sm"
                        />
                      </div>

                    )}
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <span className="text-white text-[11px] font-medium pl-1">Color</span>
                    <div className="flex items-center gap-3">
                      <div 
                        ref={colorSliderRef}
                        className="relative h-[32px] w-[180px] rounded-md overflow-hidden border border-white/20 shadow-inner cursor-pointer flex-1"
                      onPointerDown={(e) => {
                        const target = e.currentTarget;
                        target.setPointerCapture(e.pointerId);
                        const rect = target.getBoundingClientRect();
                        let x = e.clientX - rect.left;
                        x = Math.max(0, Math.min(x, rect.width));
                        const percent = x / rect.width;
                        setColorSliderPercent(percent);
                        
                        const colors = [
                          [148, 0, 211], [75, 0, 130], [0, 0, 255], [0, 255, 0],
                          [255, 255, 0], [255, 165, 0], [255, 0, 0], [255, 255, 255]
                        ];
                        const scaled = percent * (colors.length - 1);
                        const idx = Math.floor(scaled);
                        const rem = scaled - idx;
                        const c1 = colors[Math.min(idx, colors.length - 1)];
                        const c2 = colors[Math.min(idx + 1, colors.length - 1)];
                        const r = Math.round(c1[0] + (c2[0] - c1[0]) * rem);
                        const g = Math.round(c1[1] + (c2[1] - c1[1]) * rem);
                        const b = Math.round(c1[2] + (c2[2] - c1[2]) * rem);
                        const newColor = `rgb(${r}, ${g}, ${b})`;
                        
                        setProBgColor(newColor);
                        safeSetStorage("app-background-color", newColor);
                        window.dispatchEvent(new CustomEvent("app-background-color-change", { detail: newColor }));
                      }}
                      onPointerMove={(e) => {
                        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          let x = e.clientX - rect.left;
                          x = Math.max(0, Math.min(x, rect.width));
                          const percent = x / rect.width;
                          setColorSliderPercent(percent);
                          
                          const colors = [
                            [148, 0, 211], [75, 0, 130], [0, 0, 255], [0, 255, 0],
                            [255, 255, 0], [255, 165, 0], [255, 0, 0], [255, 255, 255]
                          ];
                          const scaled = percent * (colors.length - 1);
                          const idx = Math.floor(scaled);
                          const rem = scaled - idx;
                          const c1 = colors[Math.min(idx, colors.length - 1)];
                          const c2 = colors[Math.min(idx + 1, colors.length - 1)];
                          const r = Math.round(c1[0] + (c2[0] - c1[0]) * rem);
                          const g = Math.round(c1[1] + (c2[1] - c1[1]) * rem);
                          const b = Math.round(c1[2] + (c2[2] - c1[2]) * rem);
                          const newColor = `rgb(${r}, ${g}, ${b})`;

                          setProBgColor(newColor);
                          safeSetStorage("app-background-color", newColor);
                          window.dispatchEvent(new CustomEvent("app-background-color-change", { detail: newColor }));
                        }
                      }}
                      onPointerUp={(e) => {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }}
                    >
                      <div className="absolute inset-0 opacity-100 pointer-events-none" style={{ background: 'linear-gradient(to right, #9400D3, #4B0082, #0000FF, #00FF00, #FFFF00, #FFA500, #FF0000, #FFFFFF)' }} />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-white shadow-md z-10 pointer-events-none" 
                        style={{ 
                          left: `max(4px, min(100% - 20px, ${colorSliderPercent * 100}% - 8px))`,
                          backgroundColor: proBgColor || '#ef4444'
                        }} 
                      />
                    </div>
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: proBgColor || '#ef4444', filter: `brightness(${proBgBrightness})` }}
                    />
                  </div>
                </div>

                  </div>
                )}

                <p className="text-zinc-500 text-xs leading-relaxed max-w-xs mt-2">
                  Upload any custom image or choose a color to transform your background matrix instantly. Applies to your primary feed hub.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal-root")!
      )}
      
      {postAddMenu && document.getElementById("modal-portal-root") && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/40 pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setPostAddMenu(null);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setPostAddMenu(null);
            }}
          />
          <div 
            className="fixed z-[101] w-[85%] max-w-[280px] flex flex-col items-center animate-in zoom-in-95 duration-200 bg-[#1c1c1e] border border-white/10 p-3 rounded-[24px] shadow-2xl gap-2"
            style={{
              top: postAddMenuPos ? `${Math.min(window.innerHeight - 80, Math.max(80, postAddMenuPos.top))}px` : '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPostAddMenu(null);
              } else {
                e.stopPropagation();
              }
            }}
            onTouchStart={(e) => {
              if (e.target === e.currentTarget) {
                setPostAddMenu(null);
              } else {
                e.stopPropagation();
              }
            }}
          >
            <button
              className="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white p-4 rounded-[16px] font-bold text-base flex items-center justify-between active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                const postId = postAddMenu;
                setPostAddMenu(null);
                setPostFlashPermission(postId);
              }}
            >
              <span className="flex-1 text-center pl-6">Add to Flash</span>
              <span className="text-[#0091FF] text-2xl font-black mr-1">›</span>
            </button>

            <button
              className="w-full bg-[#3a3a3c]/70 hover:bg-[#48484a] text-zinc-300 py-3 rounded-[16px] font-semibold text-sm text-center active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setPostAddMenu(null);
              }}
            >
              Back
            </button>
          </div>
        </>,
        document.getElementById("modal-portal-root")!
      )}

      {postFlashPermission && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setPostFlashPermission(null);
            }}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[85%] max-w-[340px] flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1e1e1e] border border-white/10 w-full rounded-[24px] p-6 shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#0091FF]/10 flex items-center justify-center text-[#0091FF] mb-4">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[32px] h-[32px]">
                   <rect x="9" y="10" width="12" height="12" rx="4" />
                   <path d="M15 13v6" />
                   <path d="M12 16h6" />
                   <path d="M14 10v-1a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h1" />
                 </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 text-center">Add to your flash?</h3>
              <p className="text-neutral-400 text-sm text-center mb-6">
                This post will be added to your flash for 24 hours. Your connections can view it.
              </p>
              
              <div className="flex w-full space-x-3">
                <button 
                  onClick={() => setPostFlashPermission(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const post = allVirals.find(p => p.id === postFlashPermission);
                    if (post && post.image) {
                      try {
                        await api.createFlash({
                          userId: username || "anonymous",
                          username: username || "User",
                          mediaUrl: post.image,
                          mediaType: post.format === 'video' ? 'video' : 'image',
                          caption: post.detailText || "Shared post",
                        });
                        triggerToast("Added to your flash for 24h.");
                      } catch (err) {
                        console.error("Failed to add to flash:", err);
                        triggerToast("Failed to add to flash.");
                      }
                    }
                    setPostFlashPermission(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fit to Mobile Shaped Tray Modal */}
      {adjustingBgImageSrc && document.getElementById("modal-portal-root") && createPortal(
        <div className="absolute inset-0 z-[120000] bg-black/95 flex flex-col items-center justify-between py-6 px-4 select-none animate-in fade-in duration-300">
          {/* Header */}
          <div className="w-full max-w-sm flex items-center justify-between px-2">
            <button
              onClick={() => setAdjustingBgImageSrc(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-white font-sans text-xs font-bold tracking-widest uppercase">
              FIT TO PHONE TRAY
            </span>
            <button
              onClick={handleConfirmBgAdjustment}
              className="px-5 py-2 rounded-full bg-[#4ade80] hover:bg-[#32d46e] text-black text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-90 hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]"
            >
              Done
            </button>
          </div>

          {/* Tray content container */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            {/* Instruction line */}
            <span className="text-[11px] font-mono text-neutral-400 mb-4 tracking-wider uppercase text-center max-w-[280px]">
              Drag to position • Scroll/Pinch to zoom
            </span>

            {/* Mobile shaped frame container */}
            <div 
              className="relative w-[280px] h-[498px] rounded-[44px] border-[12px] border-[#1c1c1e] bg-black overflow-hidden shadow-[0_0_60px_rgba(74,222,128,0.15)] select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleBgDragStart}
              onMouseMove={handleBgDragMove}
              onMouseUp={handleBgDragEnd}
              onMouseLeave={handleBgDragEnd}
              onTouchStart={handleBgTouchStart}
              onTouchMove={handleBgTouchMove}
              onTouchEnd={handleBgDragEnd}
              onWheel={handleBgWheel}
            >
              {/* Dynamic speaker notch / status bar mimicking real phone */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-neutral-800 rounded-full" />
              </div>

              {/* Home indicator bar at bottom of mock phone */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-30" />

              {/* Adjustable Image container */}
              <div className="absolute inset-0 w-full h-full bg-black z-10 flex items-center justify-center overflow-hidden">
                <img
                  src={adjustingBgImageSrc}
                  alt="Background fit template"
                  draggable={false}
                  className="max-w-none origin-center pointer-events-none"
                  style={{
                    transform: `translate(${bgOffset.x}px, ${bgOffset.y}px) scale(${bgZoom})`,
                    width: originalImageDimensions.width >= originalImageDimensions.height ? 'auto' : '100%',
                    height: originalImageDimensions.width >= originalImageDimensions.height ? '100%' : 'auto',
                    userSelect: 'none',
                  }}
                />
              </div>

              {/* Subtle transparent grid guide lines for professional fitting */}
              <div className="absolute inset-0 pointer-events-none z-20 border border-white/5 flex flex-col justify-between">
                <div className="h-1/3 border-b border-white/5" />
                <div className="h-1/3 border-b border-white/5" />
              </div>
              <div className="absolute inset-x-0 inset-y-0 pointer-events-none z-20 flex justify-between">
                <div className="w-1/3 border-r border-white/5" />
                <div className="w-1/3 border-r border-white/5" />
              </div>
            </div>

            {/* Elegant Manual Zoom Indicator & Zoom Buttons */}
            <div className="mt-6 flex items-center justify-between w-[280px] bg-neutral-900/95 border border-white/5 rounded-full py-2 px-4 shadow-xl">
              <button
                onClick={() => setBgZoom((prev) => Math.max(0.8, prev - 0.1))}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-neutral-300 flex items-center justify-center cursor-pointer border border-white/5"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
                Zoom {Math.round(bgZoom * 100)}%
              </span>

              <button
                onClick={() => setBgZoom((prev) => Math.min(6.0, prev + 0.1))}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-neutral-300 flex items-center justify-center cursor-pointer border border-white/5"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subdued Spacer at bottom to keep phone frame beautifully centered */}
          <div className="h-10 w-full" />
        </div>,
        document.getElementById("modal-portal-root")!
      )}
    </div>
  );
}
