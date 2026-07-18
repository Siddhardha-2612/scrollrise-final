import { scopedStorage } from "./utils/storage";
import { useState, useEffect } from "react";
import {
  Wifi,
  Battery,
  Smartphone,
  Eye,
  Sparkles,
  Home,
  MessageSquare,
  Bot,
  Camera,
  LayoutGrid,
  Radio,
  Clapperboard,
  PlusSquare,
  Search,
  User,
} from "lucide-react";
import SessionManagerModal from "./components/SessionManagerModal";
import { AppRoute } from "./types";

// Importing high fidelity sub-components
import SplashView from "./components/SplashView";
import AuthGatewayView from "./components/AuthGatewayView";
import LoginFormView from "./components/LoginFormView";
import RegistrationFormView from "./components/RegistrationFormView";
import ChannelFeedDashboard from "./components/ChannelFeedDashboard";
import DMDirectMessageThread from "./components/DMDirectMessageThread";
import GridSettingsHubView from "./components/GridSettingsHubView";
import ShopiCommerceModule from "./components/ShopiCommerceModule";
import ExploreRequestsPanel from "./components/ExploreRequestsPanel";
import DetailSettingsListView from "./components/DetailSettingsListView";
import BlockedUsersListView from "./components/BlockedUsersListView";
import EditProfilePicGridDashboard from "./components/EditProfilePicGridDashboard";
import VerifyPhoneView from "./components/VerifyPhoneView";
import EditProfileCredentialsView from "./components/EditProfileCredentialsView";
import OwnAdvertismentView from "./components/OwnAdvertismentView";
import StarsGraphView from "./components/StarsGraphView";
import PrivacySettingsView from "./components/PrivacySettingsView";
import SalesMarketView from "./components/SalesMarketView";
import BooranRobotTerminal from "./components/BooranRobotTerminal";
import ConnectionsHubView from "./components/ConnectionsHubView";
import CreatePostView from "./components/CreatePostView";
import NotificationsView from "./components/NotificationsView";
import VendorTrackerView from "./components/VendorTrackerView";
import ReelsView from "./components/ReelsView";
import { ReelData } from "./components/VideoFeedItem";
import DigitalQRProfileView from "./components/DigitalQRProfileView";
import FaceLoginView from "./components/FaceLoginView";
import { cleanupExpiredData } from "./utils/cleanup";
import { getHumanAvatar } from './utils/avatar';
import { socket } from "./utils/socket";
import { API_BASE_URL } from "./config";

interface CustomIconProps {
  active: boolean;
}

