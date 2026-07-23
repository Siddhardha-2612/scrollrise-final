import { scopedStorage, getAds } from "../utils/storage";
import { trackUserInteractionInInsights } from "../utils/insights";
import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Star, MessageCircle, Share2, PlusSquare, AlertTriangle, Link as LinkIcon, User, X } from 'lucide-react';
import { ShareSheetModal } from './ShareSheetModal';
import { api } from "../services/api";

import { VideoFeedItem, ReelData } from './VideoFeedItem';
import { getHumanAvatar } from '../utils/avatar';

interface ReelsViewProps {
  onBack: () => void;
  dataSaverEnabled?: boolean;
  currentUsername?: string;
  currentUserAvatar?: string;
  onNavigateToMessages?: () => void;
  connectionList?: string[];
  onInfoClick?: (username: string) => void;
  onToggleConnection?: (username: string) => void;
  reels?: ReelData[];
  onOpenDMs?: (targetUser: string) => void;
}

export const DUMMY_REELS: ReelData[] = [
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    user: "snaps",
    likes: 3000,
    comments: "123",
    color: "#d1d1d1"
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    user: "wanderlust_2024",
    likes: 15400,
    comments: "892",
    color: "#ffb74d"
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    user: "comedy_central",
    likes: 128000,
    comments: "4.2k",
    color: "#ba68c8"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-street-with-neon-lights-40135-large.mp4",
    user: "neon_dreams",
    likes: 92000,
    comments: "2.1k",
    color: "#81c784"
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    user: "tech_reviewer",
    likes: 21000,
    comments: "1.2k",
    color: "#ef5350"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-wave-in-the-ocean-34282-large.mp4",
    user: "classic_dreamer",
    likes: 8500,
    comments: "340",
    color: "#4fc3f7"
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    user: "dragon_tales",
    likes: 890000,
    comments: "8.5k",
    color: "#ffca28"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
    user: "auto_enthusiast",
    likes: 12500,
    comments: "450",
    color: "#ab47bc"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-winter-fashion-cold-looking-woman-40210-large.mp4",
    user: "lofi_shutter",
    likes: 450000,
    comments: "5.6k",
    color: "#26a69a"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-the-piano-40507-large.mp4",
    user: "synth_wave",
    likes: 67000,
    comments: "1.9k",
    color: "#607d8b"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-sign-41870-large.mp4",
    user: "cyber_nomad",
    likes: 310000,
    comments: "4.8k",
    color: "#7e57c2"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-typing-on-a-glowing-computer-keyboard-41890-large.mp4",
    user: "hardware_junkie",
    likes: 48000,
    comments: "820",
    color: "#26c6da"
  },
  {
    src: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-city-at-night-40134-large.mp4",
    user: "focus_guild",
    likes: 920000,
    comments: "9.1k",
    color: "#ff7043"
  }
];

export const AVAILABLE_ADS: ReelData[] = [
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    user: "sponsor_one",
    likes: 1200,
    comments: "45",
    color: "#d1d1d1",
    mediaType: "video",
    createdAt: Date.now(),
    contact: "contact@sponsorone.com",
    link: "https://sponsorone.com"
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    user: "sponsor_two",
    likes: 3400,
    comments: "120",
    color: "#d1d1d1",
    mediaType: "video",
    createdAt: Date.now(),
    contact: "contact@sponsortwo.com",
    link: "https://sponsortwo.com"
  }
];

