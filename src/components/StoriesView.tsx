import { scopedStorage } from "../utils/storage";
import { getHumanAvatar } from '../utils/avatar';
import { api } from "../services/api";
import { socket } from "../utils/socket";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  Star,
  MessageSquare,
  Send,
  Trash,
  Eye,
  Music,
  MoreVertical,
  User
} from "lucide-react";

import CreateStoryFlow from "./CreateStoryFlow";
import StarDoubleTap from "./StarDoubleTap";
import { DynamicElegantStorySquircle } from "./DynamicElegantStorySquircle";

export interface Story {
  id: string;
  mediaUri: string;
  mediaType: "image" | "video";
  timestamp: string;
  duration: number;
  caption?: string;
  isCloseFriends?: boolean;
  calligraphyCaptions?: any[];
  createdAt?: number;
  likes?: string[];
  comments?: any[];
}

export interface StoryGroup {
  userId: string;
  username: string;
  userAvatar: string;
  hasUnseen?: boolean;
  stories: Story[];
}

export const INITIAL_STORY_GROUPS: StoryGroup[] = [
  {
    userId: "you",
    username: "you",
    userAvatar: "",
    hasUnseen: false,
    stories: [],
  },
];

interface StoriesManagerProps {
  currentUserAvatar: string;
  currentUsername: string;
  triggerToast: (msg: string) => void;
  storyGroups: StoryGroup[];
  setStoryGroups: React.Dispatch<React.SetStateAction<StoryGroup[]>>;
  isCreatingStory: boolean;
  setIsCreatingStory: React.Dispatch<React.SetStateAction<boolean>>;
  activeStoryGroupIndex: number | null;
  setActiveStoryGroupIndex: React.Dispatch<React.SetStateAction<number | null>>;
  activeStoryIndex: number;
  setActiveStoryIndex: React.Dispatch<React.SetStateAction<number>>;
  isViewingStories: boolean;
  setIsViewingStories: React.Dispatch<React.SetStateAction<boolean>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playerOnly?: boolean;
  onOpenDMs?: () => void;
  onOpenConnectionsHub?: (targetUser?: string) => void;
}