const CustomHomeIcon = ({ active }: CustomIconProps) => (
  <svg
    className={`w-[29px] h-[29px] transition-all duration-200 ${
      active ? "text-white" : "text-stone-300 hover:text-white"
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const CustomMessageSparkleIcon = ({ active }: CustomIconProps) => (
  <svg
    className={`w-[29px] h-[29px] transition-all duration-200 ${
      active ? "text-white scale-105" : "text-stone-300 hover:text-white"
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
            {/* Body of message bubble */}
    <path d="M17 4H5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2l2 3.5c.2.2.6.2.8 0l2.2-3.5h4a3 3 0 0 0 3-3V9" />
    {/* Sparkle 4-point star on the top-right */}
    <path
      d="M21 2.5 L21.5 4.5 L23.5 5 L21.5 5.5 L21 7.5 L20.5 5.5 L18.5 5 L20.5 4.5 Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

const CustomStarPlayIcon = ({ active }: CustomIconProps) => (
  <svg
    className={`w-[29px] h-[29px] transition-all duration-200 ${
      active ? "text-white scale-105" : "text-stone-300 hover:text-white"
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    <polygon points="10 10 15 13 10 16 10 10" fill="currentColor" stroke="none" />
  </svg>
);

const CustomRobotIcon = ({ active }: CustomIconProps) => (
  <svg
    className={`w-[30px] h-[30px] transition-all duration-200 ${
      active ? "text-white scale-105" : "text-stone-300 hover:text-white"
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Antenna */}
    <path d="M12 5V2" />
    <path d="M10.5 2H13.5" strokeWidth={2.4} />

    {/* Head */}
    <rect x="5.5" y="5" width="13" height="8.5" rx="2.2" />
    {/* Eyes */}
    <circle cx="9.5" cy="9.2" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="9.2" r="1.1" fill="currentColor" stroke="none" />

    {/* Neck */}
    <path d="M12 13.5V15" />

    {/* Torso/Body */}
    <rect x="7.5" y="15" width="9" height="5" rx="1.5" />

    {/* Limbs */}
    {/* Arms angled down-outwards */}
    <path d="M7.5 16.5L4.5 18.2" strokeWidth={2.4} />
    <path d="M16.5 16.5L19.5 18.2" strokeWidth={2.4} />

    {/* Legs straight down */}
    <path d="M9.8 20V22.5" strokeWidth={2.4} />
    <path d="M14.2 20V22.5" strokeWidth={2.4} />
  </svg>
);

const CustomGiftBagIcon = ({ active }: CustomIconProps) => (
  <svg
    className={`w-[30px] h-[30px] transition-all duration-200 ${
      active ? "text-white scale-105" : "text-stone-300 hover:text-white"
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Poking out items (rendered first behind bag panel) */}
    {/* Left gift box with ribbon */}
    <rect x="5.5" y="3.5" width="4.5" height="4.5" rx="0.5" />
    <path d="M7.75 3.5v4.5" strokeWidth={1.5} />
    <path d="M5.5 5.75h4.5" strokeWidth={1.5} />

    {/* Right item/package */}
    <path d="M11.5 4.5h4v4l-4-3.5z" />
    <path d="M13.5 3.5v2" strokeWidth={1.5} />

    {/* Bag body path which overlaps top items with solid mask */}
    <path d="M3.5 9h17v12h-17z" fill="#1a1c1d" />
    <path d="M3.5 9l2.4-2 2.4 2 2.4-2 2.4 2 2.4-2 2.4 2 2.6-2" />
    <path d="M3.5 9H20.5v12H3.5V9z" />

    {/* U handle in center front */}
    <path d="M9 13v1.5a3 3 0 0 0 6 0V13" />
  </svg>
);

const CustomTruckIcon = ({ active }: CustomIconProps) => (
  <svg
    className={`w-[32px] h-[32px] transition-all duration-150 ${
      active ? "text-white scale-105" : "text-stone-300 hover:text-white"
    }`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
  >
    {/* Umbrella Canopy */}
    <path d="M2 7l10-4 10 4" />
    <path d="M2 7 q3.33 2 6.66 0 q3.33 2 6.66 0 q3.33 2 6.66 0" />

    <path d="M8.66 7L12 3" />
    <path d="M15.34 7L12 3" />

    {/* Center Pole */}
    <path d="M12 8.5v3.5" />

    {/* Cart Right Counter Box */}
    <rect x="11" y="11" width="4" height="4" />

    {/* Small Items on Cart Left */}
    <rect x="3.5" y="12" width="2.5" height="3" />
    <rect x="7" y="12" width="2.5" height="3" />

    {/* Cart Base */}
    <rect x="1" y="15" width="15" height="6" />

    {/* Wheels */}
    <circle cx="4" cy="21" r="1.5" />
    <circle cx="13" cy="21" r="1.5" />

    {/* Sign board */}
    <rect x="18" y="13" width="5" height="7" rx="0.5" />
    <path d="M19.5 15h2" />
    <path d="M19.5 17h2" />
    <path d="M19.5 19h2" />

    {/* Sign legs */}
    <path d="M19 20v2" />
    <path d="M22 20v2" />
  </svg>
);

export default function App() {
  // Navigation Router state
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("splash");
  const [isInputFocused, setIsInputFocused] = useState(false);
  // Navigation stack registry for backing out of nested subpages safely
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);

  // Main Dashboard Tab Index (0 to 4 corresponding to NavigationCoreHub)
  const [activeTab, setActiveTab] = useState<number>(0);
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState<number>(0);

  // Reels State & Upload flow connection
  const [reels, setReels] = useState<ReelData[]>([]);

  // Global Reactive States
  const [username, setUsername] = useState<string>(() => {
    try {
      return scopedStorage.getItem("booran_username") || "User";
    } catch {
      return "User";
    }
  });

  useEffect(() => {
    if (username && username !== "User") {
      socket.connect();
      socket.emit('join', username);

      socket.on('message-receive', (msg) => {
         console.log("[Socket] New message:", msg);
         setHasNotifications(true);
         scopedStorage.setItem("booran_has_new_msg", "true");
         window.dispatchEvent(new CustomEvent("booran-msg-notif-sync"));
      });

      socket.on('post-update', (newPost) => {
        setReels(prev => [{
          id: newPost._id,
          src: newPost.mediaUrl,
          user: newPost.username,
          caption: newPost.caption,
          likes: 0,
          comments: "0",
          color: "#1c1c1e",
          mediaType: newPost.mediaType || 'video'
        }, ...prev]);
      });

      socket.on('flash-update', (flash) => {
         console.log("[Socket] New flash:", flash);
         setFeedRefreshTrigger(prev => prev + 1);
      });

      socket.on('connection-request', (req) => {
        console.log("[Socket] New connection request from:", req.from);
        setHasNotifications(true);
        scopedStorage.setItem("booran_has_new_msg", "true");

        // Add to pending connections for NotificationsView
        try {
          const saved = scopedStorage.getItem('booran_pending_connections');
          const parsed = saved ? JSON.parse(saved) : [];
          if (!parsed.some((p: any) => p.name === req.from)) {
            parsed.unshift({
              id: req.requestId || Date.now().toString(),
              name: req.from,
              avatar: getHumanAvatar(req.from.replace(/[^a-zA-Z0-9]/g, "_")),
              info: "Wants to connect with you",
              requested: true
            });
            scopedStorage.setItem('booran_pending_connections', JSON.stringify(parsed));
          }
        } catch (e) {}
      });

      socket.on('connection-accepted', (data) => {
        console.log("[Socket] Connection accepted with:", data.with);
        setConnectionList(prev => [...new Set([...prev, data.with])]);
        window.dispatchEvent(new CustomEvent("booran_connections_updated"));
      });

      socket.on('group-invite', (data) => {
        console.log("[Socket] Invited to group:", data.name);
        socket.emit('join-group', data.groupId);
      });

      return () => {
        socket.off('message-receive');
        socket.off('flash-update');
        socket.off('connection-request');
        socket.off('group-invite');
        socket.disconnect();
      };
    }
  }, [username]);

  const [profileAvatar, setProfileAvatar] = useState<string>(() => {
    try {
      const savedUser = scopedStorage.getItem("booran_username") || "User";
      return (
        scopedStorage.getItem(`booran_profile_avatar_${savedUser}`) ||
        getHumanAvatar(String(savedUser))
      );
    } catch {
      return getHumanAvatar("booran");
    }
  });

  const [dataSaverEnabled, setDataSaverEnabled] = useState<boolean>(false);
  const [connectionList, setConnectionList] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("05:39");

  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [isPremium, setIsPremiumState] = useState<boolean>(() => {
    return scopedStorage.getItem("booran_is_pro") === "true";
  });

  const setIsPremium = async (val: boolean) => {
    if (val) {
      try {
        await fetch(API_BASE_URL + '/api/auth/activate-pro', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}` }
        });
        scopedStorage.setItem("booran_is_pro", "true");
        setIsPremiumState(true);
      } catch (e) {
        console.error("Failed to activate pro:", e);
      }
    } else {
      scopedStorage.setItem("booran_is_pro", "false");
      setIsPremiumState(false);
    }
  };
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [cameFromDashboard, setCameFromDashboard] = useState<boolean>(false);
  const [activeDMUser, setActiveDMUser] = useState<any>({
    name: "Zack Holmes",
    avatar: getHumanAvatar("zack"),
  });

  // Notifications Red Dot indicator tracking
  const [hasNotifications, setHasNotifications] = useState<boolean>(() => {
    const existing = scopedStorage.getItem("booran_has_new_msg");
    return existing === "true"; // Defaults to false initially as we removed demos
  });

  const [isStoriesCameraOpen, setIsStoriesCameraOpen] =
    useState<boolean>(false);
  const [hubTargetUser, setHubTargetUser] = useState<string | null>(null);

  const safeGetStorage = (key: string) => {
    try {
      return scopedStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const [globalBgImage, setGlobalBgImage] = useState<string | null>(
    safeGetStorage("app-background") || null
  );

  const [globalBgColor, setGlobalBgColor] = useState<string | null>(
    safeGetStorage("app-background-color") || null
  );

  const [globalBgBrightness, setGlobalBgBrightness] = useState<number>(
    parseFloat(safeGetStorage("app-background-brightness") || "1")
  );

  const [globalGlowColor, setGlobalGlowColor] = useState<string | null>(
    safeGetStorage("app-glow-color") || "cyan"
  );

  const [globalGlassmorphism, setGlobalGlassmorphism] = useState<boolean>(
    safeGetStorage("app-glassmorphism") === "true"
  );

  useEffect(() => {
    // 1. Check if we have a MongoDB Token
    const token = scopedStorage.getItem("booran_token");
    const savedUser = scopedStorage.getItem("booran_username");

    if (token && savedUser && savedUser !== "User") {
      // 1. Fetch current profile settings from MongoDB
      fetch(API_BASE_URL + '/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username);
          setIsPremiumState(!!data.isPro);
          scopedStorage.setItem("booran_is_pro", data.isPro ? "true" : "false");

          if (data.isPro) {
            if (data.backgroundUrl) setGlobalBgImage(data.backgroundUrl);
            if (data.backgroundColor) setGlobalBgColor(data.backgroundColor);
            setGlobalBgBrightness(data.backgroundBrightness ?? 1);
            setGlobalGlassmorphism(!!data.glassmorphism);
          }
        }
      })
      .catch(err => console.error("Me fetch error:", err));

      // If we are on an auth screen but have a token, go to dashboard
      if (["splash", "auth-gateway", "login", "register", "face-login"].includes(currentRoute)) {
        pushRoute("dashboard", true);
      }
    } else {
      // If we are on a protected screen but NO token, go to auth
      if (currentRoute === "dashboard") {
        pushRoute("auth-gateway", true);
      }
    }
  }, [currentRoute]);

  useEffect(() => {
    // SYSTEM REFRESH: Clear legacy mock storage to ensure Firestore sync is pure
    const hasRefreshed = localStorage.getItem('booran_v2_refreshed');
    if (!hasRefreshed) {
      localStorage.removeItem('booran_public_posts');
      localStorage.removeItem('booran_story_groups');
      localStorage.removeItem('booran_shopi_products');
      localStorage.setItem('booran_v2_refreshed', 'true');
      console.log("[System] Legacy mock storage purged. Refreshing for Firestore sync.");
      window.location.reload();
    }

    // TEMPORARY: Reset cache due to infinite loop data duplication
    // REMOVE THIS AFTER RELOADING ONCE
    scopedStorage.removeItem('booran_direct_message_history');
    scopedStorage.removeItem('booran_direct_message_group_users');
    cleanupExpiredData();
  }, []);


  useEffect(() => {
    const handleStorageChange = () => {
      setGlobalBgImage(safeGetStorage("app-background"));
      setGlobalBgColor(safeGetStorage("app-background-color"));
      setGlobalBgBrightness(parseFloat(safeGetStorage("app-background-brightness") || "1"));
      setGlobalGlowColor(safeGetStorage("app-glow-color") || "cyan");
      setGlobalGlassmorphism(safeGetStorage("app-glassmorphism") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    const handleCustomBgChange = (e: any) => {
      setGlobalBgImage(e.detail);
    };
    const handleCustomBgColorChange = (e: any) => {
      setGlobalBgColor(e.detail);
    };
    const handleCustomBgBrightnessChange = (e: any) => {
      setGlobalBgBrightness(e.detail);
    };
    const handleGlowColorChange = (e: any) => {
      setGlobalGlowColor(e.detail);
    };
    const handleGlassmorphismChange = (e: any) => {
      setGlobalGlassmorphism(e.detail);
    };
    window.addEventListener("app-background-change", handleCustomBgChange);
    window.addEventListener("app-background-color-change", handleCustomBgColorChange);
    window.addEventListener("app-background-brightness-change", handleCustomBgBrightnessChange);
    window.addEventListener("app-glow-color-change", handleGlowColorChange);
    window.addEventListener("app-glassmorphism-change", handleGlassmorphismChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("app-background-change", handleCustomBgChange);
      window.removeEventListener("app-background-color-change", handleCustomBgColorChange);
      window.removeEventListener("app-background-brightness-change", handleCustomBgBrightnessChange);
      window.removeEventListener("app-glow-color-change", handleGlowColorChange);
      window.removeEventListener("app-glassmorphism-change", handleGlassmorphismChange);
    };
  }, []);


  useEffect(() => {
    try {
      scopedStorage.setItem("booran_username", username);
    } catch {}
  }, [username]);

  // When username changes, load their specific avatar
  useEffect(() => {
    try {
      const storedAvatar = scopedStorage.getItem(
        `booran_profile_avatar_${username}`,
      );
      if (storedAvatar) {
        setProfileAvatar(storedAvatar);
      } else {
        setProfileAvatar(
          getHumanAvatar(String(username)),
        );
      }
    } catch {}
  }, [username]);

  useEffect(() => {
    try {
      if (!username || username === "User") return;

      scopedStorage.setItem(`booran_profile_avatar_${username}`, profileAvatar);
      // Also save to generic key for fallback
      scopedStorage.setItem("booran_profile_avatar", profileAvatar);

      // 1. Sync with Multi-Session Key Rack
      const sessionsStr = scopedStorage.getItem("booran_sessions") || "[]";
      let sessions = JSON.parse(sessionsStr);
      let modified = false;

      sessions = sessions.map((s: any) => {
        if (s.username === username && s.avatar !== profileAvatar) {
          modified = true;
          return { ...s, avatar: profileAvatar };
        }
        return s;
      });

      if (modified) {
        scopedStorage.setItem("booran_sessions", JSON.stringify(sessions));
      }

      // 2. PERSIST TO MONGODB
      const token = scopedStorage.getItem("booran_token");
      if (token && profileAvatar && !profileAvatar.startsWith('https://ui-avatars.com')) {
        fetch(API_BASE_URL + '/api/auth/update-profile-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profileAvatar: profileAvatar })
        }).catch(err => console.error("Avatar Sync Error:", err));
      }
    } catch {}
  }, [profileAvatar, username]);


  // REAL-TIME MESSAGES NOTIFICATIONS removed, using Socket.io instead


  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsInputFocused(true);
      }
    };
    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
          setIsInputFocused(false);
        }
      }, 50);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleAddReel = (mediaUrl: string, isVideo: boolean, caption?: string) => {
    // Logic moved to Socket.io and API, but keeping for Prop compatibility
    console.log("Reel added:", caption);
  };

  const updateSessionRack = (name: string) => {
    const token = scopedStorage.getItem("booran_token");
    const avatar = scopedStorage.getItem(`booran_profile_avatar_${name}`) || getHumanAvatar(name);
    if (!token) return;

    try {
      const sessionsStr = scopedStorage.getItem("booran_sessions") || "[]";
      let sessions = JSON.parse(sessionsStr);
      if (!Array.isArray(sessions)) sessions = [];

      const exists = sessions.find((s: any) => s.username.toLowerCase() === name.toLowerCase());
      if (!exists) {
        sessions.unshift({ username: name, token, avatar });
        scopedStorage.setItem("booran_sessions", JSON.stringify(sessions.slice(0, 6)));
      } else {
        // Update existing
        const updated = sessions.map((s: any) =>
          s.username.toLowerCase() === name.toLowerCase() ? { ...s, token, avatar } : s
        );
        scopedStorage.setItem("booran_sessions", JSON.stringify(updated));
      }
    } catch (e) {}
  };

  const handleLoginSuccess = (name: string) => {
    setUsername(name);
    updateSessionRack(name);
    setActiveTab(0);
    pushRoute("dashboard", true);
  };

  const handleRegisterSuccess = (name: string) => {
    setUsername(name);
    updateSessionRack(name);
    setActiveTab(0);
    pushRoute("dashboard", true);
  };

  // Sync hoisted states when username changes
  useEffect(() => {
    try {
      // Rehydrate connectionList
      const storedConnections = scopedStorage.getItem("booran_connections_v2");
      if (storedConnections) {
        const parsed = JSON.parse(storedConnections);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConnectionList(parsed.filter((p: any) => typeof p === "string"));
        } else {
          setConnectionList([]);
        }
      } else {
        setConnectionList([]);
      }

      // Rehydrate isPremium
      const isPremStr = scopedStorage.getItem("booran_is_premium");
      setIsPremiumState(isPremStr === "true");

      // Rehydrate hasNotifications
      const hasNotif = scopedStorage.getItem("booran_has_new_msg");
      setHasNotifications(hasNotif === "true");

      // Fetch from Server
      const fetchConns = async () => {
        try {
          const data = await api.getConnections();
          const list = data.map((c: any) => c.user1 === username ? c.user2 : c.user1);
          setConnectionList(list);
          scopedStorage.setItem("booran_connections_v2", JSON.stringify(list));
        } catch (err) {}
      };
      const fetchReels = async () => {
        try {
          const data = await api.getPosts();
          const formatted = data.map((d: any) => ({
            id: d._id,
            src: d.mediaUrl,
            user: d.username,
            caption: d.caption,
            likes: d.likes?.length || 0,
            comments: String(d.comments?.length || 0),
            color: "#1c1c1e",
            mediaType: d.mediaType || 'video'
          }));
          setReels(formatted);
        } catch (err) {}
      };
      if (username !== "User") {
        fetchConns();
        fetchReels();
      }
    } catch (_) {}
  }, [username]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.origin === "App") return; // Avoid self-sync loop
      try {
        const storedConnections = scopedStorage.getItem("booran_connections_v2");
        if (storedConnections) {
          const parsed = JSON.parse(storedConnections);
          if (Array.isArray(parsed)) {
            const newList = parsed.filter((p: any) => typeof p === "string");
            setConnectionList((prev) => {
              if (JSON.stringify(newList) !== JSON.stringify(prev)) {
                return newList;
              }
              return prev;
            });
          }
        }
      } catch (_) {}
    };
    
    window.addEventListener("booran_connections_updated", handleSync);
    return () => window.removeEventListener("booran_connections_updated", handleSync);
  }, []);


  useEffect(() => {
    const handleCameraStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsStoriesCameraOpen(!!customEvent.detail?.active);
    };
    window.addEventListener("stories-camera-active", handleCameraStateChange);
    return () =>
      window.removeEventListener(
        "stories-camera-active",
        handleCameraStateChange,
      );
  }, []);

  useEffect(() => {
    const handleAdd = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.name) {
        setConnectionList((prev) => {
          if (!prev.includes(ce.detail.name)) {
            return [...prev, ce.detail.name];
          }
          return prev;
        });
      }
    };
    window.addEventListener("booran-add-connection", handleAdd);
    return () => window.removeEventListener("booran-add-connection", handleAdd);
  }, []);

  // Strict screen stop scrolling function for camera view
  useEffect(() => {
    if (isStoriesCameraOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100vw";
      document.body.style.height = "100vh";

      const preventTouchScroll = (e: TouchEvent) => {
        // Prevent all drag-scrolling/gestures on screen
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      document.addEventListener("touchmove", preventTouchScroll, {
        passive: false,
      });
      return () => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.height = "";
        document.removeEventListener("touchmove", preventTouchScroll);
      };
    }
  }, [isStoriesCameraOpen]);

  useEffect(() => {
    const syncNotifs = () => {
      setHasNotifications(
        scopedStorage.getItem("booran_has_new_msg") === "true",
      );
    };
    window.addEventListener("booran-msg-notif-sync", syncNotifs);
    return () =>
      window.removeEventListener("booran-msg-notif-sync", syncNotifs);
  }, []);

  // Sync virtual clock status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = now.getUTCHours().toString().padStart(2, "0");
      const mins = now.getUTCMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 15000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top on route or tab change to prevent page scrolling down issue on mount
  useEffect(() => {
    const scroller = document.getElementById("main-scroll-container");
    if (scroller) {
      const reset = () => {
        if (scroller) scroller.scrollTop = 0;
      };
      reset();
      requestAnimationFrame(reset);
      setTimeout(reset, 50);
      setTimeout(reset, 150);
      setTimeout(reset, 300);
    }
  }, [currentRoute, activeTab]);

  // Safe navigation helpers
  const pushRoute = (route: AppRoute, replace = false) => {
    if (replace) {
      window.history.replaceState({ route }, "", "#" + route);
    } else {
      window.history.pushState({ route }, "", "#" + route);
    }
    setCurrentRoute(route);
    if (route === "dashboard") {
      setActiveTab(0);
    }
  };

  const popRoute = () => {
    // Check if we can go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setCurrentRoute("dashboard");
    }
  };

  // Physical Back Button Handler
  useEffect(() => {
    const handleHardwareBack = (e: PopStateEvent) => {
      if (e.state && e.state.route) {
        // Pop the current view and show previous
        setCurrentRoute(e.state.route);
      } else {
        // If we are at the very start, default to dashboard or let OS handle exit
        if (currentRoute !== "dashboard") {
          setCurrentRoute("dashboard");
        }
      }
    };

    // Initialize the very first state so the "Back" button has a destination
    if (!window.history.state) {
      window.history.replaceState({ route: "splash" }, "");
    }

    window.addEventListener("popstate", handleHardwareBack);
    return () => window.removeEventListener("popstate", handleHardwareBack);
  }, [currentRoute]);

  // State handlers
  const handleAddConnection = async (name: string) => {
    if (name && typeof name === "string" && username !== "User") {
      const cleanName = name.replace(/^@+/, "");
      try {
        await api.requestConnection(cleanName);
      } catch (err) {
        console.error("Failed to add connection:", err);
      }
    }
  };

  const handleToggleConnection = async (name: string) => {
    if (username === "User") return;
    const cleanName = name.replace(/^@+/, "");

    try {
      // In your MongoDB system, we'd have a toggle endpoint or similar
      // For now, let's just use requestConnection as a simple implementation
      await api.requestConnection(cleanName);
    } catch (err) {
      console.error("Failed to toggle connection:", err);
    }
  };

  // Render sub page depending on routing state parameters
  const renderRouteContent = () => {
    switch (currentRoute) {
      case "splash":
        return (
          <SplashView onComplete={() => {
            const token = scopedStorage.getItem("booran_token");
            const savedUser = scopedStorage.getItem("booran_username");
            if (token && savedUser && savedUser !== "User") {
              pushRoute("dashboard", true);
            } else {
              pushRoute("auth-gateway", true);
            }
          }} />
        );

      case "auth-gateway":
        return (
          <AuthGatewayView
            onLoginSelected={() => pushRoute("login")}
            onRegisterSelected={() => pushRoute("register")}
            onFaceLoginSelected={() => pushRoute("face-login")}
            onBackToExisting={
              cameFromDashboard
                ? () => {
                    setCameFromDashboard(false);
                    pushRoute("dashboard", true);
                    setActiveTab(2);
                  }
                : undefined
            }
          />
        );

      case "face-login":
        return (
          <FaceLoginView 
            onBack={popRoute} 
            onSuccess={handleLoginSuccess} 
            onGoToManualLogin={() => {
              pushRoute("login", true);
            }}
          />
        );

      case "login":
        return (
          <LoginFormView 
            onBack={popRoute} 
            onSuccess={handleLoginSuccess} 
            onFaceLoginSelected={() => pushRoute("face-login", true)}
          />
        );

      case "register":
        return (
          <RegistrationFormView
            onBack={popRoute}
            onSuccess={handleRegisterSuccess}
          />
        );

      case "dm-thread":
        return (
          <DMDirectMessageThread
            onBack={popRoute}
            connectionList={connectionList}
            onToggleConnection={handleToggleConnection}
            targetUser={activeDMUser?.name}
            currentUsername={username}
          />
        );

      case "settings-detail":
        return (
          <DetailSettingsListView
            onBack={popRoute}
            onNavigateToBlocked={() => pushRoute("blocked-users")}
            onNavigateToEditProfilePic={() => pushRoute("edit-profile-pic")}
            onNavigateToEditCredentials={() => pushRoute("verify-phone")}
            onNavigateToPrivacy={() => pushRoute("privacy-panel")}
            dataSaver={dataSaverEnabled}
            onToggleDataSaver={setDataSaverEnabled}
            onLogout={async () => {
              try {
                scopedStorage.removeItem("booran_token");
                scopedStorage.removeItem("booran_username");
                setUsername("User");
                pushRoute("auth-gateway", true);
              } catch (err) {
                console.error("Logout error:", err);
              }
            }}
            onLogoutAllDevices={async () => {
              try {
                scopedStorage.removeItem("booran_token");
                scopedStorage.removeItem("booran_username");
                setUsername("User");
                pushRoute("splash", true);
              } catch (err) {
                console.error("Logout error:", err);
              }
            }}
          />
        );

      case "blocked-users":
        return <BlockedUsersListView onBack={popRoute} />;

      case "edit-profile-pic":
        return (
          <EditProfilePicGridDashboard
            onBack={popRoute}
            currentAvatar={profileAvatar}
            onSelectAvatar={setProfileAvatar}
          />
        );

      case "verify-phone":
        return (
          <VerifyPhoneView
            onBack={popRoute}
            onVerified={() => pushRoute("edit-credentials")}
          />
        );

      case "edit-credentials":
        return (
          <EditProfileCredentialsView
            onBack={popRoute}
            currentUsername={username}
            onSaveAndLogout={async (newUsername, newPassword) => {
              const token = scopedStorage.getItem("booran_token");
              if (token) {
                try {
                  const response = await fetch(API_BASE_URL + '/api/auth/update-credentials', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newUsername, newPassword })
                  });

                  if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update credentials");
                  }

                  // Force logout for security
                  scopedStorage.removeItem("booran_token");
                  scopedStorage.removeItem("booran_username");
                  setUsername(newUsername);
                  pushRoute("auth-gateway", true);
                } catch (err: any) {
                  console.error("Credential update error:", err);
                  alert(err.message || "Failed to update credentials. You may need to log in again.");
                }
              } else {
                setUsername(newUsername);
                pushRoute("auth-gateway", true);
              }
            }}
          />
        );

      case "ad-plus":
        return (
          <OwnAdvertismentView
            onBack={popRoute}
            isPremium={isPremium}
            onTogglePremium={setIsPremium}
            currentUsername={username}
            onPostAd={(name, mediaUrl, mediaType, adLink, adContact) => {
              console.log("Posted dynamic ad:", name);
            }}
          />
        );

      case "stars-graph":
        return <StarsGraphView onBack={popRoute} />;

      case "reels":
        return (
          <ReelsView
            onBack={() => {
              pushRoute("dashboard", true);
              setActiveTab(0);
            }}
            dataSaverEnabled={dataSaverEnabled}
            currentUsername={username}
            currentUserAvatar={profileAvatar}
            connectionList={connectionList}
            onInfoClick={(targetUser) => {
              setHubTargetUser(targetUser);
              pushRoute("connections-hub");
            }}
            onToggleConnection={handleToggleConnection}
            onNavigateToMessages={() => {
              popRoute();
              setActiveTab(1);
            }}
            onOpenDMs={(targetUser) => {
              if (targetUser) {
                setActiveDMUser({
                  name: targetUser,
                  avatar: getHumanAvatar(targetUser.replace(/[^a-zA-Z0-9]/g, "_"))
                });
                pushRoute("dm-thread");
              }
            }}
            reels={reels}
          />
        );

      case "digital-qr-profile":
        return (
          <DigitalQRProfileView
            onBack={popRoute}
            username={username}
            currentUserAvatar={profileAvatar}
            onLogout={() => {
              scopedStorage.removeItem("booran_token");
              scopedStorage.removeItem("booran_username");
              setUsername("User");
              pushRoute("auth-gateway", true);
            }}
          />
        );

      case "privacy-panel":
        return (
          <PrivacySettingsView
            onBack={popRoute}
            isPremium={isPremium}
            onTogglePremium={setIsPremium}
            onDeleteAccount={() => {
              scopedStorage.removeItem("booran_token");
              scopedStorage.removeItem("booran_username");
              setUsername("User");
              pushRoute("splash", true);
            }}
            onLogout={() => {
              scopedStorage.removeItem("booran_token");
              scopedStorage.removeItem("booran_username");
              setUsername("User");
              pushRoute("auth-gateway", true);
            }}
          />
        );

      case "sales-market":
        return <SalesMarketView onBack={popRoute} currentUsername={username} />;

      case "shopi-market":
        return (
          <ShopiCommerceModule
            onBack={popRoute}
            isPremium={isPremium}
            onTogglePremium={setIsPremium}
            currentUsername={username}
          />
        );

      case "connections-hub":
        const normalizedHubTargetUser = hubTargetUser ? hubTargetUser.replace(/^@/, '') : null;
        const normalizedUsername = username ? username.replace(/^@/, '') : null;
        const isCurrent = !normalizedHubTargetUser || normalizedHubTargetUser.toLowerCase() === normalizedUsername?.toLowerCase();
        
        return (
          <ConnectionsHubView
            onBack={() => {
              setHubTargetUser(null);
              popRoute();
            }}
            currentUserAvatar={
              hubTargetUser
                ? getHumanAvatar(String(hubTargetUser.replace(/[^a-zA-Z0-9]/g, "_")))
                : profileAvatar
            }
            onAddConnection={handleAddConnection}
            connectionList={connectionList}
            onToggleConnection={handleToggleConnection}
            username={hubTargetUser ? hubTargetUser.replace(/^@/, '') : username.replace(/^@/, '')}
            isCurrentUserProfile={isCurrent}
            onOpenQRProfile={() => pushRoute("digital-qr-profile")}
          />
        );

      case "create-post":
        return (
          <CreatePostView
            onBack={popRoute}
            onPushRoute={pushRoute}
            currentUserAvatar={profileAvatar}
            isPremium={isPremium}
            onTogglePremium={setIsPremium}
            username={username}
            onAddReel={handleAddReel}
          />
        );

      case "notifications":
        return (
          <NotificationsView
            onBack={popRoute}
            connectionList={connectionList}
            onAddConnection={handleAddConnection}
          />
        );

      case "dashboard":
        // Core multi tab visual system (mimicking Flutter IndexedStack navigation)
        switch (activeTab) {
          case 0: // Channels Feed Dashboard
            return (
              <ChannelFeedDashboard
                feedRefreshTrigger={feedRefreshTrigger}
                currentUserAvatar={profileAvatar}
                username={username}
                onOpenDMs={(targetUser?: string) => {
                  if (targetUser) {
                    setActiveDMUser({
                      name: targetUser,
                      avatar: getHumanAvatar(targetUser.replace(/[^a-zA-Z0-9]/g, "_"))
                    });
                  }
                  pushRoute("dm-thread");
                }}
                onNavigateToSettings={() => {
                  pushRoute("settings-detail");
                }}
                onExploreSelected={() => setActiveTab(1)}
                onShopiSelected={() => setActiveTab(3)}
                onOpenConnectionsHub={(targetUsername?: string) => {
                  if (targetUsername) {
                    setHubTargetUser(targetUsername);
                  }
                  pushRoute("connections-hub");
                }}
                onOpenQRProfile={() => pushRoute("digital-qr-profile")}
                onOpenCreatePost={() => pushRoute("create-post")}
                onViralSelected={(id) => {
                  setSelectedReelId(id);
                  setActiveTab(4);
                }}
                onPushRoute={pushRoute}
                onOpenCamera={() => pushRoute("create-post")}
                dataSaverEnabled={dataSaverEnabled}
                connectionList={connectionList}
                isPremium={isPremium}
              />
            );
          case 1: // Explore panel
            return (
              <ExploreRequestsPanel
                onAddConnection={handleAddConnection}
                connectionList={connectionList}
                onToggleConnection={handleToggleConnection}
                username={username}
                onPushRoute={pushRoute}
              />
            );
          case 2: // Secure Robot AI Sentinel
            return (
              <GridSettingsHubView
                currentUserAvatar={profileAvatar}
                currentUsername={username}
                onSettingsSelected={() => {
                  pushRoute("settings-detail");
                }}
                onShopiSelected={() => setActiveTab(3)}
                onAdSelected={() => pushRoute("ad-plus")}
                onStarsSelected={() => pushRoute("stars-graph")}
                onPrivacySelected={() => pushRoute("privacy-panel")}
                onLoginSuccess={(name) => {
                  setUsername(name);
                }}
                onGoToLogin={(isEmpty: boolean) => {
                  if (isEmpty) {
                    setCameFromDashboard(false);
                  } else {
                    setCameFromDashboard(true);
                  }
                  pushRoute("auth-gateway");
                }}
                onGoToRegister={() => {
                  setCameFromDashboard(true);
                  pushRoute("register");
                }}
                onOpenSessionManager={() => setShowSessionModal(true)}
                onPushRoute={pushRoute}
              />
            );
          case 3: // Shopi Commerce Module (from 2nd image layout)
            return (
              <ShopiCommerceModule
                onBack={() => setActiveTab(0)}
                isPremium={isPremium}
                onTogglePremium={setIsPremium}
              />
            );
          case 4: // Vendor Tracker
            return (
              <VendorTrackerView
                onBack={() => setActiveTab(0)}
                currentUserAvatar={profileAvatar}
                currentUsername={username}
              />
            );
          default:
            return (
              <div className="p-8 text-center text-xs">Tab error range.</div>
            );
        }

      default:
        return (
          <SplashView onComplete={() => {
            const token = scopedStorage.getItem("booran_token");
            const savedUser = scopedStorage.getItem("booran_username");
            if (token && savedUser && savedUser !== "User") {
              pushRoute("dashboard", true);
            } else {
              pushRoute("auth-gateway", true);
            }
          }} />
        );
    }
  };

  const isAuthRoute = ["splash", "auth-gateway", "login", "register"].includes(currentRoute);
  const isCustomBgRestricted = ["settings-detail", "privacy-panel"].includes(currentRoute);
  // PRO FEATURE: Background customization only applied if user isPremium
  const applyCustomBg = isPremium && !isAuthRoute && !isCustomBgRestricted && (globalBgImage || globalBgColor);

  return (
    <div className="h-[100dvh] bg-neutral-950 font-sans flex flex-col items-center justify-center select-none w-full">
      {/* Emulator Frame / Full Screen toggle bar for visual workspace */}
      

      {/* Frame Wrapping Enclosure (Chassis) */}
      <style>{`
        :root {
          --global-glow: ${applyCustomBg && globalGlassmorphism ? (globalGlowColor || '#ff8800') : 'transparent'};
        }
        .glass-glow {
          ${applyCustomBg && globalGlassmorphism ? `
            border-color: rgba(255, 255, 255, 0.15) !important;
            background-color: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(48px) !important;
            -webkit-backdrop-filter: blur(48px) !important;
          ` : `
            border-color: rgba(255, 255, 255, 0.2) !important;
          `}
        }
      `}</style>
      <div
        key={username}
        className={`relative w-full h-full flex flex-col ${applyCustomBg && globalGlassmorphism ? 'bg-transparent' : 'bg-black'} overflow-hidden`}
      >
        

        {/* Dynamic Inner Router view frame with customized scrollbars */}
        <div
          className={`relative w-full flex-1 ${applyCustomBg ? 'bg-transparent' : 'bg-black'} flex flex-col justify-between overflow-hidden`}
        >
          {applyCustomBg && globalBgImage ? (
            <>
              <div 
                className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
                style={{ backgroundImage: `url(${globalBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: `brightness(${globalBgBrightness})` }}
              />
              <style>{`
                #main-scroll-container > div {
                  background-color: transparent !important;
                }
              `}</style>
            </>
          ) : applyCustomBg && globalBgColor ? (
            <>
              <div 
                className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
                style={{ backgroundColor: globalBgColor, filter: `brightness(${globalBgBrightness})` }}
              />
              <style>{`
                #main-scroll-container > div {
                  background-color: transparent !important;
                }
              `}</style>
            </>
          ) : null}
          {/* Scrollable Container so views scroll independently and bottom bar remains locked in place */}
          <div
            id="main-scroll-container"
            className={`flex-1 w-full relative z-10 h-[100%] ${applyCustomBg && globalGlassmorphism ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : ''} ${
              currentRoute === "dm-thread" ||
              (currentRoute === "dashboard" &&
                (activeTab === 1 ||
                  activeTab === 2 ||
                  activeTab === 3 ||
                  activeTab === 4 ||
                  isStoriesCameraOpen))
                ? "overflow-hidden"
                : "overflow-y-auto custom-scrollbar"
            }`}
          >
            {renderRouteContent()}
            {currentRoute === "dashboard" &&
              activeTab !== 2 && <div className="h-24 w-full shrink-0" />}
          </div>

          {/* Core bottom navigation panel displayed ONLY inside the dashboard state */}
          {(currentRoute === "dashboard" || currentRoute === "reels" || currentRoute === "sales-market" || currentRoute === "shopi-market") &&
            !isStoriesCameraOpen && !isInputFocused && (
              <div
                id="navigation-dock-bar"
                className="absolute bottom-10 left-3 right-3 rounded-2xl z-40 bg-[#1a1c1d] border border-[#2a2c2d] h-[60px] flex items-center justify-between px-2 animate-fade-in pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
              >
                {/* 1. Home tab */}
                <button
                  onClick={() => {
                    if (currentRoute !== "dashboard") {
                      pushRoute("dashboard");
                    }
                    window.dispatchEvent(new CustomEvent("go-home"));
                    if (activeTab === 0) {
                      setFeedRefreshTrigger((prev) => prev + 1);
                      const scroller = document.getElementById(
                        "main-scroll-container",
                      );
                      if (scroller) {
                        scroller.scrollTo({ top: 0, behavior: "smooth" });
                      }
                      const dbScroller = document.getElementById(
                        "dashboard-scroller",
                      );
                      if (dbScroller) {
                        dbScroller.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }
                    setActiveTab(0);
                  }}
                  className="flex-1 flex items-center justify-center h-full transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none"
                >
                  <CustomHomeIcon active={activeTab === 0 && currentRoute === "dashboard"} />
                </button>

                {/* 2. Reels tab */}
                <button
                  onClick={() => {
                    pushRoute("reels");
                  }}
                  className="flex-1 flex items-center justify-center h-full transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none"
                >
                  <CustomStarPlayIcon active={currentRoute === "reels"} />
                </button>

                {/* 3. Central Robot tab -> Maps to Profile/Settings Hub activeTab(2) */}
                <button
                  onClick={() => {
                    if (currentRoute === "dashboard" && activeTab === 2) {
                      setShowSessionModal(true);
                    } else {
                      if (currentRoute !== "dashboard") pushRoute("dashboard");
                      setActiveTab(2);
                    }
                  }}
                  className="flex-1 flex items-center justify-center h-full transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none"
                >
                  <CustomRobotIcon active={activeTab === 2 && currentRoute === "dashboard"} />
                </button>

                {/* 4. Box tab -> Maps to shopi market module activeTab(3) */}
                <button
                  onClick={() => {
                    if (currentRoute !== "dashboard") pushRoute("dashboard");
                    setActiveTab(3);
                  }}
                  className="flex-1 flex items-center justify-center h-full transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none"
                >
                  <CustomGiftBagIcon active={activeTab === 3 && currentRoute === "dashboard"} />
                </button>

                {/* 5. Truck/Near tab -> Maps to VendorTrackerView via activeTab(4) */}
                <button
                  onClick={() => {
                    if (currentRoute !== "dashboard") pushRoute("dashboard");
                    setActiveTab(4);
                  }}
                  className="flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none"
                >
                  <CustomTruckIcon active={activeTab === 4 && currentRoute === "dashboard"} />
                </button>
              </div>
            )}

          

          {/* Global Modal Portal Container */}
          <div id="modal-portal-root" className="absolute inset-0 z-[100000] pointer-events-none" />
        </div>
      </div>

      {/* Global Render Overlays */}
      {showSessionModal && (
        <SessionManagerModal
          currentUserAvatar={profileAvatar}
          currentUsername={username}
          onClose={() => setShowSessionModal(false)}
          onLoginSuccess={(name: string) => {
            setUsername(name);
          }}
          onGoToLogin={(isEmpty: boolean) => {
            if (isEmpty) {
              setCameFromDashboard(false);
            } else {
              setCameFromDashboard(true);
            }
            pushRoute("auth-gateway");
          }}
        />
      )}
    </div>
  );
}