export default function ReelsView({ onBack, dataSaverEnabled, currentUsername = "User", currentUserAvatar, onNavigateToMessages, connectionList = [], onInfoClick, onToggleConnection, reels, onOpenDMs }: ReelsViewProps) {
  const [activeVideo, setActiveVideo] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  
  // Helper for Details Modal
  const getTargetUserDetails = (targetUsername: string) => {
    const isCurrentUser = currentUsername.replace(/^@/, '').toLowerCase() === targetUsername.replace(/^@/, '').toLowerCase();
    
    if (isCurrentUser) {
      return {
        mobile: scopedStorage.getItem('booran_mobile_no') || '',
        address: scopedStorage.getItem('booran_home_address') || '',
        dob: scopedStorage.getItem('booran_date_of_birth') || '',
        profession: scopedStorage.getItem('booran_profession') || '',
        isHidden: scopedStorage.getItem('booran_hide_details') === 'true'
      };
    }
    
    let isHidden = false;
    let actualMobile = '';
    let actualDob = '';
    let actualAddress = '';
    let actualProfession = '';
    
    try {
      const usersStr = scopedStorage.getItem('booran_users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const match = users.find((u: any) => u.username.toLowerCase() === targetUsername.toLowerCase().replace(/^@/, ''));
        if (match) {
          isHidden = !!match.hideDetails;
          actualMobile = match.mobileNumber || '';
          actualDob = match.dateOfBirth || '';
          actualAddress = match.homeAddress || '';
          actualProfession = match.profession || '';
        }
      }
    } catch (e) {}

    return {
      mobile: actualMobile,
      address: actualAddress,
      dob: actualDob,
      profession: actualProfession,
      isHidden
    };
  };

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [selectedShareUsers, setSelectedShareUsers] = useState<Set<string>>(new Set());
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [showPendingToast, setShowPendingToast] = useState(false);
  const [showFlashConfirm, setShowFlashConfirm] = useState(false);

  const [selectedLocalVideo, setSelectedLocalVideo] = useState<string | null>(null);
  const [selectedLocalVideoName, setSelectedLocalVideoName] = useState<string>("");
  const [toastText, setToastText] = useState<string | null>(null);
  const [showBlueNotification, setShowBlueNotification] = useState<boolean>(false);

  const triggerToast = (text: string) => {
    setToastText(text);
    setTimeout(() => setToastText(null), 3000);
  };

   const triggerVideoPicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setSelectedLocalVideo(objectUrl);
        setSelectedLocalVideoName(file.name || "Uploaded Video");
        setShowBlueNotification(true);
        setTimeout(() => setShowBlueNotification(false), 3000);
      }
    };
    input.click();
  };

  const handlePostLocalVideo = async () => {
    if (!selectedLocalVideo) return;
    
    const activeName = currentUsername
      ? currentUsername.startsWith("@")
        ? currentUsername
        : `@${currentUsername}`
      : "@you";

    try {
      await api.createPost({
        userId: currentUsername || "anonymous",
        username: activeName,
        avatar: currentUserAvatar || getHumanAvatar("booran"),
        mediaUrl: selectedLocalVideo,
        mediaType: "video",
        caption: selectedLocalVideoName || "My scroll. 🎬 #booran",
        visibility: "public"
      });
      
      setSelectedLocalVideo(null);
      setSelectedLocalVideoName("");
      triggerToast("✨ Video posted successfully on Scrolls!");
      setRefreshTick(prev => prev + 1);
      
      setActiveVideo(0);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    } catch (e) {
      console.error("Failed to post local video to scrolls:", e);
    }
  };

  const handlePostScrollFromReel = async (reel: any) => {
    const activeName = currentUsername
      ? currentUsername.startsWith("@")
        ? currentUsername
        : `@${currentUsername}`
      : "@you";

    const newPostData = {
      username: activeName,
      userId: currentUsername || "anonymous",
      avatar: getHumanAvatar(String(currentUsername.replace(/[^a-zA-Z0-9]/g, "_"))),
      mediaUrl: reel.src,
      mediaType: "video",
      caption: reel.caption || "My scroll. 🎬 #booran",
      musicTitle: "Original Audio",
      visibility: "public"
    };

    try {
      await api.createPost(newPostData);
      triggerToast("✨ Success! Posted to global feed.");
      setRefreshTick(prev => prev + 1);
      
      // Reset active video index to 0 and scroll container to top
      setActiveVideo(0);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    } catch (e) {
      console.error("Failed to repost video to scrolls:", e);
    }
  };

  const handleToggleLink = (targetUsername: string) => {
    if (onToggleConnection) {
      onToggleConnection(targetUsername);
    }
  };

  const [hiddenVideoUrls, setHiddenVideoUrls] = useState<Record<string, boolean>>(() => {
    try {
      const stored = scopedStorage.getItem('booran_hidden_scrolls');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    scopedStorage.setItem('booran_hidden_scrolls', JSON.stringify(hiddenVideoUrls));
  }, [hiddenVideoUrls]);

  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setRefreshTick((prev) => prev + 1);
    window.addEventListener('booran_posts_updated', handleUpdate);
    window.addEventListener('adsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('booran_posts_updated', handleUpdate);
      window.removeEventListener('adsUpdated', handleUpdate);
    };
  }, []);

  const [mixedReels, setMixedReels] = useState<ReelData[]>(DUMMY_REELS);
  const [userAds, setUserAds] = useState<ReelData[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    try {
      const storedString = scopedStorage.getItem('booran_public_posts') || '[]';
      const storedPosts = JSON.parse(storedString);
      const now = Date.now();
      
      const regularUserPosts: ReelData[] = storedPosts
        .filter((p: any) => {
           if (p.createdAt && now - p.createdAt >= 24 * 60 * 60 * 1000) return false;
           if (p.timestamp && !p.createdAt && now - p.timestamp >= 24 * 60 * 60 * 1000) return false;
           
           const isAd = p.id?.startsWith("ad-");
           if (isAd) return false; // Exclude old ad format
           
           const isVideo = p.mediaType === 'video' || p.format === 'video' || p.mediaUrl?.includes('data:video') || p.mediaUrl?.startsWith('blob:') || (p.mediaUrl && (p.mediaUrl.includes('.mp4') || p.mediaUrl.includes('.webm') || p.mediaUrl.includes('.ogg')));
           
           return isVideo;
        })
        .map((p: any) => {
          return {
            src: p.mediaUrl,
            user: p.username,
            likes: 0,
            comments: "0",
            color: "#1c1c1e",
            createdAt: p.createdAt || p.timestamp,
            mediaType: 'video'
          };
        });

      let allAds: any[] = [];
      try {
        allAds = getAds();
      } catch (e) {}

      // Strict Feed-Type Filtering
      const availableAds = allAds.filter(ad => ad.mediaType === 'video');
      
      // Universal Ad Backfilling: Tier 1 (owner) then Tier 2 (others)
      availableAds.sort((a, b) => (a.ownerId === currentUsername ? -1 : 1) - (b.ownerId === currentUsername ? -1 : 1));

      const baseReels = (reels && reels.length > 0 ? reels : DUMMY_REELS).filter(r => r.mediaType !== 'image');

      // Identify newly uploaded ones in baseReels
      const uploaded = baseReels.filter(r => r.user === currentUsername || r.src.startsWith('blob:'));
      const others = baseReels.filter(r => r.user !== currentUsername && !r.src.startsWith('blob:'));

      const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
      const baseRegulars = [...uploaded, ...regularUserPosts, ...shuffledOthers];

      const generateFeed = (posts: ReelData[], ads: any[]) => {
        const finalFeed: ReelData[] = [];
        let adCountInjected = 0;
        
        posts.forEach((post, index) => {
          finalFeed.push(post);
          
          if ((index + 1) % 5 === 0 || (index + 1) % 11 === 0) {
            if (adCountInjected < ads.length) {
              const adToInject = ads[adCountInjected];
              adCountInjected++;
              finalFeed.push({
                src: adToInject.src,
                user: adToInject.ownerId,
                likes: 0,
                comments: "0",
                color: "#d1d1d1", // special color for ads
                link: adToInject.link,
                contact: adToInject.contact,
                action: adToInject.action,
                createdAt: adToInject.createdAt,
                isOwnAd: true,
                mediaType: 'video',
                caption: 'Sponsored Ad'
              });
            }
          }
        });
        
        return finalFeed;
      };

      const mixedRegulars = generateFeed(baseRegulars, availableAds);

      setMixedReels(mixedRegulars);
    } catch (e) {
      console.warn('Failed to parse stored ads', e);
      setMixedReels(reels && reels.length > 0 ? reels : DUMMY_REELS);
      setUserAds([]);
    }
  }, [refreshTick, currentUsername, reels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveVideo(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      Array.from(currentContainer.children).forEach((child) => {
        observer.observe(child as Element);
      });
    }

    return () => observer.disconnect();
  }, [hiddenVideoUrls, mixedReels]);

  const visibleReels = mixedReels.filter(r => !hiddenVideoUrls[r.src]);

  const now = Date.now();
  const validAds = AVAILABLE_ADS.filter((ad) => ad.createdAt && now - ad.createdAt < 24 * 60 * 60 * 1000);
  const userValidAds = userAds.filter(ad => ad.createdAt && now - ad.createdAt < 24 * 60 * 60 * 1000);
  const combinedAds = userValidAds.length > 0 ? userValidAds : validAds;
  const mergedFeed: ReelData[] = [];
  let adIndex = 0;

  visibleReels.forEach((reel, index) => {
    mergedFeed.push(reel);
    if ((index + 1) % 5 === 0 && adIndex < combinedAds.length) {
      mergedFeed.push({
        ...combinedAds[adIndex],
        id: `ad_${index}`,
        mediaType: 'video'
      });
      adIndex++;
    }
  });

  const viewedScrollsStr = scopedStorage.getItem("booran_viewed_scrolls");
  const viewedScrollsUrls = (() => {
    try {
      return viewedScrollsStr ? JSON.parse(viewedScrollsStr) : [];
    } catch {
      return [];
    }
  })();
  const viewedScrollsSet = new Set(viewedScrollsUrls);

  const unwatchedScrolls = mergedFeed.filter(r => !viewedScrollsSet.has(r.src));
  const watchedScrolls = mergedFeed.filter(r => viewedScrollsSet.has(r.src));
  const sortedMergedFeed = [...unwatchedScrolls, ...watchedScrolls];

  const currentReel = sortedMergedFeed[activeVideo % Math.max(1, sortedMergedFeed.length)] || sortedMergedFeed[0];

  useEffect(() => {
    if (currentReel && currentReel.src) {
      trackUserInteractionInInsights(currentReel.src, "watch", currentUsername);
      try {
        const stored = scopedStorage.getItem("booran_viewed_scrolls");
        const viewed = stored ? JSON.parse(stored) : [];
        if (!viewed.includes(currentReel.src)) {
          scopedStorage.setItem("booran_viewed_scrolls", JSON.stringify([...viewed, currentReel.src]));
        }
      } catch (e) {}
    }
  }, [currentReel?.src, currentUsername]);

  // Infinite Scroll - Append more Reels as user approaches the bottom of the list
  useEffect(() => {
    if (activeVideo >= mixedReels.length - 3 && mixedReels.length > 0) {
      // Create fresh unique variations so they don't repeat the exact same sequence
      const videoPool = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-street-with-neon-lights-40135-large.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-wave-in-the-ocean-34282-large.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-winter-fashion-cold-looking-woman-40210-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-the-piano-40507-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-sign-41870-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-typing-on-a-glowing-computer-keyboard-41890-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-city-at-night-40134-large.mp4"
      ];

      const prefix = ["cyber", "neon", "retro", "cosmic", "star", "pixel", "sound", "echo", "wave", "hologram", "vintage", "dream", "light", "alpha", "quantum", "gravity", "dimension", "hyper", "cyberpunk", "stranger"];
      const suffix = ["rider", "explorer", "maker", "craft", "voyager", "nomad", "pulse", "lens", "shutter", "wave", "weaver", "architect", "vibe", "hacker", "runner", "junkie", "guild", "pioneer", "nexus"];
      
      const existingUsers = new Set(mixedReels.map(r => r.user.replace("@", "").toLowerCase()));
      const shuffledVideos = [...videoPool].sort(() => Math.random() - 0.5);

      const newReels: ReelData[] = [];
      for (let i = 0; i < 8; i++) {
        let uniqueUser = "";
        let attempts = 0;
        while (attempts < 50) {
          const randPref = prefix[Math.floor(Math.random() * prefix.length)];
          const randSuff = suffix[Math.floor(Math.random() * suffix.length)];
          const num = Math.floor(Math.random() * 90) + 10;
          const candidate = `${randPref}_${randSuff}${Math.random() > 0.5 ? num : ""}`;
          if (!existingUsers.has(candidate.toLowerCase())) {
            uniqueUser = candidate;
            existingUsers.add(candidate.toLowerCase());
            break;
          }
          attempts++;
        }
        if (!uniqueUser) {
          uniqueUser = `creator_${Date.now()}_${i}`;
        }

        const randomLikes = Math.floor(Math.random() * 85000) + 1200;
        const randomCommentsCount = Math.floor(randomLikes / 150) + 12;
        newReels.push({
          src: shuffledVideos[i % shuffledVideos.length],
          user: `@${uniqueUser}`,
          likes: randomLikes,
          comments: randomCommentsCount >= 1000 ? `${(randomCommentsCount/1000).toFixed(1)}k` : `${randomCommentsCount}`,
          color: "#1c1c1e"
        });
      }

      setMixedReels((prev) => [...prev, ...newReels]);
    }
  }, [activeVideo, mixedReels.length]);

  const connectsNames: string[] = [];
  
  const shareUsersMap = new Map();
  [...connectsNames, ...connectionList].forEach((c) => {
    const rawUsername = typeof c === 'string' ? c : '';
    if (!rawUsername) return;
    const username = rawUsername.toLowerCase().replace(/\s+/g, '_');
    if (!shareUsersMap.has(username)) {
      shareUsersMap.set(username, {
        username: username,
        name: rawUsername,
        avatar: getHumanAvatar(String(rawUsername))
      });
    }
  });

  try {
    const rawUsers = scopedStorage.getItem('booran_users');
    if (rawUsers) {
      const usersList = JSON.parse(rawUsers);
      usersList.forEach((ru: any) => {
        const username = ru.username.toLowerCase().replace(/\s+/g, '_');
        if (!shareUsersMap.has(username)) {
          shareUsersMap.set(username, {
            username: username,
            name: ru.username,
            avatar: getHumanAvatar(String(ru.username))
          });
        }
      });
    }
  } catch(e) {}
  
  const shareUsers = Array.from(shareUsersMap.values()).filter(u => u.name.toLowerCase() !== currentUsername.toLowerCase() && u.username !== currentUsername.toLowerCase().replace(/\s+/g, '_'));

  const handleSendShare = async () => {
    if (!currentUsername || currentUsername === "User") return;

    try {
      for (const selectedUsername of Array.from(selectedShareUsers)) {
        await api.sendMessage({
          receiverUsername: selectedUsername,
          text: `Shared a scroll by ${currentReel?.user}`,
          mediaUrl: currentReel?.src,
          mediaType: 'video',
        });
      }
      
      setShowShareSheet(false);
      setShowShareConfirm(true);
      setSelectedShareUsers(new Set());
      setTimeout(() => {
        setShowShareConfirm(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to share scroll:", err);
      triggerToast("Failed to share scroll.");
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col font-sans">
      
      {/* Background Scrolling Feed Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sortedMergedFeed.map((reel, idx) => {
          return (
            <VideoFeedItem
              key={`${reel.src}-${idx}-${reel.contact || 'none'}`}
              data-index={idx}
              reel={reel}
              isActive={activeVideo === idx}
              dataSaverEnabled={dataSaverEnabled}
              currentUsername={currentUsername}
              currentUserAvatar={currentUserAvatar}
              onShare={() => setShowShareSheet(true)}
              onInfoClick={onInfoClick}
              onToggleConnection={handleToggleLink}
              isConnected={connectionList.some(c => c.toLowerCase().replace(/^@+/, '') === reel.user.toLowerCase().replace(/^@+/, ''))}
              onAddClick={triggerVideoPicker}
              onAddToScroll={() => handlePostScrollFromReel(reel)}
              onOpenDMs={onOpenDMs}
              onAddToFlash={async () => {
                try {
                  await api.createFlash({
                    userId: currentUsername || "anonymous",
                    username: currentUsername,
                    mediaUrl: reel.src,
                    mediaType: 'video',
                    caption: reel.caption || "Shared from scrolls",
                  });
                  
                  setShowFlashConfirm(true);
                  setTimeout(() => {
                    setShowFlashConfirm(false);
                  }, 2000);
                } catch (e) {
                  console.error("Failed to add to flash:", e);
                }
              }}
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
            />
          );
        })}
      </div>

      {/* STATIC OVERLAY UI (Does Not Move) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
        
        {/* Top Header */}
        <div className="w-full pt-2 pb-4 px-4 flex items-center justify-between pointer-events-auto shrink-0 relative z-20 safe-area-top">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-white drop-shadow-md hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[28px] h-[28px]">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white font-semibold text-[19px] tracking-wide drop-shadow-md">
            Scrolls
          </span>
          <div className="relative">
            <button 
              onClick={() => setShowReport(!showReport)}
              className="p-2 -mr-2 text-white drop-shadow-md hover:opacity-80 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <circle cx="12" cy="5" r="2.5" />
                <circle cx="12" cy="12" r="2.5" />
                <circle cx="12" cy="19" r="2.5" />
              </svg>
            </button>
            
            {showReport && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowReport(false)}
                />
                <div className="absolute top-[40px] right-0 bg-[#262626] border border-white/10 rounded-xl shadow-xl overflow-hidden w-[140px] z-50 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto flex flex-col">
                  <button 
                    onClick={() => {
                      setShowReport(false);
                      setShowUserDetailsModal(true);
                    }}
                    className="w-full px-4 py-3 text-white font-semibold text-[15px] text-center hover:bg-white/5 transition-colors"
                  >
                    View Details
                  </button>
                  <div className="h-[1px] w-full bg-white/10" />
                  <button 
                    onClick={async () => {
                      const reelToHide = visibleReels[activeVideo];
                      if (reelToHide) {
                        // Call API
                        try {
                          await api.reportItem({
                            reportedItemId: reelToHide.id || reelToHide.src,
                            reportedItemType: 'post',
                            reason: 'Community Flag'
                          });
                        } catch (e) {
                          console.error("Report failed:", e);
                        }

                        setHiddenVideoUrls(prev => ({ ...prev, [reelToHide.src]: true }));
                        trackUserInteractionInInsights(reelToHide.src, visibleReels[activeVideo]?.user === currentUsername ? "delete" : "report", currentUsername);
                      }
                      setShowReport(false);
                      triggerToast("Content reported and hidden.");
                    }}
                    className="w-full px-4 py-3 text-red-500 font-semibold text-[15px] text-center hover:bg-white/5 transition-colors"
                  >
                    {visibleReels[activeVideo]?.user === currentUsername ? 'Delete' : 'Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetailsModal && (
        <div
          className="fixed inset-0 bg-black/65 z-[10005] flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={() => setShowUserDetailsModal(false)}
        >
          <div
            className="bg-[#18181a] border border-white/10 rounded-3xl p-6 w-full max-w-[320px] text-white shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowUserDetailsModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white/10 p-0.5 border border-white/20 mb-3 overflow-hidden">
                 <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-white/50" />
                 </div>
              </div>
              <h3 className="font-bold text-lg">{visibleReels[activeVideo]?.user}</h3>
              <p className="text-xs text-neutral-400 font-mono tracking-widest mt-1">PERSONAL DETAILS</p>
            </div>

            <div className="space-y-4">
              {(() => {
                const details = getTargetUserDetails(visibleReels[activeVideo]?.user || '');
                
                return (
                  <>
                    {details.mobile && (
                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] text-neutral-400 font-sans font-medium uppercase tracking-wider">Mobile No</label>
                        <input 
                          type={details.isHidden ? "password" : "text"}
                          value={details.mobile}
                          readOnly
                          placeholder="••••••••••" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-sm text-neutral-200 outline-none font-mono"
                          style={{
                            letterSpacing: details.isHidden ? '8px' : 'normal',
                            fontSize: details.isHidden ? '1.25rem' : '0.875rem'
                          }}
                        />
                      </div>
                    )}
                    
                    {details.address && (
                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] text-neutral-400 font-sans font-medium uppercase tracking-wider">Home Address</label>
                        <input 
                          type={details.isHidden ? "password" : "text"}
                          value={details.address}
                          readOnly
                          placeholder="••••••••••" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-sm text-neutral-200 outline-none font-mono"
                          style={{
                            letterSpacing: details.isHidden ? '8px' : 'normal',
                            fontSize: details.isHidden ? '1.25rem' : '0.875rem'
                          }}
                        />
                      </div>
                    )}

                    {details.dob && (
                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] text-neutral-400 font-sans font-medium uppercase tracking-wider">Date of Birth</label>
                        <input 
                          type={details.isHidden ? "password" : "text"}
                          value={details.dob}
                          readOnly
                          placeholder="••••••••••" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-sm text-neutral-200 outline-none font-mono"
                          style={{
                            letterSpacing: details.isHidden ? '8px' : 'normal',
                            fontSize: details.isHidden ? '1.25rem' : '0.875rem'
                          }}
                        />
                      </div>
                    )}

                    {details.profession && (
                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] text-neutral-400 font-sans font-medium uppercase tracking-wider">Profession</label>
                        <input 
                          type={details.isHidden ? "password" : "text"}
                          value={details.profession}
                          readOnly
                          placeholder="••••••••••" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-sm text-neutral-200 outline-none font-mono"
                          style={{
                            letterSpacing: details.isHidden ? '8px' : 'normal',
                            fontSize: details.isHidden ? '1.25rem' : '0.875rem'
                          }}
                        />
                      </div>
                    )}

                    {!details.mobile && !details.address && !details.dob && !details.profession && (
                      <div className="text-center py-4">
                        <p className="text-sm text-neutral-500 font-medium">No details available.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Share Sheet Overlay */}
      {showShareSheet && <ShareSheetModal onClose={() => setShowShareSheet(false)} activePostSrc={visibleReels[activeVideo]?.src} activePostMediaType={visibleReels[activeVideo]?.mediaType || 'video'} />}

      {/* Share Confirmation Toast */}
      {showShareConfirm && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900 border border-white/10 px-5 py-3 rounded-full shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          Scroll Sent
        </div>
      )}

      {/* Pending Connection Toast */}
      {showPendingToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900 border border-white/10 px-5 py-3 rounded-full shadow-2xl text-white font-medium flex gap-3 items-center whitespace-nowrap animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
          Private Account - Request Sent!
        </div>
      )}

      {/* Flash Confirmation Toast */}
      {showFlashConfirm && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900 border border-white/10 px-5 py-3 rounded-full shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          Added to flash
        </div>
      )}

      {/* Dynamic Custom Toast */}
      {toastText && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900 border border-white/10 px-5 py-3 rounded-full shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          {toastText}
        </div>
      )}

      {/* Full-Screen Video Preview Overlay */}
      {selectedLocalVideo && (
        <div className="fixed inset-0 bg-black z-[90000] flex flex-col justify-between overflow-hidden">
          {/* Top blue notification */}
          {showBlueNotification && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100001] bg-[#0091FF] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold text-sm animate-in slide-in-from-top-4 duration-300">
              <span>✓</span>
              <span>🎬 Loaded video from device.</span>
            </div>
          )}

          {/* Close button top left */}
          <button 
            onClick={() => setSelectedLocalVideo(null)} 
            className="absolute top-6 left-6 z-[100001] w-10 h-10 bg-black/20 hover:bg-black/20 rounded-full flex items-center justify-center transition text-white hover:scale-105 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Full-screen video preview playing unmuted with original sound */}
          <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
            <video
              src={selectedLocalVideo}
              className="w-full h-full object-contain"
              autoPlay
              loop
              playsInline
            />
          </div>

          {/* Bottom action elements */}
          <div className="absolute bottom-6 inset-x-0 px-6 flex items-center justify-between z-[100001]">
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-[20px] px-6 py-3 flex items-center justify-center gap-2">
              <span className="text-white font-semibold text-[14px] tracking-wide">
                {selectedLocalVideoName || "Video Preview"}
              </span>
            </div>

            {/* Post arrow button (tap to post on Scrolls) */}
            <button
              onClick={handlePostLocalVideo}
              className="w-14 h-14 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg cursor-pointer hover:bg-neutral-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