export default function StoriesManager({
  currentUserAvatar,
  currentUsername,
  triggerToast,
  storyGroups,
  setStoryGroups,
  isCreatingStory,
  setIsCreatingStory,
  activeStoryGroupIndex,
  setActiveStoryGroupIndex,
  activeStoryIndex,
  setActiveStoryIndex,
  isViewingStories,
  setIsViewingStories,
  isPlaying,
  setIsPlaying,
  playerOnly,
  onOpenDMs,
  onOpenConnectionsHub,
}: StoriesManagerProps) {
  const [playerProgress, setPlayerProgress] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showViewerAnalytics, setShowViewerAnalytics] =
    useState<boolean>(false);
  const [starredStories, setStarredStories] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    socket.on('flash-stats-update', (update) => {
      setStarredStories(prev => ({
        ...prev,
        [update.id]: update.likedBy.includes(currentUsername)
      }));
    });

    socket.on('flash-comment-update', (update) => {
      setStoryComments(prev => ({
        ...prev,
        [update.id]: update.comments.map((c: any) => ({
          id: c._id || Math.random().toString(),
          name: c.username,
          username: c.username,
          avatar: getHumanAvatar(c.username),
          text: c.text,
          timeAgo: 'Just now'
        }))
      }));
    });

    return () => {
      socket.off('flash-stats-update');
      socket.off('flash-comment-update');
    };
  }, [currentUsername]);
  const [heartActiveStoryId, setHeartActiveStoryId] = useState<string | null>(
    null,
  );
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState<boolean>(false);
  const [showFlashPermission, setShowFlashPermission] = useState<boolean>(false);

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

  const handleDoubleTapLike = async (storyId: string) => {
    // 1. Instantly trigger visual heart pop
    setHeartActiveStoryId(storyId);
    setTimeout(() => {
      setHeartActiveStoryId(null);
    }, 2000);

    // 2. Only call API if we haven't starred it yet (for double tap)
    if (!starredStories[storyId]) {
      try {
        await api.likeFlash(storyId);
        setStarredStories((prev) => ({ ...prev, [storyId]: true }));
      } catch (err) {
        console.error("Failed to star story:", err);
      }
    }
  };

  // Feature 1: Commenting System inside individual Stories
  const [storyComments, setStoryComments] = useState<
    Record<
      string,
      Array<{
        id: string;
        name: string;
        username: string;
        avatar: string;
        text: string;
        timeAgo: string;
      }>
    >
  >({});
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  const [showStoryStatsModal, setShowStoryStatsModal] =
    useState<boolean>(false);
  const [statsActiveTab, setStatsActiveTab] = useState<
    "views" | "stars" | "reports"
  >("views");
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (
        isPlaying &&
        !showCommentsModal &&
        !showStoryStatsModal &&
        !showReportModal
      ) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [
    isPlaying,
    showCommentsModal,
    showStoryStatsModal,
    showReportModal,
    activeStoryIndex,
    activeStoryGroupIndex,
  ]);

  useEffect(() => {
    if (isViewingStories) {
      document.body.classList.add("viewing-stories");
    } else {
      document.body.classList.remove("viewing-stories");
    }
    return () => document.body.classList.remove("viewing-stories");
  }, [isViewingStories]);

  // Auto-advance logic for story player progress
  useEffect(() => {
    let timer: any;
    if (
      isViewingStories &&
      isPlaying &&
      activeStoryGroupIndex !== null &&
      !showCommentsModal &&
      !showStoryStatsModal &&
      !showReportModal
    ) {
      const currentStory =
        storyGroups[activeStoryGroupIndex]?.stories?.[activeStoryIndex];
      const durationSeconds = videoDuration || currentStory?.duration || 3.33;
      const stepsIn100Percent = durationSeconds * (1000 / 50);
      const stepSize = 100 / stepsIn100Percent;

      timer = setInterval(() => {
        setPlayerProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + stepSize; // Advancing
        });
      }, 50);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [
    isViewingStories,
    isPlaying,
    activeStoryGroupIndex,
    activeStoryIndex,
    showCommentsModal,
    showStoryStatsModal,
    showReportModal,
    videoDuration,
    storyGroups,
  ]);

  // Handle auto-advance trigger
  useEffect(() => {
    if (playerProgress >= 100) {
      handleNextStory();
    }
  }, [playerProgress]);

  // Reset progress when changing segment
  useEffect(() => {
    setPlayerProgress(0);
    setVideoDuration(null);
  }, [activeStoryIndex, activeStoryGroupIndex]);

  const handleNextStory = () => {
    setPlayerProgress(0);
    if (activeStoryGroupIndex === null) return;
    const activeGroup = storyGroups[activeStoryGroupIndex];
    if (!activeGroup) return;
    if (activeStoryIndex < activeGroup.stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      // Go to next group
      if (activeStoryGroupIndex < storyGroups.length - 1) {
        setActiveStoryGroupIndex(activeStoryGroupIndex + 1);
        setActiveStoryIndex(0);
      } else {
        // Exit
        setIsViewingStories(false);
        setActiveStoryGroupIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    setPlayerProgress(0);
    if (activeStoryGroupIndex === null) return;
    const activeGroup = storyGroups[activeStoryGroupIndex];
    if (!activeGroup) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      // Go to previous group
      if (activeStoryGroupIndex > 0) {
        setActiveStoryGroupIndex(activeStoryGroupIndex - 1);
        const prevGroup = storyGroups[activeStoryGroupIndex - 1];
        setActiveStoryIndex(prevGroup.stories.length - 1);
      } else {
        // restart current story
        setPlayerProgress(0);
      }
    }
  };

  const handleDeleteStorySegment = () => {
    if (activeStoryGroupIndex === null) return;
    const activeGroup = storyGroups[activeStoryGroupIndex];
    if (!activeGroup || activeGroup.userId !== "you") return;
    const updatedStories = activeGroup.stories.filter(
      (_, idx) => idx !== activeStoryIndex,
    );

    setStoryGroups((prev) => {
      return prev.map((g) => {
        if (g.userId === "you") {
          return { ...g, stories: updatedStories };
        }
        return g;
      });
    });

    triggerToast("Flash segment deleted successfully!");
    setShowDeleteModal(false);

    if (updatedStories.length === 0) {
      setIsViewingStories(false);
      setActiveStoryGroupIndex(null);
    } else {
      setActiveStoryIndex(Math.max(0, activeStoryIndex - 1));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (activeStoryGroupIndex === null) return;
    const activeGroup = storyGroups[activeStoryGroupIndex];
    if (!activeGroup) return;
    const activeStory = activeGroup.stories[activeStoryIndex];
    if (!activeStory) return;

    const targetStoryId = activeStory.id;

    try {
      // Send to MongoDB
      await api.commentFlash(targetStoryId, newCommentText.trim());
      setNewCommentText("");
      // UI will update via Socket.io broadcast
    } catch (err) {
      console.error("Failed to add comment:", err);
      triggerToast("Failed to post comment.");
    }
  };

  const GALLERY_MOCK_ITEMS = [
    {
      id: "1",
      uri: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=100&w=1200",
      type: "image",
    },
    {
      id: "2",
      uri: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=100&w=1200",
      type: "image",
    },
    {
      id: "3",
      uri: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=100&w=1200",
      type: "image",
    },
    {
      id: "4",
      uri: "https://images.unsplash.com/photo-1493225457124-a1a2a5fbd109?auto=format&fit=crop&q=100&w=1200",
      type: "image",
    },
    {
      id: "5",
      uri: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=100&w=1200",
      type: "image",
    },
    {
      id: "6",
      uri: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=100&w=1200",
      type: "video",
      duration: 15,
    },
  ];

  if (isCreatingStory) {
    return (
      <CreateStoryFlow
        onClose={() => setIsCreatingStory(false)}
        galleryItems={GALLERY_MOCK_ITEMS as any}
        triggerToast={triggerToast}
        onPost={async (storySegment, options) => {
          const itemsToAdd = Array.isArray(storySegment)
            ? storySegment
            : [storySegment];

          const activeName = currentUsername || "anonymous";

          // Save to MongoDB
          try {
            for (const segment of itemsToAdd) {
              await api.createFlash({
                username: activeName,
                mediaUrl: segment.mediaUri,
                mediaType: segment.mediaType,
                caption: segment.caption || "",
              });
            }
            triggerToast("Flash posted to Cloud successfully! ✨");
          } catch (e) {
            console.error("Error posting flash: ", e);
            triggerToast("Failed to sync flash to cloud.");
          }

          if (
            options?.destination === "snaps_scrolls" ||
            options?.destination === "snaps_scrolls_all"
          ) {
            try {
              for (const segment of itemsToAdd) {
                await api.createPost({
                  username: activeName,
                  mediaUrl: segment.mediaUri,
                  mediaType: segment.mediaType,
                  caption: segment.caption || "New post ✨",
                  visibility: options.destination === "snaps_scrolls" ? "private" : "public",
                });
              }
              triggerToast("Posted to Snaps and Scrolls Cloud!");
            } catch (e) {
              console.error(e);
            }
          }

          setIsCreatingStory(false);
        }}
      />
    );
  }

  if (!isViewingStories || activeStoryGroupIndex === null) return null;

  const activeGroup = storyGroups[activeStoryGroupIndex];
  if (!activeGroup) return null;

  const activeStory = activeGroup.stories[activeStoryIndex];
  if (!activeStory) return null;

  const commentsList = storyComments[activeStory.id] || (activeStory.comments || []).map((c: any) => ({
    id: c._id || Math.random().toString(),
    name: c.username,
    username: c.username,
    avatar: getHumanAvatar(c.username),
    text: c.text,
    timeAgo: 'Just now'
  }));

  return (
    <div
      className="fixed inset-0 z-[10003] bg-black text-white flex items-center justify-center p-0 select-none animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setIsViewingStories(false);
          setActiveStoryGroupIndex(null);
        }
      }}
    >
      <div className="w-full h-full bg-[#050505] relative flex flex-col justify-between text-left overflow-hidden max-w-md mx-auto border-x border-white/5 shadow-2xl">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes blueStarPop {
            0% { transform: scale(0) rotate(-45deg); opacity: 0; }
            10% { transform: scale(1.4) rotate(15deg); opacity: 1; }
            20% { transform: scale(0.9) rotate(-5deg); opacity: 1; filter: drop-shadow(0 0 40px rgba(56,189,248,1)); }
            30% { transform: scale(1.1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 60px rgba(56,189,248,1)); }
            70% { transform: scale(1.1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 20px rgba(56,189,248,0.8)); }
            100% { transform: scale(3) rotate(20deg); opacity: 0; filter: drop-shadow(0 0 100px rgba(56,189,248,0)); }
          }
          @keyframes ringBurst {
            0% { transform: scale(0.5); opacity: 0; border-width: 20px; }
            10% { opacity: 1; }
            40% { transform: scale(4); opacity: 0; border-width: 0px; }
            100% { opacity: 0; }
          }
          @keyframes shardsErupt {
            0% { opacity: 1; }
            100% { opacity: 1; }
          }
          @keyframes shardFly {
            0% { transform: translateY(20px) scale(0); opacity: 0; }
            10% { opacity: 1; transform: translateY(20px) scale(1); }
            40% { opacity: 1; transform: translateY(-160px) scale(0.8) rotate(45deg); }
            60% { opacity: 0; transform: translateY(-240px) scale(0) rotate(90deg); }
            100% { opacity: 0; transform: translateY(-300px); }
          }
        `,
          }}
        />

        {/* Progress Bars Indicator */}
        <div className="absolute top-0 inset-x-0 z-50 pt-6 px-3 pb-3 bg-gradient-to-b from-black via-black/60 to-transparent space-y-3 shrink-0 safe-area-top">
          <div className="flex items-center space-x-1.5">
            {activeGroup.stories.map((seg, sIdx) => {
              let pct = 0;
              if (sIdx < activeStoryIndex) pct = 100;
              if (sIdx === activeStoryIndex) pct = playerProgress;

              return (
                <div
                  key={`${seg.id}_${sIdx}`}
                  className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden shadow-sm shadow-black/20"
                >
                  <div
                    className="h-full bg-[#0EA5E9] transition-all duration-75 origin-left"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Profile Details Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[10px] overflow-hidden border border-white/10 shrink-0 shadow-md">
                <img
                  src={activeGroup.userAvatar || undefined}
                  alt={activeGroup.username}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div
                onClick={() => {
                  if (activeGroup.userId !== "you" && onOpenDMs) {
                    setIsViewingStories(false);
                    onOpenDMs();
                  }
                }}
                className="cursor-pointer hover:opacity-80"
              >
                <span className="block text-sm font-extrabold text-white leading-tight">
                  {activeGroup.userId === "you" ||
                  activeGroup.username === "your_story"
                    ? "your flash"
                    : (activeGroup.username.startsWith('@') ? activeGroup.username : `@${activeGroup.username}`)}
                </span>
                <span className="block text-[10px] text-zinc-400 font-mono">
                  {activeStory.timestamp}
                </span>
              </div>
            </div>

            {/* Top Right Controls: Action menu, Trash (if ownership matches) and X close */}
            <div className="flex items-center space-x-2">
              {activeGroup.userId !== "you" && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-neutral-800 hover:text-white text-neutral-300 flex items-center justify-center transition-all cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical className="w-4.5 h-4.5" />
                </button>
              )}
              {activeGroup.userId === "you" && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-red-950 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                  title="Delete flash segment"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsViewingStories(false);
                  setActiveStoryGroupIndex(null);
                }}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-neutral-800 flex items-center justify-center transition-all text-neutral-300 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP DETECTOR CLICKS ON LEFT/RIGHT EDGES */}
        <div
          className="absolute inset-y-0 left-0 w-20 z-30"
          onClick={handlePrevStory}
        />
        <div
          className="absolute inset-y-0 right-0 w-20 z-30"
          onClick={handleNextStory}
        />

        {/* Story Primary Content Image */}
        <div
          className="flex-1 w-full flex items-center justify-center bg-black relative"
          onDoubleClick={() => handleDoubleTapLike(activeStory.id)}
        >
          {/* Double tap star icon on active layout */}
          {heartActiveStoryId === activeStory.id && (
            <StarDoubleTap
              scale={1}
              onComplete={() => setHeartActiveStoryId(null)}
            />
          )}

          {activeStory.mediaType === "video" ||
          (activeStory as any).type === "video" ? (
            <video
              ref={videoRef}
              src={activeStory.mediaUri}
              autoPlay
              playsInline
              onLoadedMetadata={(e) => {
                if (e.target && (e.target as HTMLVideoElement).duration) {
                  setVideoDuration((e.target as HTMLVideoElement).duration);
                }
              }}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          ) : (
            <img
              src={(!activeStory.mediaUri || activeStory.mediaUri === "undefined") ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=100&w=1200&auto=format&fit=crop" : activeStory.mediaUri}
              alt="Story display item"
              className="w-full h-auto max-h-[85vh] object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("unsplash")) {
                  target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=100&w=1200&auto=format&fit=crop";
                }
              }}
            />
          )}

          {/* Elegant Overlay Caption Widget */}
          {activeStory.caption && (
            <div className="absolute bottom-32 inset-x-5 z-40 bg-black/55 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md glass-glow">
              <span className="text-xs text-white leading-relaxed block text-center font-medium">
                {activeStory.caption}
              </span>
            </div>
          )}
        </div>

        {/* Story Bottom Operational Toolbar */}
        <div className="absolute bottom-0 inset-x-0 bg-black/30 backdrop-blur-md border-t border-white/5 px-4 pt-4 pb-14 z-40 flex flex-col space-y-3 shrink-0">
          <div className="flex items-center space-x-2 w-full justify-end">
            {activeGroup.userId !== "you" ? (
              <>
                {/* Message Input Box - Tap opens messaging */}
                <div
                  onClick={() => {
                    if (onOpenDMs) {
                      setIsViewingStories(false);
                      onOpenDMs();
                    } else {
                      triggerToast("Opening messages...");
                    }
                  }}
                  className="flex-1 bg-zinc-950/80 border border-white/10 rounded-full py-2.5 px-4 text-xs text-zinc-400 font-sans tracking-wide cursor-pointer hover:border-white/20 hover:text-white transition-all flex items-center justify-between"
                >
                  <span>Message...</span>
                  <Send className="w-4 h-4 text-zinc-500" />
                </div>

                {/* Speech Bubble Icon - Tapping allows you to view people what comments they send */}
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="w-10 h-10 rounded-full border border-white/15 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center hover:bg-neutral-800 transition-all shadow-md group cursor-pointer shrink-0"
                  title="View comments"
                >
                  <MessageSquare className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </button>

                {/* Custom Interactive Favorite Star */}
                <button
                  onClick={() => {
                    const isStarred = starredStories[activeStory.id] || (activeStory.likes || []).includes(currentUsername);
                    if (!isStarred) {
                      handleDoubleTapLike(activeStory.id);
                    } else {
                      setStarredStories({
                        ...starredStories,
                        [activeStory.id]: false,
                      });
                      triggerToast("⭐ Removed from highlights.");
                    }
                  }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-md cursor-pointer shrink-0 ${
                    (starredStories[activeStory.id] || (activeStory.likes || []).includes(currentUsername))
                      ? "bg-[#0EA5E9] border-transparent text-black"
                      : "border-white/15 bg-neutral-900/60 text-[#0EA5E9] hover:bg-neutral-800"
                  }`}
                >
                  <Star
                    className={`w-5 h-5 ${(starredStories[activeStory.id] || (activeStory.likes || []).includes(currentUsername)) ? "fill-current" : ""}`}
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Speech Bubble Icon for viewing comments on own story */}
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="w-10 h-10 rounded-full border border-white/15 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center hover:bg-neutral-800 transition-all shadow-md group cursor-pointer shrink-0"
                  title="View comments"
                >
                  <MessageSquare className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </button>

                {/* Star Icon for viewing likes/views on own story */}
                <button
                  onClick={() => {
                    setShowStoryStatsModal(true);
                  }}
                  className="w-10 h-10 rounded-full border border-white/15 bg-neutral-900/60 text-[#0EA5E9] backdrop-blur-md flex items-center justify-center hover:bg-neutral-800 transition-all shadow-md group cursor-pointer shrink-0"
                  title="View story stats"
                >
                  <Star className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Modal Confirmation Overlay */}
        {showDeleteModal && (
          <div className="absolute inset-0 bg-black/65 z-[10005] flex items-center justify-center p-5">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-4 max-w-sm w-full text-center">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Delete Flash Segment?
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Are you sure you want to permanently discard this flash
                highlight segment? This action cannot be undone.
              </p>
              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider font-mono">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStorySegment}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal / Action Sheet */}
        {showReportModal && (
          <div
            className="absolute inset-0 bg-black/65 z-[10005] flex items-center justify-center p-5 animate-in fade-in duration-200"
            onClick={() => setShowReportModal(false)}
          >
            <div
              className="bg-[#2A2A2A] border border-white/10 rounded-2xl p-2 w-full max-w-[280px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setShowUserDetailsModal(true);
                  setIsPlaying(false);
                }}
                className="w-full text-left p-4 hover:bg-white/5 rounded-xl transition-colors text-white font-bold text-sm cursor-pointer"
              >
                View Details
              </button>
              <div className="h-[1px] w-full bg-white/5" />
              <button
                onClick={async () => {
                  const activeStory = activeGroup.stories[activeStoryIndex];
                  if (activeStory && activeStory.id) {
                    try {
                      await api.reportItem({
                        reportedItemId: activeStory.id,
                        reportedItemType: 'flash',
                        reason: 'Community Flag'
                      });
                      triggerToast("Flash reported and hidden from you.");
                    } catch (e) {
                      console.error("Report failed:", e);
                    }
                  }

                  setStoryGroups((prev) =>
                    prev.filter((g) => g.userId !== activeGroup.userId),
                  );
                  setIsViewingStories(false);
                  setActiveStoryGroupIndex(null);
                  setShowReportModal(false);
                }}
                className="w-full text-left p-4 hover:bg-white/5 rounded-xl transition-colors text-[#F52C68] font-bold text-sm cursor-pointer"
              >
                Report Flash
              </button>
              <div className="h-[1px] w-full bg-white/5" />
              <button
                onClick={() => setShowReportModal(false)}
                className="w-full text-center py-3.5 mt-1 hover:bg-white/5 rounded-xl transition-colors text-white text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetailsModal && (
          <div
            className="absolute inset-0 bg-black/65 z-[10005] flex items-center justify-center p-5 animate-in fade-in duration-200"
            onClick={() => {
              setShowUserDetailsModal(false);
              setIsPlaying(true);
            }}
          >
            <div
              className="bg-[#18181a] border border-white/10 rounded-3xl p-6 w-full max-w-[320px] text-white shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setShowUserDetailsModal(false);
                  setIsPlaying(true);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-white/10 p-0.5 border border-white/20 mb-3 overflow-hidden">
                   {activeGroup.userAvatar ? (
                     <img src={activeGroup.userAvatar} alt="" className="w-full h-full object-cover rounded-full" />
                   ) : (
                     <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center">
                        <User className="w-6 h-6 text-white/50" />
                     </div>
                   )}
                </div>
                <h3 className="font-bold text-lg">{activeGroup.userId}</h3>
                <p className="text-xs text-neutral-400 font-mono tracking-widest mt-1">PERSONAL DETAILS</p>
              </div>

              <div className="space-y-4">
                {(() => {
                  const details = getTargetUserDetails(activeGroup.userId);
                  const isCurrentUser = currentUsername.replace(/^@/, '').toLowerCase() === activeGroup.userId.replace(/^@/, '').toLowerCase();
                  
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

        {/* SLIDE-UP COMMENTS DRAWER */}
        {showCommentsModal && (
          <div
            className="absolute inset-0 bg-black/20 z-[10006] flex flex-col justify-end text-left select-none animate-in fade-in duration-200"
            onClick={() => setShowCommentsModal(false)}
          >
            <div
              className="bg-neutral-950 border-t border-white/10 w-full rounded-t-3xl p-5 space-y-4 max-w-md mx-auto flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-300 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#F52C68]" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-100 font-mono">
                    Flash Comments ({commentsList.length})
                  </h4>
                </div>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white transition-all text-xs font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable comments list */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-white/5">
                {commentsList.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500 font-mono text-[11px] leading-relaxed">
                    No comments yet on this highlight.
                    <br />
                    Be the first to share your thoughts below!
                  </div>
                ) : (
                  commentsList.map((c, cIdx) => (
                    <div
                      key={`${c.id}_${cIdx}`}
                      className="flex items-start space-x-3.5 pt-3.5 first:pt-0"
                    >
                      <img
                        src={c.avatar || undefined}
                        alt={c.name}
                        className="w-8.5 h-8.5 rounded-lg border border-white/10 object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white leading-snug">
                            {c.name}
                          </p>
                          <span className="text-[8.5px] font-mono text-zinc-500">
                            {c.timeAgo}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-zinc-300 mt-0.5 whitespace-pre-wrap breakdown-words leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input Form */}
              <form
                onSubmit={handleAddComment}
                className="flex items-center gap-2 pt-3 border-t border-white/5 shrink-0"
              >
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Post a comment..."
                  className="flex-1 bg-neutral-900 border border-white/10 text-xs rounded-xl py-3 pl-4 pr-4 focus:outline-none focus:border-pink-500 placeholder-zinc-500 text-white font-sans tracking-wide"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-3 bg-[#F52C68] disabled:opacity-40 hover:bg-[#ff427c] text-white text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Story Stats Modal */}
        {showStoryStatsModal &&
          (() => {
            const STORY_STATS = {
              views: [],
              stars: (activeStory.likes || []).map((u, i) => ({
                id: `s-${i}`,
                name: u,
                avatar: getHumanAvatar(u),
                timeAgo: "Liked"
              })),
              reports: [],
            };

            return (
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-md z-[10006] flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={() => setShowStoryStatsModal(false)}
              >
                <div
                  className="bg-[#1C1C1C] w-full max-w-[340px] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setShowStoryStatsModal(false)}
                      className="p-2 text-white/50 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="px-5 pt-6 pb-2">
                    <h3 className="text-[15px] font-black tracking-tight text-white mb-1 flex items-center gap-2">
                      Flash Insights
                    </h3>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">
                      Watch only connects and connections only
                    </div>
                    <div className="flex bg-black/30 p-1 rounded-xl">
                      <button
                        onClick={() => setStatsActiveTab("views")}
                        className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${statsActiveTab === "views" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"}`}
                      >
                        Watched{" "}
                        <span className="opacity-60 ml-1">
                          {STORY_STATS.views.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setStatsActiveTab("stars")}
                        className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center space-x-1 ${statsActiveTab === "stars" ? "bg-[#0EA5E9]/10 text-[#0EA5E9] shadow-sm" : "text-white/40 hover:text-white/60"}`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${statsActiveTab === "stars" ? "fill-current" : ""}`}
                        />
                        <span>Stared</span>{" "}
                        <span className="opacity-60">
                          {STORY_STATS.stars.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setStatsActiveTab("reports")}
                        className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${statsActiveTab === "reports" ? "bg-red-400/10 text-red-500 shadow-sm" : "text-white/40 hover:text-white/60"}`}
                      >
                        Reports
                      </button>
                    </div>
                  </div>

                  <div className="h-[260px] overflow-y-auto px-5 py-4 divide-y divide-white/5">
                    {STORY_STATS[statsActiveTab].length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs font-medium text-white/30">
                        Nothing to show here.
                      </div>
                    ) : (
                      STORY_STATS[statsActiveTab].map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 py-3 first:pt-0 last:pb-0"
                        >
                          <img
                            src={user.avatar || undefined}
                            className="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">
                              {user.name}
                            </h4>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">
                              {user.timeAgo}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center gap-3">
                            {statsActiveTab === "views" &&
                              STORY_STATS.stars.find(
                                (s) => s.id === user.id,
                              ) && (
                                <Star className="w-4 h-4 text-[#0EA5E9] fill-current" />
                              )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          
      {showAddMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu(false);
            }}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[85%] max-w-[320px] flex flex-col items-center animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full bg-[#1e1e1e] border border-white/5 text-white p-5 rounded-[20px] font-bold text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
              onClick={() => {
                setShowAddMenu(false);
                setShowFlashPermission(true);
              }}
            >
              <span className="flex-1 text-center pl-6">Add to Flash</span>
              <span className="text-[#0091FF] text-2xl font-black mr-2">›</span>
            </button>
            
            <button
              className="w-full bg-[#2a2a2a] border border-white/5 text-white p-5 rounded-[20px] font-normal text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
              onClick={() => {
                setShowAddMenu(false);
                triggerToast("Post added to your scroll stream.");
              }}
            >
              <span className="flex-1 text-center pl-6">Add to scroll</span>
              <span className="text-[#0055FF] text-2xl font-black mr-2">›</span>
            </button>
          </div>
        </>
      )}

      {showFlashPermission && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setShowFlashPermission(false);
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
                  onClick={() => setShowFlashPermission(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowFlashPermission(false);
                    triggerToast("Added to your flash for 24h.");
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
      </div>
    </div>
  );
}
