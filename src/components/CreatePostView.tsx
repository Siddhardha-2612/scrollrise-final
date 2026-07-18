import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef } from "react";
import { getHumanAvatar } from '../utils/avatar';
import { api } from "../services/api";
import { socket } from "../utils/socket";
import {
  ArrowLeft,
  Music,
  Star,
  Eye,
  Edit2,
  MessageSquare,
  MessageSquareOff,
  Trash2,
  Camera,
  User,
  Check,
  Play,
  Pause,
  RotateCw,
  Image as ImageIcon,
  Video,
  X,
  CheckSquare,
  Sparkles,
  AlertCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

interface CreatePostViewProps {
  onBack: () => void;
  onPushRoute?: (route: string) => void;
  currentUserAvatar?: string;
  isPremium?: boolean;
  onTogglePremium?: (val: boolean) => void;
  username?: string;
  onAddReel?: (url: string, isVideo: boolean, caption?: string) => void;
}

interface GalleryItem {
  id: number;
  type: "photo" | "video";
  title: string;
  emoji: string;
  gradient: string;
  sourceLabel: string;
  videoUrl?: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    type: "photo",
    title: "Mountain Sunset",
    emoji: "🏔️",
    gradient: "from-orange-500 to-red-600",
    sourceLabel: "Camera Roll",
  },
  {
    id: 2,
    type: "photo",
    title: "City Neo-Lights",
    emoji: "🌃",
    gradient: "from-blue-600 to-indigo-700",
    sourceLabel: "Travel Album",
  },
  {
    id: 3,
    type: "photo",
    title: "Synthesizer Wave",
    emoji: "🎹",
    gradient: "from-emerald-500 to-cyan-500",
    sourceLabel: "Studio",
  },
  {
    id: 4,
    type: "photo",
    title: "Cat Portrait",
    emoji: "🐱",
    gradient: "from-yellow-400 to-amber-600",
    sourceLabel: "Memories",
  },
  {
    id: 5,
    type: "video",
    title: "Surfer Clip",
    emoji: "🏄‍♂️",
    gradient: "from-cyan-500 to-blue-500",
    sourceLabel: "Vlogs",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
  {
    id: 6,
    type: "video",
    title: "Lofi Room Beats",
    emoji: "🎧",
    gradient: "from-indigo-600 to-rose-500",
    sourceLabel: "Music Sessions",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
];

interface MusicProvider {
  name: string;
  color: string;
  urlScheme: string;
  logo: string;
}

const musicProviders: MusicProvider[] = [
  {
    name: "Spotify",
    color: "bg-[#1DB954] hover:bg-[#1ed760]",
    urlScheme: "https://open.spotify.com",
    logo: "🎵",
  },
  {
    name: "Apple Music",
    color: "bg-[#FC3C44] hover:bg-[#ff4f56]",
    urlScheme: "https://music.apple.com",
    logo: "🍎",
  },
  {
    name: "YouTube Music",
    color: "bg-[#FF0000] hover:bg-[#ff1e1e]",
    urlScheme: "https://music.youtube.com",
    logo: "📺",
  },
  {
    name: "SoundCloud",
    color: "bg-[#FF5500] hover:bg-[#ff661a]",
    urlScheme: "https://soundcloud.com",
    logo: "☁️",
  },
];

interface SongSnippet {
  id: number;
  title: string;
  artist: string;
  duration: string;
  lyrics?: string[];
}

const audioSnippets30s: SongSnippet[] = [
  {
    id: 1,
    title: "Summer Wave Mix",
    artist: "Horizon Sound",
    duration: "0:30",
    lyrics: [
      "🌊 Running back to the ocean, feeling free...",
      "☀️ Golden days shining down on me...",
      "🌴 Palm trees swaying to the summer breeze...",
    ],
  },
  {
    id: 2,
    title: "Neon Lounge Beat",
    artist: "Retro Future",
    duration: "0:30",
    lyrics: [
      "🌆 Electric vibes in the neon light cascade...",
      "🕶️ Retro wave dreaming wide awake...",
      "🎹 Synth loops pumping through the floorboards...",
    ],
  },
  {
    id: 3,
    title: "Midnight Drive",
    artist: "Cyber Pulse",
    duration: "0:30",
    lyrics: [
      "🚗 Traveling the highway at midnight speeds...",
      "🌃 Under stars, the neon city guides my way...",
      "⚡ High-voltage synthetic dream loops...",
    ],
  },
  {
    id: 4,
    title: "Chill acoustic loop",
    artist: "Nature Vibes",
    duration: "0:30",
    lyrics: [
      "🌲 Soft wind whispering through the pines...",
      "☕ Calm twilight, hot beverage in hand...",
      "🍂 Gentle guitar strings strumming along...",
    ],
  },
];

const audioTracks1Min: SongSnippet[] = [
  {
    id: 101,
    title: "Deep Space Drone (Full 1m)",
    artist: "Cosmic Voyager",
    duration: "1:00",
  },
  {
    id: 102,
    title: "Cyberpunk Bassline (Full 1m)",
    artist: "System Error",
    duration: "1:00",
  },
  {
    id: 103,
    title: "Lo-fi Study Session (Full 1m)",
    artist: "Chillhop Society",
    duration: "1:00",
  },
  {
    id: 104,
    title: "Summer Anthem Sunset (Full 1m)",
    artist: "Valhalla Wave",
    duration: "1:00",
  },
];

const appSpecificTracks: Record<string, SongSnippet[]> = {
  Spotify: [
    {
      id: 201,
      title: "Blinding Lights",
      artist: "The Weeknd",
      duration: "0:30",
      lyrics: [
        "✨ I said, ooh, I'm blinded by the lights...",
        "🌃 No, I can't sleep until I feel your touch...",
        "🚗 I'm running out of time, cause I can see the sunlight up the sky...",
      ],
    },
    {
      id: 202,
      title: "Stay",
      artist: "The Kid LAROI & Justin Bieber",
      duration: "0:30",
      lyrics: [
        "💔 I do the same thing I told you that I never would...",
        "🥀 I told you I'd change, even when I knew I never could...",
        "😭 I need you to stay, yeah, please stay...",
      ],
    },
    {
      id: 203,
      title: "As It Was",
      artist: "Harry Styles",
      duration: "0:30",
      lyrics: [
        "📞 Hold out your hand, darling, there's nothing to prove...",
        "🚪 You know it's not the same as it was...",
        "🏡 In this world, it's just us, as it was...",
      ],
    },
  ],
  "Apple Music": [
    {
      id: 301,
      title: "Shape of You",
      artist: "Ed Sheeran",
      duration: "0:30",
      lyrics: [
        "❤️ I'm in love with the shape of you...",
        "🍯 We push and pull like a magnet do...",
        "💃 Last night you were in my room, now my bedsheets smell like you...",
      ],
    },
    {
      id: 302,
      title: "Levitating",
      artist: "Dua Lipa",
      duration: "0:30",
      lyrics: [
        "🚀 If you wanna run away with me, I know a galaxy...",
        "⭐ And I can take you for a ride...",
        "🕺 I had a premonition that we fell into a rhythm...",
      ],
    },
  ],
  "YouTube Music": [
    {
      id: 401,
      title: "Industry Baby",
      artist: "Lil Nas X & Jack Harlow",
      duration: "0:30",
      lyrics: [
        "🏆 And this one is for the champions...",
        "🔥 I ain't lost since I began, yeah...",
        "🤠 Misfits run this town, baby back, yeah...",
      ],
    },
    {
      id: 402,
      title: "Bad Habits",
      artist: "Ed Sheeran",
      duration: "0:30",
      lyrics: [
        "👀 My bad habits lead to late nights ending alone...",
        "🗣️ Conversations with a stranger I barely know...",
        "☠️ Swearing this will be the last, but it probably won't...",
      ],
    },
  ],
  SoundCloud: [
    {
      id: 501,
      title: "Underground Bass Loop",
      artist: "SoundCloud DJ",
      duration: "0:30",
      lyrics: [
        "🔊 Sub-bass oscillations pumping through the venue...",
        "⛓️ Concrete garage rave under neon sparks...",
        "🌪️ Pure analog waves flowing through your cranium...",
      ],
    },
    {
      id: 502,
      title: "Lo-Fi Rainy Chill",
      artist: "DJ Sunset",
      duration: "0:30",
      lyrics: [
        "🌧️ Gentle raindrop pitter-patter with a vinyl scratch...",
        "☕ Hot matcha latte steaming in the studio room...",
        "🎸 Soft acoustic strums on a sleepy Sunday afternoon...",
      ],
    },
  ],
};

const TEXT_STYLES = [
  {
    name: "Classic Bold",
    class:
      "font-sans font-black text-4xl tracking-wide text-white uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]",
  },
  {
    name: "Classic Elegant",
    class:
      "font-serif font-black italic text-5xl text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]",
  },
  {
    name: "Brutalist Block",
    class:
      "font-mono font-black text-2xl bg-white text-black px-4 py-2 border-4 border-black uppercase tracking-wider shadow-[4px_4px_0px_#000000]",
  },
  {
    name: "Neon Love",
    class:
      "font-sans font-black text-4xl tracking-tight text-white drop-shadow-[0_0_12px_#ec407a] select-none",
  },
  {
    name: "Cyber Punk",
    class:
      "font-mono font-black text-3xl bg-yellow-400 text-black px-3 py-1.5 skew-x-[-12deg] tracking-widest uppercase border-2 border-black shadow-[3px_3px_0px_#ea580c]",
  },
  {
    name: "Soft Future",
    class:
      "font-sans font-light tracking-widest text-3xl uppercase text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]",
  },
  {
    name: "Comic Bubble",
    class:
      "font-sans font-black text-5xl tracking-tight text-yellow-300 uppercase drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]",
  },
  {
    name: "Handdrawn Script",
    class:
      "font-serif font-semibold text-4xl text-rose-200 tracking-normal underline decoration-rose-500 decoration-wavy select-none",
  },
  {
    name: "Elegant Outline",
    class:
      "font-sans font-extrabold text-5xl tracking-wider text-transparent [-webkit-text-stroke:1.8px_white] drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]",
  },
  {
    name: "Liquid Gold",
    class:
      "font-sans font-black text-4xl tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)]",
  },
];

export default function CreatePostView({
  onBack,
  onPushRoute,
  currentUserAvatar,
  isPremium = false,
  onTogglePremium,
  username,
  onAddReel,
}: CreatePostViewProps) {
  // State machine matching user's requested flow
  // 'no-post' (Initial state, matches Image 1)
  // 'camera-view' (Original active webcam view, plane UI with no distracting labels)
  // 'captured-preview' (Allows choosing either Post or Retake upon capture)
  // 'edit-details' (Provides input caption, music attachments, comments configuration, and publish details)
  // 'gallery' (Photo view from user's album, correctly spelt "Gallery")
  // 'posted' (The custom published state from Image 3)
  const [postState, setPostState] = useState<
    | "no-post"
    | "camera-view"
    | "captured-preview"
    | "edit-details"
    | "gallery"
    | "posted"
  >("gallery");

  // Media edit screen states matching StoriesView
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number>(0);
  const [textPos, setTextPos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 38,
  });
  const [textStyleIdx, setTextStyleIdx] = useState<number>(0);
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false);
  const [customCaptionText, setCustomCaptionText] = useState<string>("");
  const [isViewOnceActive, setIsViewOnceActive] = useState<boolean>(false);
  const [magicEffectStyle, setMagicEffectStyle] = useState<number>(0);
  const [editableText, setEditableText] = useState<string>("");
  const [isEditingWord, setIsEditingWord] = useState<boolean>(false);
  const [showGalleryMenu, setShowGalleryMenu] = useState<boolean>(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{
    clientX: number;
    clientY: number;
    textX: number;
    textY: number;
  }>({ clientX: 0, clientY: 0, textX: 50, textY: 38 });
  const hasDraggedRef = useRef<boolean>(false);

  const [
    cameraPermissionGrantedThisSession,
    setCameraPermissionGrantedThisSession,
  ] = useState(false);
  const [
    showSessionCameraPermissionModal,
    setShowSessionCameraPermissionModal,
  ] = useState(false);

  const triggerCameraMode = () => {
    if (!cameraPermissionGrantedThisSession) {
      setShowSessionCameraPermissionModal(true);
    } else {
      setPostState("camera-view");
    }
  };

  // Confirmed active media attachment
  const [activePost, setActivePost] = useState<{
    type: "photo" | "video";
    title: string;
    emoji: string;
    gradient: string;
    localUrl?: string; // Webcam snapshot preview URL
  } | null>(null);

  // States for post interaction display
  const [showPostStatsModal, setShowPostStatsModal] = useState<boolean>(false);
  const [showTurnedOffOneSecPopup, setShowTurnedOffOneSecPopup] =
    useState<boolean>(false);

  // User post history for displaying previous feed streams
  const [postHistory, setPostHistory] = useState<
    Array<{
      type: "photo" | "video";
      title: string;
      emoji: string;
      gradient: string;
      localUrl?: string;
    }>
  >([
    {
      type: "photo",
      title: "Neon Skyline Night",
      emoji: "🌃",
      gradient: "from-blue-600 to-indigo-700",
    },
    {
      type: "video",
      title: "Studio jam session 🎧",
      emoji: "🎹",
      gradient: "from-emerald-500 to-cyan-500",
    },
  ]);

  // States for real camera
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const override = scopedStorage.getItem("booran_create_post_type");
    if (override === "video") {
      scopedStorage.removeItem("booran_create_post_type");
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "video/*";
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const objectUrl = URL.createObjectURL(file);
          setCapturedMedia({
            type: "video",
            title: file.name || "Uploaded Video",
            emoji: "🎬",
            gradient: "from-indigo-600 to-purple-500",
            localUrl: objectUrl,
          });
          setPostState("edit-details");
          triggerToast("🎬 Loaded video from device.");
        }
      };
      input.click();
    }
  }, []);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLens, setCameraLens] = useState<"front" | "back">("back");
  const [cameraMode, setCameraMode] = useState<"photo" | "video">(() => {
    const override = scopedStorage.getItem("booran_create_post_type");
    return override === "video" ? "video" : "photo";
  });
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTime, setRecordedTime] = useState<number>(0);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);

  // Selector cache
  const [capturedMedia, setCapturedMedia] = useState<{
    type: "photo" | "video";
    title: string;
    emoji: string;
    gradient: string;
    localUrl?: string;
  } | null>(null);

  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(
    null,
  );
  const [galleryFilter, setGalleryFilter] = useState<"all" | "photo" | "video">(
    () => {
      const override = scopedStorage.getItem("booran_create_post_type");
      return override === "video"
        ? "video"
        : override === "photo"
          ? "photo"
          : "all";
    },
  );

  // Popups & overlays
  const [showPostPermissionModal, setShowPostPermissionModal] =
    useState<boolean>(false);
  const [showMusicSelectionPopup, setShowMusicSelectionPopup] =
    useState<boolean>(false);
  const [attachmentTrack, setAttachmentTrack] = useState<SongSnippet | null>(
    null,
  );
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  // Music highlights selection state variables
  const [musicTabMode, setMusicTabMode] = useState<"30s" | "1min">("30s");
  const [selectedLyricLine, setSelectedLyricLine] = useState<string>("");
  const [lyricsCropStart, setLyricsCropStart] = useState<number>(0);
  const [lyricsCropEnd, setLyricsCropEnd] = useState<number>(30);
  const [selectedMusicApp, setSelectedMusicApp] = useState<string>("");
  const [isAudioOnlyPost, setIsAudioOnlyPost] = useState<boolean>(false);
  const [musicPlaybackTime, setMusicPlaybackTime] = useState<number>(0);

  // Sync music playback progress timer with state
  useEffect(() => {
    let timer: any = null;
    if (isMusicPlaying && attachmentTrack) {
      timer = setInterval(() => {
        setMusicPlaybackTime((prev) => {
          const limit = musicTabMode === "1min" ? 60 : 30;
          if (prev >= limit) {
            return 0; // restart
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isMusicPlaying, attachmentTrack, musicTabMode]);

  // Caption configurations state variables
  const [captionText, setCaptionText] = useState<string>("");
  const [captionFont, setCaptionFont] = useState<string>(
    "font-sans font-bold text-base",
  );
  const [captionFontId, setCaptionFontId] = useState<string>("sans");
  const [captionX, setCaptionX] = useState<number>(30); // percentage coordinates
  const [captionY, setCaptionY] = useState<number>(45); // percentage coordinates
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);

  // Comments manual settings & simulated log interaction
  const [commentsEnabled, setCommentsEnabled] = useState<boolean>(true);
  const [showCommentsDisabledPopup, setShowCommentsDisabledPopup] =
    useState<boolean>(false);
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  const [newCommentInput, setNewCommentInput] = useState<string>("");
  const [commentsList, setCommentsList] = useState<
    Array<{ id: number; author: string; text: string; time: string }>
  >([
    {
      id: 1,
      author: "Alex 🎧",
      text: "Love the styling of this photograph!",
      time: "2m ago",
    },
    {
      id: 2,
      author: "Sasha ✨",
      text: "What studio beat is that in background?",
      time: "1m ago",
    },
  ]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag coordinator
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const isTouch = "touches" in e;
    const clientX = isTouch
      ? e.touches[0].clientX
      : (e as React.MouseEvent).clientX;
    const clientY = isTouch
      ? e.touches[0].clientY
      : (e as React.MouseEvent).clientY;

    const startX = captionX;
    const startY = captionY;

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const liveTouch = "touches" in moveEvent;
      const moveX = liveTouch
        ? moveEvent.touches[0].clientX
        : moveEvent.clientX;
      const moveY = liveTouch
        ? moveEvent.touches[0].clientY
        : moveEvent.clientY;

      const deltaX = moveX - clientX;
      const deltaY = moveY - clientY;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Constrain so caption stays within visual card boundaries (0% to 80% horizontal, 0% to 90% vertical)
        const percentX = Math.round(
          Math.max(0, Math.min(80, startX + (deltaX / rect.width) * 100)),
        );
        const percentY = Math.round(
          Math.max(0, Math.min(90, startY + (deltaY / rect.height) * 100)),
        );
        setCaptionX(percentX);
        setCaptionY(percentY);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onMouseMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);
  };

  const fontStyles = [
    {
      id: "sans",
      name: "Classic Sans",
      className: "font-sans font-bold text-white",
    },
    {
      id: "display",
      name: "Space Modern",
      className:
        "font-display font-extrabold uppercase text-white tracking-tight",
    },
    {
      id: "cursive",
      name: "Lovely Cursive",
      className:
        "font-cursive text-3xl font-medium tracking-normal text-amber-100 normal-case",
    },
    {
      id: "mono",
      name: "Console Code",
      className:
        "font-mono text-xs font-semibold text-emerald-300 tracking-wider uppercase",
    },
    {
      id: "serif",
      name: "Elegant Serif",
      className: "font-serif italic font-semibold text-rose-100 italic",
    },
  ];

  // Star & View Stats
  const [supportersCount, setSupportersCount] = useState<number>(36);
  const [viewsCount, setViewsCount] = useState<number>(142);
  const [userHasStarred, setUserHasStarred] = useState<boolean>(false);
  const [userHasViewed, setUserHasViewed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Turn ON/OFF hardware camera depending on the view state
  useEffect(() => {
    if (postState === "camera-view") {
      setHasCameraPermission(false);
      setCameraStream(null);
    }
    return () => {
      setCameraStream(null);
    };
  }, [postState, cameraLens]);

  // Video duration timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Comments temporary warning cleanup
  useEffect(() => {
    let timer: any = null;
    if (showCommentsDisabledPopup) {
      timer = setTimeout(() => {
        setShowCommentsDisabledPopup(false);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showCommentsDisabledPopup]);

  // One second warning popup inside stream when user clicked on turned-off comment box
  useEffect(() => {
    let timer: any = null;
    if (showTurnedOffOneSecPopup) {
      timer = setTimeout(() => {
        setShowTurnedOffOneSecPopup(false);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showTurnedOffOneSecPopup]);

  // Real snap capture
  const handleRealCapture = () => {
    if (cameraMode === "video") {
      if (isRecording) {
        setIsRecording(false);
        // Captured a simulated video snippet
        const snap = {
          type: "video" as const,
          title: `Captured Video (${recordedTime}s Clip)`,
          emoji: "🎬",
          gradient: "from-pink-600 to-indigo-800",
        };
        setCapturedMedia(snap);
        setPostState("captured-preview");
        triggerToast("🎥 Video recorded! Select to Post or Retake.");
      } else {
        setIsRecording(true);
        triggerToast("🔴 Recording video... Tap again to finish capture.");
      }
    } else {
      // Photo mode: attempt canvas freeze frame or mock beautiful snap
      if (videoRef.current && cameraStream) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg");
            setCapturedMedia({
              type: "photo",
              title: "Captured Snapshot",
              emoji: "📸",
              gradient: "from-amber-600 to-rose-700",
              localUrl: dataUrl,
            });
            setPostState("captured-preview");
            triggerToast("📸 Live webcam frame captured! Post or Retake?");
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Fallback
      setCapturedMedia({
        type: "photo",
        title: "Sandbox Lens Capture",
        emoji: "🌅",
        gradient: "from-blue-600 to-teal-500",
      });
      setPostState("captured-preview");
      triggerToast("📸 Live snapshot captured! Post or Retake?");
    }
  };

  // Open external music provider
  const handleSelectProvider = (prov: MusicProvider) => {
    triggerToast(`🔗 Launching choosing dialog for ${prov.name}...`);
    setTimeout(() => {
      window.open(prov.urlScheme, "_blank");
    }, 800);
  };

  // Play clip mockup
  const handleSelectClip = (track: SongSnippet) => {
    setAttachmentTrack(track);
    setIsMusicPlaying(true);
    triggerToast(`🎵 Attached 30s Clip: ${track.title}`);
  };

  const handleSelectGalleryItem = (id: number) => {
    const item = galleryItems.find((g) => g.id === id);
    if (item) {
      setSelectedGalleryIdx(id);
      setCapturedMedia({
        type: item.type,
        title: item.title,
        emoji: item.emoji,
        gradient: item.gradient,
        localUrl: item.type === "video" ? item.videoUrl : undefined,
      });
      triggerToast(`Loaded: ${item.title}`);
    }
  };

  const handleInitiatePublish = () => {
    if (!capturedMedia) {
      triggerToast("⚠️ Please select/capture a photo or video first!");
      return;
    }
    setPostState("edit-details");
    triggerToast("✏️ Composition Studio: Edit caption and add music!");
  };

  const savePostToLibrary = async (post: {
    type: "photo" | "video";
    title: string;
    emoji: string;
    gradient: string;
    localUrl?: string;
    overlayText?: string;
    textStyleIdx?: number;
    textPosX?: number;
    textPosY?: number;
    magicEffectStyle?: number;
  }) => {
    let mediaUrl =
      post.type === "video"
        ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";
    if (post.localUrl) {
      mediaUrl = post.localUrl;
    } else if (post.title === "Mountain Sunset") {
      mediaUrl =
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=600&auto=format&fit=crop";
    } else if (post.title === "City Neo-Lights") {
      mediaUrl =
        "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=600&auto=format&fit=crop";
    } else if (post.title === "Synthesizer Wave") {
      mediaUrl =
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop";
    } else if (post.title === "Cat Portrait") {
      mediaUrl =
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop";
    } else if (post.title === "Surfer Clip") {
      mediaUrl =
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
    } else if (post.title === "Lofi Room Beats") {
      mediaUrl =
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
    }

    const activeName = username || "anonymous";

    const newPostData = {
      username: activeName,
      mediaUrl: mediaUrl,
      mediaType: post.type,
      caption: customCaptionText || post.title || "",
      musicTitle: attachmentTrack
        ? `${attachmentTrack.title} - ${attachmentTrack.artist}`
        : "Original Audio",
      visibility: isPremium ? "public" : "private", // PRO FEATURE: Only Pro users can share to Public feed
      overlayText: post.overlayText || editableText,
      textStyleIdx: post.textStyleIdx ?? textStyleIdx,
      textPosX: post.textPosX ?? textPos.x,
      textPosY: post.textPosY ?? textPos.y,
      magicEffectStyle: post.magicEffectStyle ?? magicEffectStyle,
    };

    try {
      await api.createPost(newPostData);
      triggerToast("✨ Success! Your post is now live.");
    } catch (e) {
      console.error("Error adding post to backend: ", e);
      triggerToast("⚠️ Error syncing post.");
    }
  };

  const handleConfirmPublish = () => {
    if (capturedMedia) {
      const newPost = { ...capturedMedia };
      setActivePost(newPost);
      setPostHistory((prev) => [newPost, ...prev]);
      savePostToLibrary(newPost);
    }
    setShowPostPermissionModal(false);
    triggerToast("✨ Success! Your post is now live.");
    onBack();
  };

  const filteredGalleryItems = galleryItems.filter((item) => {
    if (galleryFilter === "all") return true;
    return item.type === galleryFilter;
  });

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white p-4 font-sans select-none relative overflow-y-auto">
      {/* Top action header for flow return, Back to Feed button removed permanently */}
      {attachmentTrack && postState !== "posted" && (
        <div className="w-full max-w-[420px] flex justify-end items-center mb-4 mt-2">
          <div className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/20 px-3 py-1 rounded-full text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[120px] font-mono text-[10px] text-emerald-400 font-bold uppercase">
              {attachmentTrack.title}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Action Toasts */}
      {toastMessage && (
        <div
          id="system-hud-toast-clean"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-[#0091FF] text-white text-xs font-bold font-mono px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-white stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Responsive Viewport card - Adjusted without rigid frame overlay cutoffs of previous versions */}
      <div
        id="device-frame-clean"
        className="relative w-full max-w-[360px] min-h-[640px] bg-black rounded-[36px] flex flex-col p-4 border border-neutral-900 shadow-2xl justify-between overflow-visible"
      >
        {/* Upper HUD is completely removed as requested */}
        {/* UPPER PORTABLE RENDER VIEW */}
        <div className="flex-1 flex flex-col justify-start relative">
          {/* ==================== STATE 1: NO POST (Image 1 style) ==================== */}
          {postState === "no-post" && (
            <div className="flex-1 flex flex-col justify-between h-full min-h-[460px] relative">
              {/* Inner card block themed to matches screenshot 1 shape exactly */}
              <div
                ref={containerRef}
                className="relative flex-1 min-h-[460px] w-full rounded-[28px] bg-[#212121] p-4 flex flex-col justify-between overflow-hidden"
              >
                {/* Visual feedback "user turnedoff" warning if clicked comment bubbles */}
                {showCommentsDisabledPopup && (
                  <div className="absolute inset-0 m-auto w-[180px] h-[54px] bg-black/55 text-white border border-red-500/20 shadow-2xl flex flex-col items-center justify-center rounded-2xl z-[9000] animate-in fade-in zoom-in duration-100 p-2">
                    <p className="text-[12px] font-mono font-extrabold text-red-400 tracking-wider">
                      ⚠️ user turnedoff
                    </p>
                    <p className="text-[8px] font-sans text-neutral-400">
                      Comments are disabled
                    </p>
                  </div>
                )}

                {/* Interactive Drag-and-Drop Caption display on Card */}
                {captionText && capturedMedia && (
                  <div
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    style={{
                      position: "absolute",
                      left: `${captionX}%`,
                      top: `${captionY}%`,
                    }}
                    className={`absolute z-30 cursor-move select-none p-2 rounded-xl bg-black/20 backdrop-blur-[2px] border border-white/5 shadow-md hover:ring-2 hover:ring-blue-400 transition-all ${captionFont}`}
                    title="Press and Drag to position caption on post"
                  >
                    {captionText}
                  </div>
                )}

                {/* Top Row: Delete box (right) */}
                <div className="flex justify-end items-center w-full z-20">
                  <button
                    onClick={() => {
                      setCapturedMedia(null);
                      setSelectedGalleryIdx(null);
                      setAttachmentTrack(null);
                      setCaptionText("");
                      triggerToast("🗑️ Post workspace cleaned.");
                    }}
                    id="target-reset-initial"
                    className="p-1 text-red-600 hover:text-red-500 transition-all cursor-pointer"
                    title="Clear Post template values"
                  >
                    <Trash2 className="w-[30px] h-[30px] stroke-[1.8]" />
                  </button>
                </div>

                {/* Core message text labels "No post" removed permanently */}
                <div className="flex-1 flex flex-col items-center justify-center select-none py-8 z-10">
                  {capturedMedia && (
                    <div className="mt-4 bg-black/20 py-2 px-3 rounded-2xl border border-white/5 backdrop-blur-md">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest text-center">
                        Attached snapshot
                      </p>
                      <p className="text-xs text-white truncate max-w-[170px] mt-0.5">
                        {capturedMedia.title}
                      </p>
                    </div>
                  )}
                </div>

                {/* Inside card overlay: Edit/Pen button aligned at the bottom right according to arrow shift */}
                <div className="mt-auto ml-auto flex flex-col items-center mb-2 pr-1 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCaption(true);
                      triggerToast("✏️ Type caption & select your style!");
                    }}
                    className="p-1 text-[#0091FF] hover:text-cyan-400 transition-all cursor-pointer active:scale-95"
                    title="Write post caption details"
                  >
                    <Edit2 className="w-[28px] h-[28px] stroke-[2.2]" />
                  </button>
                </div>
              </div>

              {/* Float config slide dialogue helper */}
              {isEditingCaption && (
                <div className="absolute inset-0 bg-neutral-950/95 z-[5000] p-4 flex flex-col justify-between rounded-[28px] border border-white/10 animate-in slide-in-from-bottom duration-150">
                  <div className="flex flex-col space-y-3.5">
                    <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold tracking-widest">
                        Configure Caption 📝
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCaption(false)}
                        className="text-xs text-blue-400 font-bold hover:underline"
                      >
                        Done ✓
                      </button>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] text-neutral-500 uppercase font-bold">
                        Write Caption
                      </label>
                      <input
                        type="text"
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        placeholder="Write a cute caption..."
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Font Style Option select layout */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">
                        Font Style options:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {fontStyles.map((style) => {
                          const isActive = captionFontId === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                setCaptionFontId(style.id);
                                setCaptionFont(style.className);
                                triggerToast(`Font: ${style.name}`);
                              }}
                              className={`p-2 rounded-xl text-left border transition-all text-[11px] font-medium leading-none ${
                                isActive
                                  ? "bg-blue-950/40 border-blue-500 text-blue-300"
                                  : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                              }`}
                            >
                              <span className="block text-[8px] text-neutral-500 tracking-wider mb-0.5 leading-none">
                                {style.name}
                              </span>
                              <span
                                className={`${style.className} truncate block text-[10px]`}
                              >
                                Abc Style
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingCaption(false)}
                    className="w-full bg-[#0091FF] mt-2 hover:bg-blue-600 font-bold py-2 rounded-xl text-xs text-white uppercase tracking-wider shadow-md"
                  >
                    Save & Position Caption
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== STATE 1.5: ACTIVE HARDWARE CAMERA VIEWPORT ==================== */}
          {postState === "camera-view" && (
            <div className="flex-1 flex flex-col bg-neutral-950 p-3 rounded-[28px] border border-white/5 min-h-[460px] justify-between h-full relative">
              <div className="flex justify-end items-center pb-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleInitiatePublish}
                    className="bg-[#0091FF] hover:bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer active:scale-95 transition-all shadow-sm flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3 text-white" />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* Viewfinder simulator block with active camera stream */}
              <div className="relative flex-1 my-2 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 flex flex-col items-center justify-center min-h-[280px]">
                {/* Genuine canvas camera node integration */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover absolute inset-0 ${cameraLens === "front" ? "scale-x-[-1]" : ""}`}
                />

                {/* If web camera stream has failed fallback block gracefully shows */}
                {!cameraStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-neutral-900 to-black z-10">
                    <span className="text-3xl mb-1">
                      {cameraLens === "front" ? "🤳" : "🌅"}
                    </span>
                    <p className="text-xs text-neutral-400 font-mono">
                      Webcam Simulation lens
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">
                      {cameraLens === "front"
                        ? "FRONT FACING CAMERA"
                        : "REAR PRIMARY CAMERA"}
                    </p>
                  </div>
                )}

                {/* Floating premium music icon button inside viewfinder card */}
                <button
                  type="button"
                  onClick={() => setShowMusicSelectionPopup(true)}
                  className="absolute top-3 right-3 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 p-2 rounded-full transition-all cursor-pointer z-30 shadow-lg flex items-center justify-center active:scale-90"
                  title="Attach Audio Snippet / Select Lyrics"
                >
                  <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                </button>

                {/* Video recording indicator ticker inside viewfinder */}
                {isRecording && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 z-20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    REC {recordedTime}s
                  </div>
                )}

                {/* Lens Switch Rotate and mode options overlay inside viewfinder */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-20">
                  {/* Photo/Video select pill */}
                  {!scopedStorage.getItem("booran_create_post_type") && (
                    <div className="bg-black/65 p-1 rounded-lg flex space-x-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraMode("photo");
                          setIsRecording(false);
                          triggerToast(
                            "📸 Switch camera lens mode to Capture Photo",
                          );
                        }}
                        className={`text-[9px] font-bold py-1 px-3 rounded-md transition-all ${
                          cameraMode === "photo"
                            ? "bg-[#0091FF] text-white"
                            : "text-neutral-400"
                        }`}
                      >
                        Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraMode("video");
                          triggerToast(
                            "🎥 Switch camera lens mode to Record Video",
                          );
                        }}
                        className={`text-[9px] font-bold py-1 px-3 rounded-md transition-all ${
                          cameraMode === "video"
                            ? "bg-red-600 text-white"
                            : "text-neutral-400"
                        }`}
                      >
                        Video
                      </button>
                    </div>
                  )}

                  {/* Lens selection flip trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = cameraLens === "front" ? "back" : "front";
                      setCameraLens(next);
                      triggerToast(`Switched active camera to: ${next}`);
                    }}
                    className="p-1.5 bg-black/65 hover:bg-black/55 text-white border border-white/10 rounded-full transition-all cursor-pointer"
                    title="Switch camera direction"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Core capture controls action footer */}
              <div className="flex justify-between items-center px-1 pt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPostState("no-post");
                    triggerToast("Exit preview");
                  }}
                  className="text-white hover:text-neutral-300 text-xs transition-all tracking-wide py-2 font-medium"
                >
                  Cancel
                </button>

                {/* Captured trigger trigger circle */}
                <button
                  type="button"
                  onClick={handleRealCapture}
                  className={`w-[52px] h-[52px] rounded-full border-[3px] flex items-center justify-center transition-all cursor-pointer ${
                    cameraMode === "video"
                      ? isRecording
                        ? "border-red-600 bg-red-500 scale-105"
                        : "border-white bg-red-600 hover:brightness-110"
                      : "border-white bg-white hover:bg-neutral-100"
                  }`}
                  title="Capture Action"
                >
                  {cameraMode === "video" && isRecording && (
                    <div className="w-4.5 h-4.5 rounded bg-white" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPostState("gallery");
                    triggerToast("📂 Browsing items on albums...");
                  }}
                  className="text-[#0091FF] text-xs font-semibold px-2 py-1 hover:underline"
                >
                  Gallery ➔
                </button>
              </div>
            </div>
          )}

          {/* ==================== STATE 1.6: CAPTURED PREVIEW DIRECT OPTION CHOICE ==================== */}
          {postState === "captured-preview" && (
            <div className="flex-1 flex flex-col bg-[#121212] p-4 rounded-[28px] border border-white/5 min-h-[460px] justify-between h-full relative text-center">
              <div className="flex flex-col items-center justify-center mt-2 shrink-0">
                <span className="text-[13px] font-bold text-[#0091FF] font-mono tracking-widest uppercase flex items-center gap-1.5 justify-center">
                  <Camera className="w-4 h-4 text-[#0091FF]" /> Capture Preview
                </span>
                <p className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wider">
                  Review before choosing to Publish
                </p>
              </div>

              {/* Viewport content covering card displaying captured photo or gradient video placeholder */}
              <div
                ref={containerRef}
                className="relative flex-1 my-4 rounded-2xl overflow-hidden bg-neutral-905 border border-white/10 flex flex-col items-center justify-center min-h-[250px] shadow-inner"
              >
                {isAudioOnlyPost ? (
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 to-neutral-950 flex flex-col items-center justify-center p-4 z-10 select-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-xl flex items-center justify-center animate-[spin_12s_linear_infinite] mb-2.5">
                      <div className="absolute inset-1.5 rounded-full border border-neutral-700/30" />
                      <div className="absolute inset-4 rounded-full border border-neutral-700/20" />
                      <div className="w-10 h-10 rounded-full bg-cyan-600 border-2 border-neutral-900 text-xs flex items-center justify-center">
                        💿
                      </div>
                    </div>
                    <div className="text-center scale-95 max-w-[200px]">
                      <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest leading-none">
                        🎙️ 1 Min Audio Post Mode
                      </span>
                      <p className="text-white font-bold font-sans text-xs mt-2 truncate max-w-[190px]">
                        {attachmentTrack?.title || "Selected Track"}
                      </p>
                      <p className="text-neutral-400 font-mono text-[9px] mt-0.5 truncate max-w-[190px]">
                        {attachmentTrack?.artist || "Unknown Artist"}
                      </p>
                    </div>
                  </div>
                ) : capturedMedia?.localUrl ? (
                  <img
                    src={capturedMedia.localUrl}
                    className="absolute inset-0 w-full h-full object-contain"
                    alt="Captured element"
                  />
                ) : capturedMedia ? (
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr ${capturedMedia.gradient}`}
                  />
                ) : null}

                {/* Floating premium music icon button inside captured layout per user request */}
                <button
                  type="button"
                  onClick={() => setShowMusicSelectionPopup(true)}
                  className="absolute top-3 right-3 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 p-2 rounded-full transition-all cursor-pointer z-35 shadow-lg flex items-center justify-center active:scale-90"
                  title="Attach Audio Snippet / Select Lyrics"
                >
                  <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                </button>

                {attachmentTrack && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/65 backdrop-blur-md border border-white/10 p-2.5 rounded-xl flex items-center justify-between z-30 animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div
                        className={`relative w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0 ${isMusicPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`}
                      >
                        <span className="text-xs">💿</span>
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[9px] font-bold text-white truncate max-w-[120px] leading-tight">
                          {attachmentTrack.title}
                        </p>
                        <p className="text-[7.5px] text-neutral-400 truncate max-w-[110px] leading-tight">
                          {attachmentTrack.artist}
                        </p>
                      </div>
                    </div>

                    {/* Progress slider bar & indicator */}
                    <div className="flex-1 px-3 hidden sm:block">
                      <div className="flex justify-between text-[6px] text-neutral-400 font-mono mb-[1] leading-none">
                        <span>
                          0:{musicPlaybackTime < 10 ? "0" : ""}
                          {musicPlaybackTime}
                        </span>
                        <span>{musicTabMode === "1min" ? "1:00" : "0:30"}</span>
                      </div>
                      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{
                            width: `${(musicPlaybackTime / (musicTabMode === "1min" ? 60 : 30)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMusicPlaying(!isMusicPlaying);
                        }}
                        className="bg-cyan-500 text-black text-[8px] font-mono font-bold px-2 py-1 rounded hover:opacity-90 active:scale-95 transition-all outline-none"
                      >
                        {isMusicPlaying ? "PAUSE" : "PLAY"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentTrack(null);
                          setIsMusicPlaying(false);
                          triggerToast("Deleted attached music track");
                        }}
                        className="bg-neutral-800 text-neutral-400 text-[8px] font-mono hover:text-white p-1 rounded hover:bg-neutral-700 outline-none"
                        title="Remove Track"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action operations: Post or Retake as requested explicitly */}
              <div className="flex flex-col space-y-2 mt-auto shrink-0 animate-in slide-in-from-bottom duration-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!isPremium) {
                      triggerToast("👑 Pro Status Required for Public feed.");
                      return;
                    }
                    setPostState("edit-details");
                    triggerToast(
                      "✏️ Composition Studio: Add post caption, music tracks!",
                    );
                  }}
                  className={`w-full ${isPremium ? 'bg-[#0091FF] hover:bg-blue-650' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'} text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Choose to Post</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCapturedMedia(null);
                    setPostState("gallery");
                    triggerToast("🗑️ Media discarded.");
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-400 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer block"
                >
                  Discard ↺
                </button>
              </div>
            </div>
          )}

          {/* ==================== STATE 1.7: COMPOSITION PAGE (EDIT CAPTION & SAVE MUSIC) ==================== */}
          {postState === "edit-details" &&
            (() => {
              const cycleImages = [
                "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=700&auto=format&fit=crop", // Circuit board!
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=700&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=700&auto=format&fit=crop",
              ];

              const activePreviewUrl =
                capturedMedia?.localUrl || cycleImages[selectedCycleIndex];

              const cycleMedia = (direction: "next" | "prev") => {
                let nextIdx = 0;
                if (direction === "next") {
                  nextIdx = (selectedCycleIndex + 1) % cycleImages.length;
                } else {
                  nextIdx =
                    (selectedCycleIndex - 1 + cycleImages.length) %
                    cycleImages.length;
                }
                setSelectedCycleIndex(nextIdx);
                triggerToast(
                  `Gallery Image ${nextIdx + 1}/${cycleImages.length}`,
                );
              };

              const handleTextMouseDown = (e: React.MouseEvent) => {
                const clientX = e.clientX;
                const clientY = e.clientY;
                setIsDraggingText(true);
                hasDraggedRef.current = false;
                dragStartPos.current = {
                  clientX,
                  clientY,
                  textX: textPos.x,
                  textY: textPos.y,
                };
              };

              const handleTextTouchStart = (e: React.TouchEvent) => {
                const clientX = e.touches[0].clientX;
                const clientY = e.touches[0].clientY;
                setIsDraggingText(true);
                hasDraggedRef.current = false;
                dragStartPos.current = {
                  clientX,
                  clientY,
                  textX: textPos.x,
                  textY: textPos.y,
                };
              };

              const handleContainerMouseMove = (e: React.MouseEvent) => {
                if (!isDraggingText) return;
                updateTextDragPosition(e.clientX, e.clientY);
              };

              const handleContainerTouchMove = (e: React.TouchEvent) => {
                if (!isDraggingText) return;
                updateTextDragPosition(
                  e.touches[0].clientX,
                  e.touches[0].clientY,
                );
              };

              const updateTextDragPosition = (
                clientX: number,
                clientY: number,
              ) => {
                const deltaX = clientX - dragStartPos.current.clientX;
                const deltaY = clientY - dragStartPos.current.clientY;

                if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
                  hasDraggedRef.current = true;
                }

                if (editorContainerRef.current) {
                  const rect =
                    editorContainerRef.current.getBoundingClientRect();
                  const pctDeltaX = (deltaX / rect.width) * 100;
                  const pctDeltaY = (deltaY / rect.height) * 100;

                  const newX = Math.max(
                    8,
                    Math.min(92, dragStartPos.current.textX + pctDeltaX),
                  );
                  const newY = Math.max(
                    12,
                    Math.min(84, dragStartPos.current.textY + pctDeltaY),
                  );

                  setTextPos({ x: newX, y: newY });
                }
              };

              const handleContainerMouseUpOrTouchEnd = () => {
                if (!isDraggingText) return;
                setIsDraggingText(false);

                if (!hasDraggedRef.current) {
                  const nextIdx = (textStyleIdx + 1) % 10;
                  setTextStyleIdx(nextIdx);
                  triggerToast(`Style: ${TEXT_STYLES[nextIdx].name} ✨`);
                }
              };

               const handleConfirmPostCreation = (e?: React.MouseEvent | React.FormEvent) => {
                 if (e && e.preventDefault) {
                   e.preventDefault();
                 }
                // Commit the post
                const isVideo = (capturedMedia?.type || "photo") === "video";
                const newPostItem = {
                  type: (capturedMedia?.type || "photo") as "photo" | "video",
                  title: customCaptionText || editableText || "",
                  emoji: capturedMedia?.emoji || "✨",
                  gradient:
                    capturedMedia?.gradient || "from-[#0091FF] to-[#00F0FF]",
                  localUrl: activePreviewUrl,
                };
                setActivePost(newPostItem);
                setPostHistory((prev) => [newPostItem, ...prev]);
                savePostToLibrary(newPostItem);

                if (onAddReel && activePreviewUrl) {
                  onAddReel(activePreviewUrl, isVideo, customCaptionText || editableText || "");
                }

                triggerToast("✨ Success! Your post is now live.");
                if (onPushRoute) {
                  onPushRoute("dashboard");
                } else {
                  onBack();
                }
              };

              return (
                <div
                  ref={editorContainerRef}
                  onMouseMove={handleContainerMouseMove}
                  onTouchMove={handleContainerTouchMove}
                  onMouseUp={handleContainerMouseUpOrTouchEnd}
                  onTouchEnd={handleContainerMouseUpOrTouchEnd}
                  className="absolute inset-0 bg-neutral-950 text-white select-none overflow-hidden"
                >
                  {/* B. Center Premium Image Preview with special effect filter */}
                  {capturedMedia?.type === "video" ? (
                    <video
                      src={activePreviewUrl}
                      className="w-full h-full object-contain select-none pointer-events-none transition-all duration-300"
                      style={{
                        filter:
                          magicEffectStyle === 1
                            ? "saturate(1.5) contrast(1.25) hue-rotate(45deg)"
                            : magicEffectStyle === 2
                              ? "sepia(0.2) contrast(1.3) saturate(1.6) hue-rotate(240deg)"
                              : magicEffectStyle === 3
                                ? "sepia(0.25) saturate(1.2) brightness(1.05)"
                                : magicEffectStyle === 4
                                  ? "saturate(1.8) hue-rotate(180deg) brightness(1.1)"
                                  : magicEffectStyle === 5
                                    ? "grayscale(1) contrast(1.35) brightness(0.95)"
                                    : "none",
                      }}
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={activePreviewUrl}
                      alt="Active Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain select-none pointer-events-none transition-all duration-300"
                      style={{
                        filter:
                          magicEffectStyle === 1
                            ? "saturate(1.5) contrast(1.25) hue-rotate(45deg)"
                            : magicEffectStyle === 2
                              ? "sepia(0.2) contrast(1.3) saturate(1.6) hue-rotate(240deg)"
                              : magicEffectStyle === 3
                                ? "sepia(0.25) saturate(1.2) brightness(1.05)"
                                : magicEffectStyle === 4
                                  ? "saturate(1.8) hue-rotate(180deg) brightness(1.1)"
                                  : magicEffectStyle === 5
                                    ? "grayscale(1) contrast(1.35) brightness(0.95)"
                                    : "none",
                      }}
                    />
                  )}

                  {/* A. Top Bar Actions */}
                  <div className="absolute top-0 inset-x-0 px-4 py-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/60 to-transparent">
                    <button
                      type="button"
                      onClick={() => {
                        onBack();
                      }}
                      className="w-8 h-8 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="Discard edit"
                    >
                      <X className="w-6 h-6 text-white drop-shadow-md" />
                    </button>
                  </div>

                  {/* Filter Custom Overlays */}
                  {magicEffectStyle === 1 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-green-500/10 pointer-events-none mix-blend-color-dodge">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%] animate-pulse" />
                    </div>
                  )}
                  {magicEffectStyle === 2 && (
                    <div className="absolute inset-0 pointer-events-none mix-blend-difference border-4 border-fuchsia-500/30 animate-pulse" />
                  )}
                  {magicEffectStyle === 3 && (
                    <div className="absolute inset-0 bg-amber-500/10 pointer-events-none mix-blend-overlay radial-gradient" />
                  )}
                  {magicEffectStyle === 4 && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 pointer-events-none" />
                  )}
                  {magicEffectStyle === 5 && (
                    <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
                  )}

                  {/* Left/Right carousel arrows */}
                  {!capturedMedia?.localUrl && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleMedia("prev");
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/20 border border-white/10 flex items-center justify-center transition-all z-20 active:scale-90 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleMedia("next");
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/20 border border-white/10 flex items-center justify-center transition-all z-20 active:scale-90 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </>
                  )}

                  {/* Draggable Text element in center */}
                  {editableText.trim() !== "" && (
                    <div
                      style={{
                        left: `${textPos.x}%`,
                        top: `${textPos.y}%`,
                        transform: "translate(-50%, -50%)",
                        position: "absolute",
                        cursor: isDraggingText ? "grabbing" : "grab",
                        zIndex: 35,
                      }}
                      onMouseDown={handleTextMouseDown}
                      onTouchStart={handleTextTouchStart}
                      className="absolute select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className={`${TEXT_STYLES[textStyleIdx].class} text-center select-none cursor-pointer whitespace-pre-wrap px-3 py-1 transition-all active:scale-[1.03] leading-tight`}
                      >
                        {editableText}
                      </div>
                    </div>
                  )}

                  {/* Media Cycle Indicator Dots */}
                  {!capturedMedia?.localUrl && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/20 backdrop-blur rounded-full px-2 py-0.5 border border-white/5 z-20">
                      {cycleImages.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 font-sans rounded-full transition-all ${
                            selectedCycleIndex === i
                              ? "bg-[#29b6f6] w-2.5 h-1"
                              : "bg-neutral-600 h-1 w-1"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Embedded Music Banner Marquee */}
                  {attachmentTrack && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm rounded-full py-1.5 px-3 flex items-center gap-1.5 z-20">
                      <Music className="w-3 h-3 text-white shrink-0" />
                      <span className="text-[10px] font-semibold text-white tracking-wide truncate">
                        {attachmentTrack.title}
                      </span>
                    </div>
                  )}

                  {/* C. Bottom Toolbar Actions */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-30 pb-safe">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4 w-full">
                        {/* Editing Button with Pen Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingWord(true);
                          }}
                          className="flex-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-[20px] px-6 py-3.5 flex items-center justify-center gap-2 hover:bg-black/20 transition-all cursor-pointer shadow-lg"
                        >
                          <Edit2 className="w-5 h-5 text-white" />
                          <span className="text-white font-medium text-[14px]">
                            Edit text
                          </span>
                        </button>

                        {/* Submit / Post Button next to input */}
                        <button
                          type="button"
                          onClick={handleConfirmPostCreation}
                          className="w-[50px] h-[50px] bg-white rounded-[20px] flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer shadow-lg hover:bg-neutral-200"
                        >
                          <ChevronRight className="w-7 h-7 text-black stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Word Customize Dialog Overlay */}
                  {isEditingWord && (
                    <div
                      className="absolute inset-0 bg-black/30 z-[5000] p-4 flex flex-col justify-between animate-in fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col space-y-4 pt-12">
                        <div className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setIsEditingWord(false)}
                            className="p-2 text-white/70 hover:text-white"
                          >
                            <X className="w-6 h-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingWord(false)}
                            className="font-bold text-lg text-white"
                          >
                            Done
                          </button>
                        </div>

                        <div className="flex justify-center mt-20">
                          <textarea
                            maxLength={64}
                            value={editableText}
                            onChange={(e) => setEditableText(e.target.value)}
                            placeholder="Type text overlay..."
                            className="bg-transparent border-b-2 border-white/40 text-center font-bold text-3xl text-white focus:outline-none focus:border-white p-2 w-full max-w-[300px] resize-none overflow-hidden"
                            autoFocus
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* ==================== STATE 2: GALLERY SELECTOR VIEW ==================== */}
          {postState === "gallery" && (
            <div className="flex-1 flex flex-col justify-center h-full min-h-[460px] bg-black relative px-4">
              <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
                <div className="text-center font-bold text-white text-[20px]">
                  All Users
                </div>

                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            const MAX_WIDTH = 600;
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            ctx?.drawImage(img, 0, 0, width, height);
                            const uri = canvas.toDataURL("image/jpeg", 0.6); // Compress to save localstorage

                            setCapturedMedia({
                              type: "photo",
                              title: file.name || "Uploaded Photo",
                              emoji: "🖼️",
                              gradient: "from-blue-600 to-teal-500",
                              localUrl: uri,
                            });
                            setPostState("edit-details");
                            triggerToast("🖼️ Loaded photo from device.");
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="w-full bg-[#1A1A1A] rounded-[24px] p-6 flex items-center justify-between shadow-lg active:scale-95 transition-transform"
                >
                  <span className="text-white font-bold text-[18px]">PRO</span>
                  <div className="flex flex-col flex-1 items-center justify-center text-center -ml-4">
                    <span className="text-white text-[18px] font-semibold tracking-wide leading-tight">
                      Snaps
                    </span>
                    <span className="text-white text-[17px] tracking-wide">
                      (Images)
                    </span>
                  </div>
                  <ChevronRight className="w-8 h-8 text-[#007AFF] stroke-[3.5]" />
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "video/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        setCapturedMedia({
                          type: "video",
                          title: file.name || "Uploaded Video",
                          emoji: "🎬",
                          gradient: "from-indigo-600 to-purple-500",
                          localUrl: objectUrl,
                        });
                        setPostState("edit-details");
                        triggerToast("🎬 Loaded video from device.");
                      }
                    };
                    input.click();
                  }}
                  className="w-full bg-[#1A1A1A] rounded-[24px] p-6 flex items-center justify-between shadow-lg active:scale-95 transition-transform"
                >
                  <span className="text-white font-bold text-[18px]">PRO</span>
                  <div className="flex flex-col flex-1 items-center justify-center text-center -ml-4">
                    <span className="text-white text-[18px] font-semibold tracking-wide leading-tight">
                      Scrolls
                    </span>
                    <span className="text-white text-[17px] tracking-wide">
                      (videos)
                    </span>
                  </div>
                  <ChevronRight className="w-8 h-8 text-[#007AFF] stroke-[3.5]" />
                </button>

                <button
                  onClick={() => onBack()}
                  className="mt-2 text-[#0091FF] text-lg font-medium p-3 rounded-full hover:bg-white/10 transition-colors mx-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ==================== STATE 3: POSTED / VIEW STREAM OUTCOMES ==================== */}
          {postState === "posted" && (
            <div className="flex-1 flex flex-col justify-start h-full min-h-[460px] relative pt-2">
              {/* Viewport card holder in beautiful light gray theme (#D8D8D8) matching Image 3 strictly with top-bar cleaned */}
              <div
                ref={containerRef}
                onClick={() => {
                  setShowPostStatsModal(true);
                  triggerToast(
                    "📊 Tapped! Open stars, comments & delete panel.",
                  );
                }}
                className="relative flex-1 min-h-[460px] w-full rounded-[28px] bg-[#D8D8D8] p-4 flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer"
              >
                {/* Visual feedback "user turnedoff" warning if clicked comment bubbles inside stream */}
                {showCommentsDisabledPopup && (
                  <div
                    className="absolute inset-0 m-auto w-[180px] h-[54px] bg-black/55 text-white border border-red-500/20 shadow-2xl flex flex-col items-center justify-center rounded-2xl z-[9000] animate-in fade-in zoom-in duration-100 p-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[12px] font-mono font-extrabold text-red-400 tracking-wider">
                      ⚠️ user turnedoff
                    </p>
                    <p className="text-[8px] font-sans text-neutral-400">
                      Comments are disabled
                    </p>
                  </div>
                )}

                {/* 1 second comment block warning pop message */}
                {showTurnedOffOneSecPopup && (
                  <div
                    className="absolute inset-0 m-auto w-[220px] h-[64px] bg-red-650/95 text-white border border-white/20 shadow-2xl flex flex-col items-center justify-center rounded-2xl z-[9000] animate-in scale-in duration-100 p-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[12px] font-sans font-extrabold tracking-wide uppercase">
                      ⚠️ user turnedoff
                    </p>
                    <p className="text-[9px] text-white/90 font-mono mt-0.5">
                      comment box for these post
                    </p>
                  </div>
                )}

                {/* Interactive Drag-and-Drop Caption display on Card */}
                {captionText && activePost && (
                  <div
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    style={{
                      position: "absolute",
                      left: `${captionX}%`,
                      top: `${captionY}%`,
                    }}
                    className={`absolute z-30 cursor-move select-none p-2 rounded-xl bg-black/20 backdrop-blur-[2px] border border-white/5 shadow-md hover:ring-2 hover:ring-blue-400 transition-all ${captionFont}`}
                    title="Press and Drag to position caption on post"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {captionText}
                  </div>
                )}

                {/* Active items snap file preview, beautiful camera photo, or orbiting rotating vinyl audio player */}
                {activePost?.isAudioOnly ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0c0f1a] via-[#111827] to-[#16273c] flex flex-col items-center justify-center p-6 rounded-[28px] overflow-hidden z-10 select-none">
                    {/* Floating constellation particles ambient background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,145,255,0.15)_0%,transparent_75%)] animate-pulse" />

                    {/* Rotating Vinyl Record Disc Widget */}
                    <div className="relative w-36 h-36 rounded-full bg-neutral-900 border-[6px] border-neutral-800 shadow-2xl flex items-center justify-center animate-[spin_8s_linear_infinite] mt-2 mb-1 z-20">
                      {/* Realistic record groves */}
                      <div className="absolute inset-2 rounded-full border border-neutral-700/40" />
                      <div className="absolute inset-5 rounded-full border border-neutral-700/30" />
                      <div className="absolute inset-8 rounded-full border border-neutral-700/20" />
                      {/* Label Center */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center border-[3px] border-neutral-950 text-xs">
                        💿
                      </div>
                    </div>

                    {/* Glowing Music Wave lines simulation */}
                    <div className="flex items-end justify-center gap-1 h-8 mt-5 z-20">
                      {[12, 18, 26, 15, 20, 24, 30, 24, 20, 15, 26, 18, 12].map(
                        (height, i) => (
                          <div
                            key={i}
                            style={{
                              height: `${height}px`,
                              animationDelay: `${i * 0.08}s`,
                            }}
                            className="w-[3px] bg-[#0091FF] rounded-full animate-bounce shadow-[0_0_6px_rgba(0,145,255,0.5)]"
                          />
                        ),
                      )}
                    </div>

                    <div className="text-center mt-3.5 z-20 max-w-[190px]">
                      <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest leading-none">
                        1m Audio Post 🎙️
                      </span>
                      <p className="text-white font-bold font-sans text-[11px] tracking-wide mt-1truncate leading-tight">
                        {attachmentTrack?.title || "Celestial Soundtrack"}
                      </p>
                      <p className="text-neutral-400 font-mono text-[9px] mt-0.5 truncate leading-none">
                        {attachmentTrack?.artist || "In-Studio Master"}
                      </p>
                    </div>
                  </div>
                ) : activePost?.localUrl ? (
                  <img
                    src={activePost.localUrl}
                    alt="Active Snapshot"
                    className="absolute inset-0 w-full h-full object-contain rounded-[28px]"
                  />
                ) : activePost ? (
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr ${activePost.gradient} opacity-95`}
                  />
                ) : null}

                {/* Clean spacers to let full post artwork shine beautifully without overlaps in central card */}
                <div className="flex-1 flex flex-col items-center justify-center select-none text-center z-10" />

                {/* Overlapped highlight song playing tag */}
                {attachmentTrack && (
                  <div
                    className="absolute bottom-3 left-3 bg-black/30 border border-white/10 px-3 py-1 rounded-full text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Music className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-spin" />
                    <span>
                      {activePost?.isAudioOnly ? "1m" : "30s"} Loop:{" "}
                      {attachmentTrack.title.substring(0, 15)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showMusicSelectionPopup && (
          <div className="absolute inset-0 bg-black/98 z-[99999] p-4 flex flex-col justify-between rounded-[36px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-left">
            {/* Header section with subtitle */}
            <div className="flex justify-between items-center pb-2.5 border-b border-white/10 shrink-0">
              <div>
                <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400 animate-spin" />{" "}
                  Advanced Music Tool
                </span>
                <p className="text-[8px] text-neutral-400 uppercase tracking-wider mt-0.5">
                  Integrate Apps, Lyrics or Audio-Only Streams
                </p>
              </div>
              <button
                onClick={() => setShowMusicSelectionPopup(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tab selection controls */}
            <div className="grid grid-cols-2 gap-1.5 bg-neutral-900/60 p-1 rounded-xl border border-white/5 my-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMusicTabMode("30s");
                  setIsAudioOnlyPost(false);
                  triggerToast("Switched to 30s Clip & Lyrics mode 🎵");
                }}
                className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  musicTabMode === "30s"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                30s Highlight & Lyrics
              </button>
              <button
                type="button"
                onClick={() => {
                  setMusicTabMode("1min");
                  setIsAudioOnlyPost(true);
                  triggerToast("Switched to 1m Audio Track mode 🎙️");
                }}
                className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  musicTabMode === "1min"
                    ? "bg-emerald-600 text-white shadow-md border border-emerald-400/20"
                    : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                1-Min Audio-Only Post
              </button>
            </div>

            {/* Scrollable primary configuration body */}
            <div className="flex-1 overflow-y-auto space-y-4 my-2.5 pr-0.5 scrollbar-thin">
              {musicTabMode === "30s" ? (
                <>
                  {/* Streaming app integrations chooser */}
                  <div className="bg-neutral-900/40 p-3 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span>📱</span> Import from Mobile Apps
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {musicProviders.map((prov) => {
                        const isSelectedApp = selectedMusicApp === prov.name;
                        return (
                          <div key={prov.name} className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMusicApp(prov.name);
                                triggerToast(
                                  `📱 Loaded ${prov.name} Feed Catalog! Connect a track to post.`,
                                );
                              }}
                              className={`w-full py-1.5 rounded-lg text-white font-bold text-[8px] flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm transition-all hover:scale-102 ${
                                isSelectedApp
                                  ? "ring-2 ring-cyan-400 scale-102 " +
                                    prov.color
                                  : "bg-neutral-800 hover:bg-neutral-700"
                              }`}
                            >
                              <span className="text-sm">{prov.logo}</span>
                              <span className="text-[7px] truncate w-full px-0.5 text-center">
                                {prov.name}
                              </span>
                            </button>

                            {/* Small discrete original launcher link icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProvider(prov);
                              }}
                              className="absolute -top-1 right-0 bg-black/20 hover:bg-black rounded-full p-0.5 text-[6px] text-white border border-white/10"
                              title={`Open real ${prov.name}`}
                            >
                              🔗
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DISPLAY IN-APP CATALOG IF APP SELECTED */}
                  {selectedMusicApp && appSpecificTracks[selectedMusicApp] ? (
                    <div className="bg-neutral-900/40 p-3 rounded-2xl border border-white/5 animate-in slide-in-from-top duration-200">
                      <div className="flex justify-between items-center pb-1.5 mb-2 border-b border-white/5">
                        <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          <span>🌐</span> {selectedMusicApp} Popular Hits List
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMusicApp("");
                            triggerToast("Cleared active app filter");
                          }}
                          className="text-[7.5px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 font-mono"
                        >
                          Show Standard ✕
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {appSpecificTracks[selectedMusicApp].map((track) => {
                          const isAttached = attachmentTrack?.id === track.id;
                          return (
                            <div
                              key={track.id}
                              onClick={() => {
                                setAttachmentTrack(track);
                                setIsMusicPlaying(true);
                                setMusicPlaybackTime(0); // reset playback timer to 0
                                if (track.lyrics && track.lyrics.length > 0) {
                                  setSelectedLyricLine(track.lyrics[0]);
                                  setCaptionText(track.lyrics[0]);
                                }
                                triggerToast(
                                  `🎵 Connected ${selectedMusicApp} Hit: ${track.title}`,
                                );
                              }}
                              className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex items-center justify-between ${
                                isAttached
                                  ? "bg-cyan-950/40 border-cyan-500/40 text-white font-bold"
                                  : "bg-neutral-904 border-white/5 text-neutral-300 hover:bg-neutral-800"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span>💿</span>
                                <div>
                                  <p className="text-[10px] font-bold leading-tight">
                                    {track.title}
                                  </p>
                                  <p className="text-[8px] text-neutral-400 leading-none">
                                    {track.artist}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <span
                                  className={`text-[7px] px-1.5 rounded uppercase font-bold text-white ${
                                    selectedMusicApp === "Spotify"
                                      ? "bg-[#1DB954]"
                                      : selectedMusicApp === "Apple Music"
                                        ? "bg-[#FC3C44]"
                                        : selectedMusicApp === "YouTube Music"
                                          ? "bg-[#FF0000]"
                                          : "bg-[#FF5500]"
                                  }`}
                                >
                                  Select
                                </span>
                                {isAttached && (
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      selectedMusicApp === "Spotify"
                                        ? "bg-[#1DB954]"
                                        : selectedMusicApp === "Apple Music"
                                          ? "bg-[#FC3C44]"
                                          : selectedMusicApp === "YouTube Music"
                                            ? "bg-[#FF0000]"
                                            : "bg-[#FF5500]"
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* High fidelity default track selector list */
                    <div className="bg-neutral-900/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                        <span>⚡</span> Select 30s Loop Focus
                      </p>

                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {audioSnippets30s.map((track) => {
                          const isAttached = attachmentTrack?.id === track.id;
                          return (
                            <div
                              key={track.id}
                              onClick={() => {
                                setAttachmentTrack(track);
                                setIsMusicPlaying(true);
                                setMusicPlaybackTime(0);
                                // set default lyric first option
                                if (track.lyrics && track.lyrics.length > 0) {
                                  setSelectedLyricLine(track.lyrics[0]);
                                  setCaptionText(track.lyrics[0]);
                                }
                                triggerToast(
                                  `🎵 Connected track: ${track.title}`,
                                );
                              }}
                              className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex items-center justify-between ${
                                isAttached
                                  ? "bg-cyan-950/40 border-cyan-500/40 text-white"
                                  : "bg-neutral-904 border-white/5 text-neutral-300 hover:bg-neutral-800"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span>🎧</span>
                                <div>
                                  <p className="text-[10px] font-bold leading-tight">
                                    {track.title}
                                  </p>
                                  <p className="text-[8px] text-neutral-400 leading-none">
                                    {track.artist}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <span className="text-[8px] font-mono text-neutral-400 bg-neutral-950 py-0.5 px-1 rounded">
                                  {track.duration}
                                </span>
                                {isAttached && (
                                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lyrics selection & subtitle syncing */}
                  {attachmentTrack && attachmentTrack.lyrics && (
                    <div className="bg-neutral-900/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <span>💬</span> Tap Lyric Segment to Post
                      </p>
                      <p className="text-[7px] text-neutral-500 uppercase pb-2">
                        Sets as drag position status caption overlay
                      </p>

                      <div className="space-y-1.5">
                        {attachmentTrack.lyrics.map((lyr, index) => {
                          const isLyricSelected = selectedLyricLine === lyr;
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedLyricLine(lyr);
                                setCaptionText(lyr);
                                triggerToast(
                                  "✨ Applied lyric caption to card overlay!",
                                );
                              }}
                              className={`w-full p-2 text-[9px] text-left rounded-lg transition-all border ${
                                isLyricSelected
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold"
                                  : "bg-neutral-950 text-neutral-400 hover:text-neutral-200 border-transparent"
                              }`}
                            >
                              {lyr}
                            </button>
                          );
                        })}
                      </div>

                      {/* Timeline Cropper Scrubber */}
                      <div className="mt-3 pt-2.5 border-t border-white/5">
                        <div className="flex justify-between items-center text-[8px] text-neutral-400 mb-1">
                          <span className="uppercase font-mono">
                            Highlight Start: {lyricsCropStart}s
                          </span>
                          <span className="uppercase font-mono">
                            End Duration: {lyricsCropEnd}s (30s segment)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={lyricsCropStart}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setLyricsCropStart(val);
                            setLyricsCropEnd(val + 30);
                          }}
                          className="w-full accent-cyan-500 cursor-pointer text-xs h-1 hover:brightness-110"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* 1-m Audio highlight generator */}
                  <div className="bg-gradient-to-tr from-emerald-950/20 via-neutral-900/80 to-cyan-950/20 p-3.5 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎙️</span>
                      <div>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                          1-Min Audio Studio Track
                        </p>
                        <p className="text-[8px] text-neutral-500 mt-0.5">
                          Captures a complete high quality 1-minute melody post
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto mt-2">
                      {audioTracks1Min.map((track) => {
                        const isAttached = attachmentTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => {
                              setAttachmentTrack(track);
                              setIsMusicPlaying(true);
                              setIsAudioOnlyPost(true);
                              setCaptionText(""); // empty because audio is focusing on the track
                              triggerToast(
                                `🎙️ Configured 1m Audio Post: ${track.title}`,
                              );
                            }}
                            className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all flex items-center justify-between ${
                              isAttached
                                ? "bg-emerald-950/40 border-emerald-500/40 text-white font-extrabold"
                                : "bg-neutral-950/80 border-white/5 text-neutral-400 hover:bg-neutral-900"
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-sm">💿</span>
                              <div>
                                <p className="text-[10px] font-bold leading-tight">
                                  {track.title}
                                </p>
                                <p className="text-[8px] text-neutral-400 leading-none">
                                  {track.artist}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/15 py-0.5 px-1.5 rounded">
                                {track.duration}
                              </span>
                              {isAttached && (
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Warning label */}
                    <div className="mt-3 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-center">
                      <p className="text-[8.5px] text-emerald-300 leading-normal font-sans">
                        ⚠️ Selecting active 1-min audio track replaces camera
                        background media with an audio-only cosmic vinyl spin
                        player.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* REAL-TIME SIMULATION MUSIC PLAYBACK TRAY */}
            {attachmentTrack && (
              <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-3 space-y-2 shrink-0 animate-in slide-in-from-bottom duration-200 text-left my-2 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`relative w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0 ${isMusicPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`}
                    >
                      <span className="text-xs">💿</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate max-w-[130px] leading-tight">
                        {attachmentTrack.title}
                      </p>
                      <p className="text-[8px] text-neutral-400 truncate max-w-[120px] leading-tight">
                        {attachmentTrack.artist}
                      </p>
                    </div>
                  </div>

                  {/* Equalizer Visualizer */}
                  {isMusicPlaying && (
                    <div className="flex items-end space-x-[2px] h-3.5 px-1 shrink-0">
                      {[1, 2, 3, 4, 3, 2, 1].map((val, i) => (
                        <div
                          key={i}
                          style={{
                            height: `${Math.floor(Math.sin((musicPlaybackTime + i) * 1.5) * 4) + 8}px`,
                          }}
                          className={`w-[2px] rounded-full transition-all duration-300 ${
                            selectedMusicApp === "Spotify"
                              ? "bg-[#1DB954]"
                              : selectedMusicApp === "Apple Music"
                                ? "bg-[#FC3C44]"
                                : selectedMusicApp === "YouTube Music"
                                  ? "bg-[#FF0000]"
                                  : selectedMusicApp === "SoundCloud"
                                    ? "bg-[#FF5500]"
                                    : "bg-[#0091FF]"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Badge */}
                  <div className="shrink-0">
                    {selectedMusicApp ? (
                      <span
                        className={`text-[6.5px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          selectedMusicApp === "Spotify"
                            ? "bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30"
                            : selectedMusicApp === "Apple Music"
                              ? "bg-[#FC3C44]/20 text-[#FC3C44] border border-[#FC3C44]/30"
                              : selectedMusicApp === "YouTube Music"
                                ? "bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/30"
                                : "bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30"
                        }`}
                      >
                        {selectedMusicApp} App
                      </span>
                    ) : (
                      <span className="text-[6.5px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase">
                        Built-in
                      </span>
                    )}
                  </div>
                </div>

                {/* Live scrollable synced lyric segment */}
                <div className="bg-black/20 border border-white/5 p-1.5 rounded-lg text-center backdrop-blur-sm">
                  <p className="text-[8.5px] text-cyan-400 font-medium italic truncate">
                    {attachmentTrack.lyrics && attachmentTrack.lyrics.length > 0
                      ? attachmentTrack.lyrics[
                          musicPlaybackTime % attachmentTrack.lyrics.length
                        ]
                      : "🎵 Playing Instrumental highlight beat..."}
                  </p>
                </div>

                {/* Scrubber timeline and toggle play pause */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMusicPlaying(!isMusicPlaying);
                      triggerToast(
                        isMusicPlaying
                          ? "⏸️ Paused preview"
                          : "▶️ Playing track beat",
                      );
                    }}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 hover:scale-105 active:scale-95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center text-[8px] font-bold tracking-wide uppercase font-mono border border-white/10 shrink-0"
                  >
                    {isMusicPlaying ? "⏸️ Pause" : "▶️ Play"}
                  </button>

                  <div className="flex-1 space-y-[2px]">
                    <div className="flex justify-between items-center text-[7px] text-neutral-400 font-mono leading-none">
                      <span>
                        0:{musicPlaybackTime < 10 ? "0" : ""}
                        {musicPlaybackTime}
                      </span>
                      <span>{musicTabMode === "1min" ? "1:00" : "0:30"}</span>
                    </div>

                    {/* Scrubber tracker range click action */}
                    <div
                      className="relative h-1 bg-neutral-800 rounded-full cursor-pointer overflow-hidden"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percent = clickX / rect.width;
                        const maxLen = musicTabMode === "1min" ? 60 : 30;
                        setMusicPlaybackTime(
                          Math.min(
                            maxLen,
                            Math.max(0, Math.floor(percent * maxLen)),
                          ),
                        );
                      }}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedMusicApp === "Spotify"
                            ? "bg-[#1DB954]"
                            : selectedMusicApp === "Apple Music"
                              ? "bg-[#FC3C44]"
                              : selectedMusicApp === "YouTube Music"
                                ? "bg-[#FF0000]"
                                : selectedMusicApp === "SoundCloud"
                                  ? "bg-[#FF5500]"
                                  : "bg-[#0091FF]"
                        }`}
                        style={{
                          width: `${(musicPlaybackTime / (musicTabMode === "1min" ? 60 : 30)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom confirmation operations */}
            <button
              onClick={() => {
                setShowMusicSelectionPopup(false);
                triggerToast("⚡ Custom sound parameters applied!");
              }}
              className="w-full bg-[#0091FF] hover:bg-blue-600 active:scale-98 transition-all text-xs py-2.5 rounded-xl font-bold cursor-pointer text-white text-center shadow-lg shrink-0"
            >
              Confirm Music Properties ✓
            </button>
          </div>
        )}

        {/* ====================================================================== */}
        {/* VIEW STREAM STATS & LOUNGE INTERACTION MODAL (COMMENTS, STARS, TRASH DELETE) */}
        {/* ====================================================================== */}
        {showPostStatsModal && (
          <div className="absolute inset-0 bg-neutral-950/98 z-[99999] p-5 flex flex-col justify-between rounded-[36px] border border-white/10 animate-in slide-in-from-bottom duration-150">
            <div className="flex flex-col space-y-3.5 h-full overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-white uppercase font-mono font-bold tracking-widest">
                    Post Stats & Lounge 📊
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostStatsModal(false)}
                  className="text-white hover:text-neutral-300 p-1.5 rounded-full bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stats Counters Grid row */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="bg-neutral-900/40 border border-white/5 p-2 rounded-xl text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wide">
                    ⭐ Stars Supported
                  </span>
                  <p className="text-base font-extrabold text-yellow-400 mt-0.5">
                    {supportersCount}
                  </p>
                </div>
                <div className="bg-neutral-900/40 border border-white/5 p-2 rounded-xl text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wide">
                    👁️ Stream Views
                  </span>
                  <p className="text-base font-extrabold text-[#0091FF] mt-0.5">
                    {viewsCount}
                  </p>
                </div>
              </div>

              {/* Comments stream subsection inside Lounge */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold tracking-wider text-left pl-0.5">
                  Comments Area:
                </span>

                {commentsEnabled ? (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 my-1 scrollbar-thin scrollbar-thumb-neutral-800">
                      {commentsList.map((c) => (
                        <div
                          key={c.id}
                          className="bg-neutral-900/30 p-2.5 rounded-xl border border-white/5 text-left text-xs"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-neutral-300 font-mono text-[9px]">
                              {c.author}
                            </span>
                            <span className="text-[8px] text-neutral-500 font-sans">
                              {c.time}
                            </span>
                          </div>
                          <p className="text-neutral-200 leading-normal font-sans">
                            {c.text}
                          </p>
                        </div>
                      ))}
                      {commentsList.length === 0 && (
                        <div className="text-center py-6 text-neutral-500 text-[10px]">
                          No comments yet. Be the first!
                        </div>
                      )}
                    </div>

                    {/* Submission row Form inside Stats Lounge */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newCommentInput.trim()) return;
                        const newComment = {
                          id: Date.now(),
                          author: "You 👑",
                          text: newCommentInput.trim(),
                          time: "Just now",
                        };
                        setCommentsList((p) => [...p, newComment]);
                        setNewCommentInput("");
                        triggerToast("💬 Comment added to stream!");
                      }}
                      className="flex space-x-1.5 shrink-0 pt-1.5 border-t border-white/5"
                    >
                      <input
                        type="text"
                        value={newCommentInput}
                        onChange={(e) => setNewCommentInput(e.target.value)}
                        placeholder="Type comment..."
                        className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-blue-500 font-sans"
                      />
                      <button
                        type="submit"
                        className="bg-[#0091FF] hover:brightness-110 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-red-950/20 rounded-xl border border-red-500/10 text-center">
                    <MessageSquareOff className="w-7 h-7 text-red-500 mb-1.5 stroke-[1.8]" />
                    <p className="text-xs font-bold text-red-400">
                      ⚠️ Comments Box is Disabled
                    </p>
                    <p className="text-[9px] text-neutral-500 mt-0.5">
                      Author disabled comment reviews for this snapshot.
                    </p>
                  </div>
                )}
              </div>

              {/* Big TRASH DELETE POST button at bottom of lounge modal, aligned beautifully */}
              <div className="pt-2 border-t border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPostState("no-post");
                    setActivePost(null);
                    setCapturedMedia(null);
                    setAttachmentTrack(null);
                    setCaptionText("");
                    setShowPostStatsModal(false);
                    triggerToast("🗑️ Post deleted permanently!");
                  }}
                  className="w-full bg-red-650 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* COMMENTS LIST & DIALOGUE SUBMISSIONS OVERLAY */}
        {/* ====================================================================== */}
        {showCommentsModal && (
          <div className="absolute inset-0 bg-neutral-950/98 z-[99999] p-5 flex flex-col justify-between rounded-[36px] border border-white/10 animate-in slide-in-from-bottom duration-150">
            <div className="flex flex-col space-y-4 h-full overflow-hidden">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#0091FF]" />
                  <span className="text-xs text-white uppercase font-mono font-bold tracking-widest">
                    Comments ({commentsList.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCommentsModal(false)}
                  className="text-xs text-blue-400 font-bold hover:underline"
                  id="target-close-comments-box"
                >
                  Close ✕
                </button>
              </div>

              {/* Action alert box inside comments */}
              <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-xl border border-white/5 shrink-0 text-left">
                <div>
                  <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-wider">
                    Comments active
                  </p>
                  <p className="text-[8px] text-neutral-500 mt-0.5">
                    Toggle permission off to block new message logs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCommentsEnabled(false);
                    setShowCommentsModal(false);
                    triggerToast("💬 Comments turned off by user");
                  }}
                  className="bg-neutral-950 hover:bg-neutral-800 text-[9px] text-red-400 border border-red-500/10 font-bold uppercase tracking-wider py-1 px-2.5 rounded-md cursor-pointer"
                >
                  Turn Off ⚠️
                </button>
              </div>

              {/* Comments Scroll list wrapper */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 my-1 scrollbar-thin scrollbar-thumb-neutral-800">
                {commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="bg-neutral-900/30 p-3 rounded-xl border border-white/5 text-left text-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-neutral-300 font-mono text-[10px]">
                        {c.author}
                      </span>
                      <span className="text-[8px] text-neutral-500 font-sans">
                        {c.time}
                      </span>
                    </div>
                    <p className="text-neutral-200 leading-normal">{c.text}</p>
                  </div>
                ))}
                {commentsList.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-[10px]">
                    No comments yet. Write one below!
                  </div>
                )}
              </div>

              {/* Submission row Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCommentInput.trim()) return;
                  const newComment = {
                    id: Date.now(),
                    author: "You 👑",
                    text: newCommentInput.trim(),
                    time: "Just now",
                  };
                  setCommentsList((p) => [...p, newComment]);
                  setNewCommentInput("");
                  triggerToast("💬 Comment added!");
                }}
                className="flex space-x-1.5 shrink-0 pt-2 border-t border-white/10"
              >
                <input
                  type="text"
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  placeholder="Type your comment..."
                  className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="bg-[#0091FF] hover:brightness-110 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wide"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* POST PERMISSION DIALOG MODAL (CONFIRM OR CANCEL AS EXPLICITLY REQUESTED) */}
        {/* ====================================================================== */}
        {showPostPermissionModal && (
          <div className="absolute inset-0 bg-black/55 z-[999999] flex items-center justify-center p-4 rounded-[36px]">
            <div className="bg-neutral-950 border border-white/10 rounded-3xl p-5 w-full max-w-[280px] text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">
                Permission Request
              </h3>
              <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
                Do you want to post this captured media highlight? Choose one of
                the options below.
              </p>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleConfirmPublish}
                  className="w-full bg-[#0091FF] hover:bg-blue-600 text-xs text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Post
                </button>
                <button
                  onClick={() => {
                    setShowPostPermissionModal(false);
                    triggerToast("Post placement cancelled.");
                  }}
                  className="w-full bg-neutral-900 border border-white/5 hover:bg-neutral-850 text-xs text-neutral-400 font-semibold py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Permission Intercept Modal for CreatePostView Session */}
        {showSessionCameraPermissionModal && (
          <div className="fixed inset-0 z-[200000] bg-black/30 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#111113] border border-[#232328] rounded-3xl p-6 shadow-2xl relative text-left">
              <button
                onClick={() => {
                  setShowSessionCameraPermissionModal(false);
                  triggerToast("Camera request denied.");
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
              >
                <span className="text-lg font-bold">✕</span>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-0.5">
                  <Camera className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-zinc-100 tracking-wider">
                    Access request
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Authorization query
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#e2e2ec] leading-relaxed font-sans mb-5">
                The Media Compositor requires access to register snap profiles
                for the connection channels:
              </p>

              <div className="space-y-3 mb-6 bg-black/20 border border-white/5 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-200 uppercase tracking-wider font-bold">
                    Camera sensor activation
                  </span>
                  <div className="w-8 h-4 rounded-full bg-rose-500 relative transition-colors cursor-pointer flex items-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-white absolute right-0.5 shadow-sm transform transition-transform" />
                  </div>
                </div>
                <p className="text-[9px] text-neutral-400 leading-normal font-mono">
                  Temporary hardware activation to capture posts, apply
                  real-time styles, and output stream assets.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setShowSessionCameraPermissionModal(false);
                    triggerToast("Camera request denied.");
                  }}
                  className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-850 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider text-white border border-white/10 cursor-pointer"
                >
                  Decline
                </button>
                <button
                  onClick={() => {
                    setCameraPermissionGrantedThisSession(true);
                    setShowSessionCameraPermissionModal(false);
                    setPostState("camera-view");
                    triggerToast("📸 Camera permission allowed!");
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-90 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider text-white font-extrabold cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                >
                  Apply & Allow
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
