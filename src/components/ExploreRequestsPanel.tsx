import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bot, Link2, Link2Off, Camera, Mic, ArrowLeft, 
  X, RotateCw, Play, Pause, Trash2, Check, Sparkles, Smartphone, ShieldCheck, ShieldAlert,
  Users, UserPlus, Video, Phone, Plus, Smile, Image as ImageIcon, PhoneOff, VideoOff, Volume2, VolumeX, UserMinus, PlusCircle, MoreVertical, Bell
} from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useVoiceUploader } from '../hooks/useVoiceUploader';
import { VoiceMessageBubble } from './voice/VoiceMessageBubble';
import { VoiceRecordingBar } from './voice/VoiceRecordingBar';

import { getHumanAvatar, getHumanAvatar as getUserAvatar } from '../utils/avatar';
import { api } from '../services/api';
import { socket } from '../utils/socket';

interface ExploreRequestsPanelProps {
  onAddConnection: (username: string) => void;
  connectionList?: string[];
  onToggleConnection?: (name: string) => void;
  username?: string;
  onPushRoute?: (route: string) => void;
}

export default function ExploreRequestsPanel({ 
  onAddConnection, 
  connectionList = [], 
  onToggleConnection,
  username = 'User',
  onPushRoute
}: ExploreRequestsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const safeGetStorage = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  // Global Background States
  const [glassmorphismActive, setGlassmorphismActive] = useState<boolean>(
    safeGetStorage("app-glassmorphism") === "true"
  );

  useEffect(() => {
    const handleGlassmorphismChange = (e: any) => setGlassmorphismActive(e.detail);
    window.addEventListener("app-glassmorphism-change", handleGlassmorphismChange);
    return () => {
      window.removeEventListener("app-glassmorphism-change", handleGlassmorphismChange);
    };
  }, []);

  // Big profile avatar preview overlay state
  const [previewAvatar, setPreviewAvatar] = useState<{ name: string; avatar: string } | null>(null);

  // Chat options three dots dropdown
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Candidate user to block via the report/block modal
  const [blockPromptUser, setBlockPromptUser] = useState<string | null>(null);

  // List of blocked users with dynamic event-driven syncing
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      const stored = scopedStorage.getItem('booran_blocked_users');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // List of permanently deleted users
  const [deletedUsers, setDeletedUsers] = useState<string[]>(() => {
    try {
      const stored = scopedStorage.getItem('booran_permanently_deleted_users');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Pending invitations list
  const [pendingAccepts, setPendingAccepts] = useState<any[]>(() => {
    const defaultConnects = [
      { id: "con_1", name: "Alpha Echo", avatar: getHumanAvatar("Alpha Echo"), info: "Linked via Connects." },
      { id: "con_2", name: "ScrollRise Prime", avatar: getHumanAvatar("ScrollRise Prime"), info: "Linked via Connects." },
      { id: "con_3", name: "Shopi Patron", avatar: getHumanAvatar("Shopi Patron"), info: "Linked via Connects." }
    ];
    try {
      const stored = scopedStorage.getItem('booran_pending_connections');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => {
            if (typeof item === 'string') {
              return {
                id: `pc_${Date.now()}_${Math.random()}`,
                name: item,
                avatar: getHumanAvatar(String(item)),
                info: 'Linked with your ScrollRise ID interest'
              };
            }
            return item;
          }).filter((p: any) => p && typeof p.name === 'string');
        }
      }
      return defaultConnects;
    } catch (_) {
      return defaultConnects;
    }
  });

  useEffect(() => {
    scopedStorage.setItem('booran_pending_connections', JSON.stringify(pendingAccepts));
  }, [pendingAccepts]);

  const [sentRequests, setSentRequests] = useState<any[]>(() => {
    try {
      const stored = scopedStorage.getItem('booran_sent_requests');
      if (stored) {
        const p = JSON.parse(stored);
        if (Array.isArray(p)) return p.filter((x:any) => x && typeof x.name === 'string');
      }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    scopedStorage.setItem('booran_sent_requests', JSON.stringify(sentRequests));
  }, [sentRequests]);

  useEffect(() => {
    const syncBlocks = () => {
      try {
        const stored = scopedStorage.getItem('booran_blocked_users');
        if (stored) {
          const p = JSON.parse(stored);
          setBlockedUsers(Array.isArray(p) ? p.filter((x:any)=>typeof x === 'string') : []);
        } else setBlockedUsers([]);
      } catch (_) {
        setBlockedUsers([]);
      }
      try {
        const storedDel = scopedStorage.getItem('booran_permanently_deleted_users');
        if (storedDel) {
          const p = JSON.parse(storedDel);
          setDeletedUsers(Array.isArray(p) ? p.filter((x:any)=>typeof x === 'string') : []);
        } else setDeletedUsers([]);
      } catch (_) {
        setDeletedUsers([]);
      }
      try {
        const storedPending = scopedStorage.getItem('booran_pending_connections');
        if (storedPending) {
          setPendingAccepts(prev => {
            if (JSON.stringify(prev) !== storedPending) {
              const p = JSON.parse(storedPending);
              return Array.isArray(p) ? p.filter((x:any) => x && typeof x.name === 'string') : [];
            }
            return prev;
          });
        }
      } catch (_) {}
    };

    syncBlocks();
    window.addEventListener('focus', syncBlocks);
    window.addEventListener('booran-blocked-sync', syncBlocks);
    const interval = setInterval(syncBlocks, 1000);

    return () => {
      window.removeEventListener('focus', syncBlocks);
      window.removeEventListener('booran-blocked-sync', syncBlocks);
      clearInterval(interval);
    };
  }, []);

  const handleBlockUser = async (name: string) => {
    const isCurrentlyBlocked = blockedUsers.includes(name);
    if (isCurrentlyBlocked) {
      try {
        await api.unblockUser(name);
        setBlockedUsers(prev => {
          const updated = prev.filter(u => u !== name);
          scopedStorage.setItem('booran_blocked_users', JSON.stringify(updated));
          return updated;
        });
        window.dispatchEvent(new Event('booran-blocked-sync'));
        setToast(`${name} is unblocked`);
        setTimeout(() => setToast(null), 2500);
      } catch (err) {
        console.error("Failed to unblock:", err);
      }
    } else {
      // Pop up report/block prompt!
      setBlockPromptUser(name);
    }
  };

  const handleConfirmAndBlock = async (name: string, report: boolean) => {
    try {
      await api.blockUser(name);
      if (report) {
        await api.reportItem({ reportedItemId: name, reportedItemType: 'user', reason: 'Blocked' });
      }

      setBlockedUsers(prev => {
        const updated = [...prev, name];
        scopedStorage.setItem('booran_blocked_users', JSON.stringify(updated));
        return updated;
      });

      // Notify other views instantly
      window.dispatchEvent(new Event('booran-blocked-sync'));

      // 1. Disconnect safely
      const isConnected = connectionList.some(c =>
        c.toLowerCase() === name.toLowerCase() ||
        c.toLowerCase() === `@${name.toLowerCase().replace(/\s+/g, '_')}`.toLowerCase()
      );
      if (isConnected && onToggleConnection) {
        onToggleConnection(name);
      }

      // 2. Clear current chat context
      if (activeChatUser && activeChatUser.name.toLowerCase() === name.toLowerCase()) {
        setActiveChatUser(null);
      }

      setBlockPromptUser(null);
      if (report) {
        setToast(`Report received successfully. ${name} is blocked.`);
      } else {
        setToast(`${name} is blocked`);
      }
      setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.error("Error in handleConfirmAndBlock:", error);
      setToast("Failed to block user.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Active chat state for selected user
  const [activeChatUser, setActiveChatUser] = useState<any | null>(null);

  useEffect(() => {
    if (activeChatUser) {
      // Clear notifications red dot when entering any active chat thread
      scopedStorage.setItem('booran_has_new_msg', 'false');
      window.dispatchEvent(new Event('booran-msg-notif-sync'));
    }
  }, [activeChatUser]);

  const [messages, setMessages] = useState<{ 
    id: string; 
    sender: 'me' | 'them'; 
    text: string; 
    time: string; 
    type?: 'text' | 'image' | 'video' | 'audio'; 
    mediaUrl?: string; 
  }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGalleryPopupOpen, setIsGalleryPopupOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [deletePrompt, setDeletePrompt] = useState<string | null>(null);
  const [mediaMenu, setMediaMenu] = useState<string | null>(null);
  const [mediaFlashPermission, setMediaFlashPermission] = useState<string | null>(null);

  const {
    uploadProgress,
    uploadVoiceMessage,
  } = useVoiceUploader(
    (metadata) => {
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === metadata.messageId 
            ? { ...msg, mediaUrl: metadata.audioUrl, isPending: false, status: 'sent', fileSize: metadata.fileSize } 
            : msg
        );
        if (activeChatUser) {
          setChatHistories(hist => ({
            ...hist,
            [activeChatUser.id]: updated
          }));
        }
        return updated;
      });
      setToast("Voice message sent!");
      setTimeout(() => setToast(null), 2500);
    },
    (messageId, error) => {
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'failed' } 
            : msg
        );
        if (activeChatUser) {
          setChatHistories(hist => ({
            ...hist,
            [activeChatUser.id]: updated
          }));
        }
        return updated;
      });
      setToast(error || "Upload failed.");
      setTimeout(() => setToast(null), 3000);
    }
  );

  const {
    isRecording: isRecordingMic,
    isPaused: isRecordingPaused,
    recordingTime: micTimer,
    permissionError,
    startRecording: startMic,
    pauseRecording,
    resumeRecording,
    stopRecording: stopMic,
    cancelRecording
  } = useVoiceRecorder(async (blob, duration) => {
    if (!activeChatUser) return;
    const localBlobUrl = URL.createObjectURL(blob);
    
    // Start upload and get the local message ID immediately
    const msgId = "vm_" + Date.now();
    uploadVoiceMessage(blob, duration, "me", activeChatUser.id, msgId);
    
    const voiceMsg = {
      id: msgId,
      sender: 'me' as const,
      type: 'audio' as const,
      mediaUrl: localBlobUrl,
      duration,
      fileSize: blob.size,
      isPending: true,
      status: 'pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };
    
    setMessages(prev => {
      const updated = [...prev, voiceMsg];
      setChatHistories(hist => ({
        ...hist,
        [activeChatUser.id]: updated
      }));
      return updated;
    });

    // Simulated standard text reply
    setTimeout(() => {
      const replyMsg = {
        id: `media-reply-${Date.now()}`,
        sender: 'user' as const,
        type: 'text' as const,
        text: "🎙️ Thanks for the high-fidelity recording!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };
      setMessages(prev => {
        const updated = [...prev, replyMsg];
        setChatHistories(hist => ({
          ...hist,
          [activeChatUser.id]: updated
        }));
        return updated;
      });
    }, 1200);
  });

  // Handle toast permission errors automatically
  useEffect(() => {
    if (permissionError) {
      setToast(permissionError);
      setTimeout(() => setToast(null), 3000);
    }
  }, [permissionError]);

  // Conference Calling State (Supports up to 15 members max)
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video' | null>(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideoOff, setIsCallVideoOff] = useState(false);
  const [isCallSpeakerOn, setIsCallSpeakerOn] = useState(true);
  const [callMembers, setCallMembers] = useState<any[]>([]);
  const [isGroupCall, setIsGroupCall] = useState(false);

  // Predefined participant pool for simulating conference growth up to 15 members
  const conferencePool = [
    { id: 'c1', name: 'Suhas Paul', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c2', name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c3', name: 'Alice Walker', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c4', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c5', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c6', name: 'Sarah Wu', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c7', name: 'Carlos Gomez', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c8', name: 'Nisha Patil', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c9', name: 'Marcus Aurelius', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c10', name: 'Zoe Kravitz', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c11', name: 'Liam Neeson', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c12', name: 'Sasha Grey', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c13', name: 'Yuki Tanaka', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c14', name: 'Omar Sy', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=120&h=120&q=80' },
    { id: 'c15', name: 'Clara Oswald', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=80' },
  ];

  // Starts call and handles initial group initialization for up to 15 members
  const startConferenceCall = (type: 'audio' | 'video') => {
    setActiveCallType(type);
    setIsCallMuted(false);
    setIsCallVideoOff(false);
    
    const isGroup = activeChatUser?.isGroup ? true : false;
    setIsGroupCall(isGroup);

    // Add you and the current contact
    const initialList = [
      { id: 'me', name: username + ' (You)', isMe: true, isSpeaking: false, isMuted: false, avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=120&h=120&q=80' },
    ];

    if (activeChatUser) {
      initialList.push({
        id: activeChatUser.id || 'chat-partner',
        name: activeChatUser.name,
        isMe: false,
        isSpeaking: true,
        isMuted: false,
        avatar: activeChatUser.avatar,
      });
    }

    // Only seed 2 more random conference members to make it lively initially if it's a structural group chat
    if (isGroup) {
      const activeIds = initialList.map(m => m.id);
      let count = 0;
      for (const item of conferencePool) {
        if (count < 2 && !activeIds.includes(item.id) && item.name !== activeChatUser?.name) {
          initialList.push({
            id: item.id,
            name: item.name,
            isMe: false,
            isSpeaking: Math.random() > 0.5,
            isMuted: false,
            avatar: item.avatar,
          });
          count++;
        }
      }
    }
    
    setCallMembers(initialList);
    showCallNotification(`Connected to encrypted secure ${type} conference.`);
  };

  const showCallNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddConferenceMember = () => {
    if (callMembers.length >= 15) {
      showCallNotification("⚠️ limit of 15 members reached in this conference!");
      return;
    }

    // Pick a candidate who is not currently in the call
    const currentMemberIds = callMembers.map(m => m.id);
    const candidate = conferencePool.find(c => !currentMemberIds.includes(c.id));
    if (candidate) {
      const newMember = {
        id: candidate.id,
        name: candidate.name,
        isMe: false,
        isSpeaking: false,
        isMuted: false,
        avatar: candidate.avatar,
      };
      setCallMembers(prev => [...prev, newMember]);
      showCallNotification(`👤 @${candidate.name.toLowerCase().replace(' ', '_')} joined the conference.`);
    } else {
      // Just in case we run out of candidate profiles, make a custom generated user
      const customId = `generated_${Date.now()}`;
      const rngIndex = Math.floor(Math.random() * 5);
      const customAv = presets[rngIndex];
      const newMember = {
        id: customId,
        name: `Operator ${callMembers.length + 1}`,
        isMe: false,
        isSpeaking: false,
        isMuted: false,
        avatar: customAv
      };
      setCallMembers(prev => [...prev, newMember]);
    }
  };

  const handleKickCallMember = (id: string) => {
    const memberName = callMembers.find(m => m.id === id)?.name;
    setCallMembers(prev => prev.filter(m => m.id !== id));
    if (memberName) {
      showCallNotification(`🚪 ${memberName} left the conference.`);
    }
  };

  // Periodic speaking simulator for other users in the call
  useEffect(() => {
    if (!activeCallType) return;
    const interval = setInterval(() => {
      setCallMembers(prev => prev.map(member => {
        if (member.isMe) return member;
        return {
          ...member,
          isSpeaking: !member.isMuted && Math.random() > 0.65
        };
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, [activeCallType]);

  // Conversation history memory keyed by userId
  const [chatHistories, setChatHistories] = useState<Record<string, {
    id: string; 
    sender: 'me' | 'them'; 
    text: string; 
    time: string; 
    type?: 'text' | 'image' | 'video' | 'audio'; 
    mediaUrl?: string; 
  }[]>>(() => {
    try {
      const saved = scopedStorage.getItem('booran_explore_chat_histories');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const cleaned: Record<string, any[]> = {};
        for (const key in parsed) {
          cleaned[key] = parsed[key].filter((m: any) => !m.createdAt || now - m.createdAt < 24 * 60 * 60 * 1000);
        }
        return cleaned;
      }
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      scopedStorage.setItem('booran_explore_chat_histories', JSON.stringify(chatHistories));
      window.dispatchEvent(new CustomEvent('dm_message_sent'));
    } catch (e) {
      console.warn("Storage quota exceeded. Not saving history.");
    }
  }, [chatHistories]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = scopedStorage.getItem('booran_explore_chat_histories');
        if (saved) {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const cleaned: Record<string, any[]> = {};
          for (const key in parsed) {
            cleaned[key] = parsed[key].filter((m: any) => !m.createdAt || now - m.createdAt < 24 * 60 * 60 * 1000);
          }
          
          setChatHistories(prev => {
            const prevStr = JSON.stringify(prev);
            const cleanedStr = JSON.stringify(cleaned);
            if (prevStr === cleanedStr) {
              return prev;
            }
            return cleaned;
          });

          if (activeChatUser) {
            const userKey = activeChatUser.id;
            if (cleaned[userKey]) {
              setMessages(prev => {
                const prevStr = JSON.stringify(prev);
                const cleanedStr = JSON.stringify(cleaned[userKey]);
                if (prevStr === cleanedStr) {
                  return prev;
                }
                return cleaned[userKey];
              });
            }
          }
        }
      } catch (e) {}
    };
    window.addEventListener('dm_message_sent', handleSync);
    return () => window.removeEventListener('dm_message_sent', handleSync);
  }, [activeChatUser]);
  
  // Ref for auto scrolling to bottom of chat
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraType, setCameraType] = useState<'user' | 'environment'>('user');
  const [cameraTimer, setCameraTimer] = useState(0);
  const [isUsingMockCamera, setIsUsingMockCamera] = useState(false);
  const [simulatedPulse, setSimulatedPulse] = useState(true);
  
  // Custom camera & mic permission states
  const [cameraPermissionConfirmedThisSession, setCameraPermissionConfirmedThisSession] = useState(false);
  const [micPermissionConfirmedThisSession, setMicPermissionConfirmedThisSession] = useState(false);
  const [showDirectCameraPermissionModal, setShowDirectCameraPermissionModal] = useState(false);
  const [showDirectMicPermissionModal, setShowDirectMicPermissionModal] = useState(false);
  const [pendingCameraTargetType, setPendingCameraTargetType] = useState<'user' | 'environment' | undefined>(undefined);
  
  // Custom interactive dropdown and permission requests
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);


  // Custom interactive group creation state
  const [isGroupSelectionMode, setIsGroupSelectionMode] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  // Fresh message notifications status indicator
  const [hasNotifications, setHasNotifications] = useState<boolean>(() => {
    return scopedStorage.getItem('booran_has_new_msg') === 'true';
  });

  const [pendingConnections, setPendingConnections] = useState<
    {
      id: string;
      name: string;
      avatar: string;
      info: string;
      requested: boolean;
    }[]
  >(() => {
    const saved = scopedStorage.getItem("booran_pending_connections");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: "alpha_echo",
        name: "Alpha Echo",
        avatar: getHumanAvatar("alpha_echo"),
        info: "Linked with your Booran ID interest",
        requested: true,
      },
      {
        id: "booran_prime",
        name: "Booran Prime",
        avatar: getHumanAvatar("booran_prime"),
        info: "Recommended based on AI Resolution engine",
        requested: true,
      },
      {
        id: "shopi_patron",
        name: "Shopi Patron",
        avatar: getHumanAvatar("shopi_patron"),
        info: "Member of Ambient Beat community",
        requested: true,
      },
      {
        id: "sponsor_one",
        name: "sponsor_one",
        avatar: getHumanAvatar("sponsor_one"),
        info: "Connected through sponsored stream",
        requested: true,
      },
    ];
  });

  const [activityNotificationsCount, setActivityNotificationsCount] =
    useState<number>(() => {
      let count = 0;
      try {
        const savedExplore = scopedStorage.getItem(
          "booran_explore_chat_histories",
        );
        if (savedExplore) {
          const parsed = JSON.parse(savedExplore);
          // Simplified metric based on keys presence to act as 'activity'
          count += Object.keys(parsed).length;
        }
      } catch (e) {
        // ignore
      }
      return Math.min(count, 20);
    });

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
    // Whenever this panel renders, if notifications exist, clear the global red dot for the bell.
    if (totalRawNotifications !== seenNotificationsCount) {
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

  // Track which users/groups have unread messages/notifications
  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  
  useEffect(() => {
    scopedStorage.setItem('booran_unread_senders', '[]');
  }, []);

  useEffect(() => {
    scopedStorage.setItem('booran_unread_senders', JSON.stringify(unreadSenders));
  }, [unreadSenders]);

  const markSenderAsRead = (name: string) => {
    const cleanName = name.toLowerCase().trim();
    setUnreadSenders(prev => {
      const next = prev.filter(u => {
        const itemLower = u.toLowerCase().trim();
        return itemLower !== cleanName && 
               itemLower !== `@${cleanName}` && 
               itemLower !== cleanName.replace(/\s+/g, '_');
      });
      if (next.length === 0) {
        scopedStorage.setItem('booran_has_new_msg', 'false');
        window.dispatchEvent(new Event('booran-msg-notif-sync'));
      }
      return next;
    });
  };

  useEffect(() => {
    const syncNotifs = () => {
      setHasNotifications(scopedStorage.getItem('booran_has_new_msg') === 'true');
    };
    window.addEventListener('booran-msg-notif-sync', syncNotifs);
    return () => window.removeEventListener('booran-msg-notif-sync', syncNotifs);
  }, []);


  const handleDeleteGroupPermanently = (groupId: string) => {
    setGroups(prev => {
      const next = prev.filter(g => g.id !== groupId);
      scopedStorage.setItem('booran_groups', JSON.stringify(next));
      return next;
    });
    setActiveChatUser(null);
    setToast("Group permanently deleted by admin");
    setTimeout(() => setToast(null), 2500);
  };

  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [memberIdToRemove, setMemberIdToRemove] = useState<string | null>(null);
  const [customGroupName, setCustomGroupName] = useState("Booran Unified Grid");
  
  const presets = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=120&h=120&q=80',
  ];

  const [customGroupAvatar, setCustomGroupAvatar] = useState(presets[0]);
  
  // Local state for all groups
  const [groups, setGroups] = useState<any[]>(() => {
    const saved = scopedStorage.getItem('booran_groups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'group_all',
        name: 'Booran Unified Grid',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=120&h=120&q=80',
        adminId: 'system',
        members: [
          { id: '1', name: connectionList[0] || 'User', avatar: getUserAvatar(connectionList[0] || 'User'), status: 'accepted' },
          { id: '2', name: 'Diana Prince', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80', status: 'accepted' },
          { id: '3', name: 'Vikram Sen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80', status: 'accepted' },
          { id: '4', name: 'Lars Ulrich', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80', status: 'accepted' },
          { id: '5', name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80', status: 'accepted' },
        ],
        isGroup: true
      }
    ];
  });

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [addMembersSelectedIds, setAddMembersSelectedIds] = useState<string[]>([]);
  const [showAdminConnectionsModal, setShowAdminConnectionsModal] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<'connections' | 'suggestions'>('connections');

  // Push updates to localStorage
  useEffect(() => {
    scopedStorage.setItem('booran_groups', JSON.stringify(groups));
  }, [groups]);

  const cameraVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const videoChunksRef = React.useRef<Blob[]>([]);



  // Users listing with initial list
  const baseMockUsersRaw = connectionList.map((c, i) => ({
    id: String(i),
    name: c,
    selected: false,
    redDot: i === 0,
    avatar: getUserAvatar(c)
  }));

  const mockUsersRaw = [...baseMockUsersRaw];
  
  // Inject pending accepts (Connects array from the system)
  pendingAccepts.forEach((p: any) => {
    if (!mockUsersRaw.some(u => u.name.toLowerCase() === p.name.toLowerCase())) {
      mockUsersRaw.push({
        id: p.id || `pending_${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: p.name,
        selected: false,
        redDot: false,
        avatar: p.avatar || getUserAvatar(p.name)
      });
    }
  });

  // Inject registered users from booran_users
  try {
    const rawUsers = scopedStorage.getItem('booran_users');
    if (rawUsers) {
      const usersList = JSON.parse(rawUsers);
      usersList.forEach((ru: any) => {
        if (!mockUsersRaw.some(u => u.name.toLowerCase() === ru.username.toLowerCase())) {
          mockUsersRaw.push({
            id: `reg_${ru.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: ru.username,
            selected: false,
            redDot: false,
            avatar: getUserAvatar(ru.username)
          });
        }
      });
    }
  } catch(e) {}

  // Add missing connections to mockUsersRaw as demo users
  connectionList.forEach((connName, idx) => {
    if (!mockUsersRaw.some(u => {
      const n = u.name.toLowerCase();
      const h = `@${n.replace(/\s+/g, '_')}`;
      const c = connName.toLowerCase();
      const cleanN = n.replace(/^@+/, '');
      const cleanC = c.replace(/^@+/, '');
      return cleanN === cleanC || h === c || n === c;
    })) {
      mockUsersRaw.push({
        id: `con_${connName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: connName,
        selected: false,
        redDot: false,
        avatar: getHumanAvatar(String(connName))
      });
    }
  });

  const mockUsers = mockUsersRaw.filter(u => {
    const nameLower = u.name.toLowerCase();
    const handleLower = `@${u.name.toLowerCase().replace(/\s+/g, '_')}`;
    const fontFriendlyLower = `@${u.name.toLowerCase().replace(' ', '_')}`;
    return !deletedUsers.includes(nameLower) && 
           !deletedUsers.includes(handleLower) && 
           !deletedUsers.includes(fontFriendlyLower);
  });

  // Prevent scrolling of outer system viewport when chat is active
  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (!mainContainer) return;

    let intervalId: any = null;

    if (activeChatUser) {
      mainContainer.classList.add('!overflow-hidden');
      
      const resetScroll = () => {
        if (mainContainer) {
          mainContainer.scrollTop = 0;
        }
      };

      // Reset immediately
      resetScroll();
      
      // Reset over multiple animation frames & timeouts
      requestAnimationFrame(resetScroll);
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 150);
      setTimeout(resetScroll, 300);

      // Periodic check interval (sledgehammer) while the chat interface is open
      intervalId = setInterval(resetScroll, 100);
    } else {
      mainContainer.classList.remove('!overflow-hidden');
    }

    return () => {
      if (mainContainer) {
        mainContainer.classList.remove('!overflow-hidden');
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeChatUser]);

  // Auto-scroll when messages update without window jumping
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      
      const timer = setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });
      }, 50);
      return () => clearTimeout(timer);
    } else if (messagesEndRef.current) {
      // Fallback with preventScroll if scrollIntoView is used
      messagesEndRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [messages]);

  // Pulse animation for the mock screen
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setSimulatedPulse(p => !p);
    }, 1200);
    return () => clearInterval(pulseInterval);
  }, []);

  const handleUserClick = (user: any) => {
    setActiveChatUser(user);
    markSenderAsRead(user.name);
    const userSlug = `@${user.name.toLowerCase().replace(' ', '_')}`;
    
    if (chatHistories[user.id]) {
      setMessages(chatHistories[user.id]);
    } else {
      let customGreeting = `System status: Standing by for active-link query key.`;
      if (user.name === 'Zack Holmes') {
        customGreeting = `Secure channel ready. How's the workspace latency?`;
      } else if (user.name === 'Diana Prince') {
        customGreeting = `Handshake complete. All secure links initialized.`;
      } else if (user.name === 'Vikram Sen') {
        customGreeting = `Broadcast incoming. Standing by for package validation.`;
      } else if (user.name === 'Sarah Connor') {
        customGreeting = `Warning: Keep this stream ephemeral. No logs saved.`;
      } else if (user.name === 'Lars Ulrich') {
        customGreeting = `Link established. I can sync audio stream directly.`;
      }

      const initialMsgs = [
        { id: '1', sender: 'them' as const, text: `Handshake secure channel established with ${userSlug}`, time: 'Just now' },
        { id: '2', sender: 'them' as const, text: customGreeting, time: 'Just now' }
      ];

      setChatHistories(prev => ({
        ...prev,
        [user.id]: initialMsgs
      }));
      setMessages(initialMsgs);
    }
  };

  const handleGroupClick = (group: any) => {
    setActiveChatUser(group);
    markSenderAsRead(group.name);
    
    if (chatHistories[group.id]) {
      setMessages(chatHistories[group.id]);
    } else {
      const initialMsgs = [
        { 
          id: `g-init-${Date.now()}`, 
          sender: 'them' as const, 
          senderName: 'system', 
          text: `Handshake network active in channel: "${group.name}".`, 
          time: 'Just now' 
        }
      ];
      
      // If the admin is "me", append details about invitations
      if (group.adminId === 'me') {
        initialMsgs.push({
          id: `g-admin-${Date.now()}`,
          sender: 'them' as const,
          senderName: 'system',
          text: `🔐 Created by you (@${username.replace(/\s+/g, '_').toLowerCase()}) as Admin. All invite transmissions dispatched.`,
          time: 'Just now'
        });
        
        group.members.forEach((m: any) => {
          if (m.id !== 'me') {
            initialMsgs.push({
              id: `g-log-${m.id}-${Date.now()}`,
              sender: 'them' as const,
              senderName: 'system',
              text: `Invitation pending for key @${m.name.toLowerCase().replace(' ', '_')}... (Waiting for Accept/Refuse)`,
              time: 'Just now'
            });
          }
        });
      }

      setChatHistories(prev => ({
        ...prev,
        [group.id]: initialMsgs
      }));
      setMessages(initialMsgs);
    }
  };

  // REAL-TIME GROUPS FROM BACKEND
  useEffect(() => {
    if (username === "User") return;

    const fetchGroups = async () => {
      try {
        const data = await api.getGroups();
        setGroups(data.map((g: any) => ({ ...g, id: g._id })));
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };

    fetchGroups();

    socket.on('group-invite', () => {
      fetchGroups();
    });

    return () => {
      socket.off('group-invite');
    };
  }, [username]);

  const handleLaunchCustomGroupChat = async () => {
    const selectedMembers = mockUsers.filter(u => selectedGroupMemberIds.includes(u.id));
    if (selectedMembers.length === 0) {
      setToast("Select at least 1 member for the conversation");
      setTimeout(() => setToast(null), 1500);
      return;
    }

    const memberNames = selectedMembers.map(m => m.name);

    try {
      const groupData = {
        name: customGroupName || 'Booran Collaboration Grid',
        avatar: customGroupAvatar,
        members: memberNames
      };

      const group = await api.createGroup(groupData);

      setActiveChatUser({
        id: group._id,
        name: group.name,
        avatar: customGroupAvatar,
        isGroup: true
      });
      setShowGroupCreator(false);
      setMessages([]);
      setToast("Collaboration grid active!");

      // Reset selection state
      setIsGroupSelectionMode(false);
      setSelectedGroupMemberIds([]);
      setShowCreateGroupDialog(false);

      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error("Error creating group:", e);
      setToast("Network error creating group.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleAddNewPeopleToGroup = () => {
    if (!activeChatUser || addMembersSelectedIds.length === 0) return;
    
    const usersToAdd = mockUsers.filter(u => addMembersSelectedIds.includes(u.id));
    const addedMembersObj = usersToAdd.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      status: 'accepted'
    }));

    const updatedGroups = groups.map(g => {
      if (g.id === activeChatUser.id) {
        return {
          ...g,
          members: [...g.members, ...addedMembersObj]
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    const freshGroup = updatedGroups.find(g => g.id === activeChatUser.id);
    if (freshGroup) {
      setActiveChatUser(freshGroup);
    }

    // append notice to chat
    const addMsgs = usersToAdd.map(u => ({
      id: `g-add-log-${u.id}-${Date.now()}`,
      sender: 'them' as const,
      senderName: 'system',
      text: `@${username.replace(/\s+/g, '_').toLowerCase()} directly added @${u.name.toLowerCase().replace(' ', '_')} to this collaboration.`,
      time: 'Just now'
    }));

    setMessages(prev => {
      const updated = [...prev, ...addMsgs];
      setChatHistories(hist => ({ ...hist, [activeChatUser.id]: updated }));
      return updated;
    });

    setShowAddMembersModal(false);
    setAddMembersSelectedIds([]);
    setToast(`Added ${usersToAdd.length} user(s) directly to group!`);
    setTimeout(() => setToast(null), 2000);
  };

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check connection state of currently open chat user
  const checkIsConnected = () => {
    if (!activeChatUser) return false;
    const cleanActiveName = activeChatUser.name.toLowerCase().replace(/^@+/, "");
    return connectionList.some(c => {
      const cleanC = c.toLowerCase().replace(/^@+/, "");
      return cleanC === cleanActiveName;
    });
  };

  const handleSendConnectionRequest = async (name: string) => {
    if (username === "User") return;
    const cleanName = name.replace(/^@+/, "");

    try {
      await api.requestConnection(cleanName);
      setToast(`Connection request sent to ${name}!`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Failed to add connection:", err);
      setToast("Failed to connect.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleAcceptHandshake = (name: string) => {
    const nameLower = name.toLowerCase();
    setPendingAccepts(prev => prev.filter(p => p.name.toLowerCase() !== nameLower));

    // Remove from permanently deleted users so they pop up back on the messages panel
    try {
      const storedDel = scopedStorage.getItem('booran_permanently_deleted_users');
      let currentDeleted: string[] = storedDel ? JSON.parse(storedDel) : [];
      
      const uObj = mockUsersRaw.find(u => u.name.toLowerCase() === nameLower);
      const handleName = uObj ? `@${uObj.name.toLowerCase().replace(/\s+/g, '_')}` : '';
      const fontFriendly = uObj ? `@${uObj.name.toLowerCase().replace(' ', '_')}` : '';

      currentDeleted = currentDeleted.filter(d => 
        d !== nameLower && 
        d !== handleName.toLowerCase() && 
        d !== fontFriendly.toLowerCase()
      );
      scopedStorage.setItem('booran_permanently_deleted_users', JSON.stringify(currentDeleted));
      setDeletedUsers(currentDeleted);
      window.dispatchEvent(new Event('booran-blocked-sync'));
    } catch (_) {}

    if (onAddConnection) {
      onAddConnection(name);
    }
    setToast(`Handshake Accepted: ${name} accepted your communication invitation!`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleChatConnection = () => {
    if (!activeChatUser) return;
    const isConnected = checkIsConnected();
    if (isConnected) {
      if (onToggleConnection) {
        onToggleConnection(activeChatUser.name);
      }
      setToast(`Disconnected from ${activeChatUser.name}`);
      setTimeout(() => setToast(null), 2500);
    } else {
      const hasPending = pendingAccepts.some(p => p.name.toLowerCase() === activeChatUser.name.toLowerCase());
      const hasSent = sentRequests.some(p => p.name.toLowerCase() === activeChatUser.name.toLowerCase());
      if (hasPending) {
        handleAcceptHandshake(activeChatUser.name);
      } else if (hasSent) {
        setSentRequests(prev => prev.filter(p => p.name.toLowerCase() !== activeChatUser.name.toLowerCase()));
        setToast('Connection request cancelled.');
        setTimeout(() => setToast(null), 1500);
      } else {
        handleSendConnectionRequest(activeChatUser.name);
      }
    }
  };

  // REAL-TIME MESSAGES FOR ACTIVE CHAT
  useEffect(() => {
    if (!activeChatUser || username === "User") return;

    const fetchMessages = async () => {
      try {
        const data = await api.getMessages(activeChatUser.isGroup ? `group_${activeChatUser.id}` : activeChatUser.name);
        const formatted = data.map((m: any) => ({
          id: m._id,
          sender: m.senderUsername === username ? 'me' : 'them',
          text: m.text,
          type: m.isVoice ? 'audio' : (m.mediaUrl ? 'media' : 'text'),
          mediaUrl: m.mediaUrl,
          duration: m.duration,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formatted);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();

    socket.on('message-receive', (msg) => {
      const isTarget = activeChatUser.isGroup
        ? msg.groupId === activeChatUser.id
        : (msg.senderUsername === activeChatUser.name && msg.receiverUsername === username) || (msg.senderUsername === username && msg.receiverUsername === activeChatUser.name);

      if (isTarget) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg._id)) return prev;
          return [...prev, {
            id: msg._id,
            sender: msg.senderUsername === username ? 'me' : 'them',
            text: msg.text,
            type: msg.isVoice ? 'audio' : (msg.mediaUrl ? 'media' : 'text'),
            mediaUrl: msg.mediaUrl,
            duration: msg.duration,
            time: 'Just now'
          }];
        });
      }
    });

    return () => {
      socket.off('message-receive');
    };
  }, [activeChatUser, username]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChatUser) return;

    try {
      await api.sendMessage({
        receiverUsername: activeChatUser.isGroup ? null : activeChatUser.name,
        groupId: activeChatUser.isGroup ? activeChatUser.id : null,
        text: inputText.trim(),
        isVoice: false
      });
      setInputText('');
    } catch (err) {
      console.error("Failed to send message:", err);
      setToast("Failed to send message.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Delete message handler
  const handleDeleteMessage = (forBoth: boolean) => {
    if (!deletePrompt) return;
    const msgId = deletePrompt;

    setMessages(prev => {
      const updated = prev.filter(msg => msg.id !== msgId);
      if (activeChatUser) {
        setChatHistories(hist => ({
          ...hist,
          [activeChatUser.id]: updated
        }));
      }
      return updated;
    });
    setDeletePrompt(null);
    setToast(forBoth ? "Message deleted for everyone" : "Message deleted for you");
    setTimeout(() => setToast(null), 1500);
  };

  // ==========================================
  // DIRECT CAMERA VIEWPORT LOGIC (NO GALLERY SAVE)
  // ==========================================
  const startCamera = async (overrideType?: 'user' | 'environment') => {
    setIsCameraActive(true);
    setCameraTimer(0);
    setIsUsingMockCamera(true);
    setCameraStream(null);
  };

  const stopCamera = () => {
    setCameraPermissionConfirmedThisSession(true); // Keep session pre-approved
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsRecordingVideo(false);
    setIsUsingMockCamera(false);
    setCameraTimer(0);
  };

  const flipCamera = () => {
    const nextType = cameraType === 'user' ? 'environment' : 'user';
    setCameraType(nextType);
    setTimeout(() => {
      startCamera(nextType);
    }, 50);
  };

  useEffect(() => {
    let interval: any;
    if (isRecordingVideo) {
      interval = setInterval(() => {
        setCameraTimer(p => p + 1);
      }, 1000);
    } else {
      setCameraTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVideo]);

  const handleCameraCapture = () => {
    if (cameraMode === 'photo') {
      // Photo Captured - Send Directly
      if (cameraStream && cameraVideoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = cameraVideoRef.current.videoWidth || 640;
        canvas.height = cameraVideoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(cameraVideoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          sendBlobToChat('image', dataUrl);
        }
      } else {
        // Fallback mockup photo representing direct capture
        sendBlobToChat('image', 'mockup-photo');
      }
      setToast("Awaiting secure handshake permission below...");
      setTimeout(() => setToast(null), 2500);
      stopCamera();
    } else {
      // Video mode
      if (!isRecordingVideo) {
        // Start recording
        videoChunksRef.current = [];
        if (cameraStream) {
          try {
            const recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) videoChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
              const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
              const reader = new FileReader();
              reader.onload = (event) => {
                const url = event.target?.result as string;
                sendBlobToChat('video', url);
              };
              reader.readAsDataURL(blob);
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
          } catch (e) {
            console.warn(e);
          }
        }
        setIsRecordingVideo(true);
        setToast("Recording video...");
        setTimeout(() => setToast(null), 1500);
      } else {
        // Stop recording and send
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        } else {
          sendBlobToChat('video', 'mockup-video');
        }
        setIsRecordingVideo(false);
        setToast("Awaiting secure handshake permission below...");
        setTimeout(() => setToast(null), 2500);
        stopCamera();
      }
    }
  };



  const executeSendBlob = async (type: 'image' | 'video' | 'audio', url: string) => {
    if (!activeChatUser) return;

    try {
      await api.sendMessage({
        receiverUsername: activeChatUser.isGroup ? null : activeChatUser.name,
        groupId: activeChatUser.isGroup ? activeChatUser.id : null,
        text: type === 'image' ? "📷 Photo Send" : type === 'video' ? "📹 Video Send" : "🎙️ Voice message",
        mediaUrl: url,
        isVoice: type === 'audio'
      });

      setToast(`${type === 'image' ? "📷 Photo" : type === 'video' ? "📹 Video" : "🎙️ Voice message"} authorized & posted!`);
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      console.error("Failed to send media message:", err);
      setToast("Failed to send media.");
    }
  };

  const sendBlobToChat = (type: 'image' | 'video' | 'audio', url: string) => {
    executeSendBlob(type, url);
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'auto'
        });
      }
    }, 150);
  };

  const isChatUserConnected = checkIsConnected();

  return (
    <div 
      id="exact-explore-mockup-panel" 
      className={`font-sans select-none relative flex flex-col ${glassmorphismActive ? 'bg-black/20 backdrop-blur-xl glass-glow text-white' : 'bg-transparent text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]'} ${
        activeChatUser 
          ? "w-full h-full absolute inset-0 overflow-hidden z-50 p-0 m-0" 
          : "w-full h-full absolute inset-0 overflow-hidden flex flex-col p-6 pb-24"
      }`}
    >
      
      {/* Toast Alert Feedback */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-neutral-900 border border-white/20 px-3.5 py-2 rounded-2xl text-[10px] font-mono text-center text-[#ff3366] shadow-xl max-w-xs animate-fade-in">
          {toast}
        </div>
      )}

      {/* Large Profile Picture Modal popup in the middle */}
      {previewAvatar && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/65 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in cursor-default"
          onClick={() => setPreviewAvatar(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-[#16161a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-5 select-none text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setPreviewAvatar(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Picture Frame */}
            <div className="w-60 h-60 rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-4.5 bg-neutral-950 flex items-center justify-center">
              <img 
                src={previewAvatar.avatar || getUserAvatar(previewAvatar.name)} 
                alt={previewAvatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Profile Details */}
            <h3 className="text-base font-bold text-white tracking-wide font-sans antialiased text-center">
              {previewAvatar.name}
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1 text-center">
              {previewAvatar.name.toLowerCase().replace(/\s+/g, '_')}
            </p>

            {/* Quick Action buttons */}
            <div className="mt-5 flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  if (onToggleConnection) {
                    onToggleConnection(previewAvatar.name);
                  }
                  const isConnNow = true;
                  setToast(isConnNow ? `Disconnected from ${previewAvatar.name}` : `Connected with ${previewAvatar.name}!`);
                  setTimeout(() => setToast(null), 2500);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center gap-2 border shadow-sm ${
                  true
                    ? 'bg-[#0070f3]/20 text-[#0070f3] border-[#0070f3]/30 hover:bg-[#0070f3]/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {true ? (
                  <>
                    <Link2 className="w-3.5 h-3.5 rotate-45 shrink-0" />
                    Connected (Known)
                  </>
                ) : (
                  <>
                    <Link2Off className="w-3.5 h-3.5 rotate-45 shrink-0" />
                    Disconnected (Unknown)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleBlockUser(previewAvatar.name);
                  setPreviewAvatar(null);
                }}
                className="px-4.5 py-2 bg-neutral-900 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 border border-white/5 rounded-full text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer"
              >
                {blockedUsers.includes(previewAvatar.name) ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block and Report Prompt Modal */}
      {blockPromptUser && (
        <div 
          className="fixed inset-0 z-[1010] bg-black/30 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in cursor-default select-none"
          onClick={() => setBlockPromptUser(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-[#16161a] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-wide font-sans antialiased">
                Report & Block User?
              </h3>
              <p className="text-xs text-neutral-400">
                Do you want to file an abuse report for <span className="text-red-400 font-bold font-mono">@{blockPromptUser}</span> before restricting communications?
              </p>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleConfirmAndBlock(blockPromptUser, true)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow"
              >
                Report & Block User
              </button>
              
              <button
                type="button"
                onClick={() => handleConfirmAndBlock(blockPromptUser, false)}
                className="w-full py-2.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-200 font-sans text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Block Only
              </button>

              <button
                type="button"
                onClick={() => setBlockPromptUser(null)}
                className="w-full py-2 bg-transparent text-neutral-500 hover:text-neutral-300 font-sans text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connections & Suggestions Modal */}
      {showAdminConnectionsModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-md z-[202] flex items-center justify-center p-6 animate-fade-in text-white select-none">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4 text-left">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#F52C68] block">Group Connections & Suggestions</span>
                <span className="text-[9px] text-neutral-400 font-semibold lowercase">Admin Direct Lookup Protocol</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowAdminConnectionsModal(false)} 
                className="p-1 text-neutral-400 hover:text-white cursor-pointer active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs for Connections and Suggestions */}
            <div className="flex border-b border-white/5 mb-4 font-mono text-[9px] uppercase">
              <button
                type="button"
                onClick={() => setAdminModalTab('connections')}
                className={`flex-1 pb-2 font-bold text-center border-b-2 transition-all cursor-pointer ${
                  adminModalTab === 'connections' 
                    ? 'border-[#F52C68] text-white' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Connections ({connectionList.length + (activeChatUser?.members?.filter((m: any) => m.status === 'accepted').length || 0)})
              </button>
              <button
                type="button"
                onClick={() => setAdminModalTab('suggestions')}
                className={`flex-1 pb-2 font-bold text-center border-b-2 transition-all cursor-pointer ${
                  adminModalTab === 'suggestions' 
                    ? 'border-[#F52C68] text-white' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Suggestions ({mockUsers.length})
              </button>
            </div>

            {/* Tab content */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 text-left">
              {adminModalTab === 'connections' && (
                <div className="space-y-2">
                  {/* List active connections */}
                  {(() => {
                    const groupAccepted = activeChatUser?.members?.filter((m: any) => m.status === 'accepted').map((m: any) => m.name) || [];
                    
                    const uniqueConnectionsMap = new Map();
                    [...connectionList, ...groupAccepted].forEach(name => {
                       if(name && name !== username) {
                         const cleanName = name.toLowerCase().replace(/^@+/, '').replace(/\s+/g, '_');
                         if(!uniqueConnectionsMap.has(cleanName)) {
                            uniqueConnectionsMap.set(cleanName, name);
                         }
                       }
                    });
                    const mergedConnections = Array.from(uniqueConnectionsMap.values());

                    if (mergedConnections.length === 0) {
                      return (
                        <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                          No active connected secure endpoints detected.
                        </div>
                      );
                    }

                    return mergedConnections.map((name, idx) => {
                      const handle = `${name.toLowerCase().replace(/\s+/g, '_')}`;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-black/45 border border-white/5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-neutral-200">{name}</p>
                              <p className="text-[8px] text-[#F52C68] font-mono lowercase">handshake active &bull; secure</p>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold uppercase">
                            linked
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {adminModalTab === 'suggestions' && (
                <div className="space-y-2">
                  {mockUsers
                    .filter(user => !blockedUsers.some(b => b.toLowerCase() === user.name.toLowerCase()))
                    .map((user) => {
                      const handle = `${user.name.toLowerCase().replace(' ', '_')}`;
                      // We keep the old @handle logic for connection logic since it relies on it
                      const oldHandle = `@${user.name.toLowerCase().replace(' ', '_')}`;
                      const isConnected = connectionList.some(c => c.toLowerCase() === user.name.toLowerCase() || c.toLowerCase() === oldHandle.toLowerCase());
                      
                      return (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-xl bg-black/45 border border-white/5">
                          <div className="flex items-center space-x-2.5 text-left">
                            <img src={user.avatar || getUserAvatar(user.name)} className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-neutral-200 leading-tight">{user.name}</p>
                              <p className="text-[8.5px] text-zinc-500 font-mono lowercase leading-tight">{handle}</p>
                            </div>
                          </div>
                          <>
                            {isConnected && (
                               <span className="text-[9.5px] font-bold uppercase font-mono px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                 connected
                               </span>
                            )}
                          </>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <button
              onClick={() => setShowAdminConnectionsModal(false)}
              className="w-full mt-4 py-2 bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold uppercase font-mono text-[9px] rounded-xl cursor-pointer transition-colors"
            >
              Close Panel
            </button>

          </div>
        </div>
      )}

      {/* RENDER CHAT INTERFACE IF ACTIVE CHAT USER IS SELECTED */}
      {activeChatUser ? (
        <div className={`absolute inset-0 z-50 flex flex-col p-0 pb-3 text-white overflow-hidden animate-slide-up ${glassmorphismActive ? 'bg-black/30 backdrop-blur-xl glass-glow' : 'bg-transparent'}`}>
          <style>{`
            #navigation-dock-bar {
              display: none !important;
            }
          `}</style>
          {/* Header matches Image 2 top design */}
          <header className={`sticky top-0 z-30 border-b border-white/5 pt-3 pb-3 px-4 flex items-center justify-between select-none shrink-0 w-full mb-1 bg-transparent safe-area-top`}>
            <div className="flex items-center space-x-2.5">
              <button 
                type="button"
                onClick={() => {
                  setActiveChatUser(null);
                }}
                className="flex items-center space-x-1 p-2 -ml-2 rounded-xl hover:bg-neutral-900 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-semibold">Back</span>
              </button>

              {/* Avatar layout as seen in Image 2 */}
              <div 
                onClick={() => setPreviewAvatar({ 
                  name: activeChatUser.name, 
                  avatar: activeChatUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80' 
                })}
                className="w-9 h-9 rounded-xl bg-zinc-800 overflow-hidden shrink-0 shadow-md border border-white/10 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                title="Tap to view full size"
              >
                {activeChatUser.avatar ? (
                  <img 
                    src={activeChatUser.avatar} 
                    alt={activeChatUser.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-white text-sm font-black font-sans uppercase">
                    {activeChatUser.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Username "@handle" */}
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide lowercase truncate max-w-[150px]">
                  @{activeChatUser.name.toLowerCase().replace(/\s+/g, '_')}
                </h3>
              </div>
            </div>

            {/* Right side three dots block options */}
            <div className="flex items-center space-x-4 mr-1 text-white select-none">
              {/* Three dots options beside video call button */}
              <div className="relative flex items-center">
                <button 
                  type="button" 
                  onClick={() => setShowChatOptions(!showChatOptions)}
                  className="hover:opacity-80 active:scale-90 transition-all cursor-pointer p-1 rounded-full hover:bg-neutral-900 flex items-center justify-center shrink-0"
                  title="More Options"
                >
                  <MoreVertical className="w-5.2 h-5.2 stroke-[2]" />
                </button>
                
                {showChatOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowChatOptions(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#16161a] border border-white/10 rounded-2xl shadow-xl py-2 z-50 text-left">
                    {!activeChatUser.isGroup && (
                      <button
                        type="button"
                        onClick={() => {
                          handleBlockUser(activeChatUser.name);
                          setShowChatOptions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-500/10 text-red-400 hover:text-red-500 font-sans font-bold flex items-center justify-between"
                      >
                        <span>{blockedUsers.includes(activeChatUser.name) ? "Unblock user" : "Block user"}</span>
                        {blockedUsers.includes(activeChatUser.name) ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-neutral-500" />
                        )}
                      </button>
                    )}

                    {activeChatUser.isGroup && (
                      <>
                        <div className="border-t border-white/5">
                          <div className="px-4 py-2.5 text-[13px] text-zinc-100 font-sans font-medium">
                            Members
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatOptions(false);
                              setShowAddMembersModal(true);
                            }}
                            className="w-full text-left px-4 py-2 text-[13px] hover:bg-neutral-800 text-zinc-300 font-sans flex items-center justify-between cursor-pointer"
                          >
                            <span>Add New+</span>
                          </button>
                          
                          <div className="max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                            {activeChatUser.members?.map((member: any) => (
                              <div key={member.id} className="px-4 py-2 flex items-center justify-between group/item hover:bg-neutral-800/50">
                                <div className="flex items-center space-x-2">
                                  <img src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'} className="w-5 h-5 rounded-md" alt="" />
                                  <span className="text-[11px] text-zinc-400 font-medium">
                                    {member.name === 'me' ? 'me (Admin)' : member.name}
                                  </span>
                                </div>
                                {member.id !== 'me' && activeChatUser.adminId === 'me' && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updatedGroups = groups.map((g: any) => {
                                        if (g.id === activeChatUser.id) {
                                          return { ...g, members: g.members.filter((m: any) => m.id !== member.id) };
                                        }
                                        return g;
                                      });
                                      setGroups(updatedGroups);
                                      const fresh = updatedGroups.find((g: any) => g.id === activeChatUser.id);
                                      if (fresh) setActiveChatUser(fresh);
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-900/30 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    title="Remove user"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (activeChatUser) {
                          setChatHistories(prev => ({
                            ...prev,
                            [activeChatUser.id]: []
                          }));
                          setMessages([]);
                          setToast("Chat cleared for you");
                          setTimeout(() => setToast(null), 2500);
                        }
                        setShowChatOptions(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-neutral-800 text-zinc-300 font-sans font-bold flex items-center justify-between border-t border-white/5`}
                    >
                      <span>Clear Chat</span>
                      <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {activeChatUser.isGroup && activeChatUser.adminId === 'me' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowChatOptions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-500/15 text-red-400 hover:text-red-500 font-sans font-bold flex items-center justify-between border-t border-white/5"
                      >
                        <span>Delete Group</span>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Delete Group Confirmation Modal */}
          {showDeleteConfirm && activeChatUser && (
            <div className="fixed inset-0 bg-black/55 z-[210] flex flex-col justify-center items-center p-5 animate-fade-in">
              <div className="text-center space-y-4 max-w-[240px]">
                <div className="w-12 h-12 rounded-full text-[#F52C68] flex items-center justify-center mx-auto border border-[#F52C68]/25 bg-red-500/10 shadow-[0_0_15px_rgba(245,44,104,0.3)]">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Delete Group?</h4>
                  <p className="text-[10.5px] text-neutral-400 mt-2 leading-relaxed">
                    Are you sure you would like to permanently delete this group?
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] uppercase font-mono tracking-wider transition-colors active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteGroupPermanently(activeChatUser.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#F52C68] hover:bg-[#ff3b75] text-white font-bold text-[10px] uppercase font-mono tracking-wider shadow-[0_0_15px_rgba(245,44,104,0.4)] transition-all active:scale-95 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages board */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 space-y-3.5 px-4 flex flex-col scrollbar-thin scrollbar-thumb-neutral-800">
            {messages.filter(m => !m.createdAt || Date.now() - m.createdAt < 24 * 60 * 60 * 1000).map((msg) => {
              const isMe = msg.sender === 'me';

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[75%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  {/* Core Bubble with custom border-radius matching Image 2 */}
                  <div 
                    className={msg.type === 'audio' ? "group relative" : `group relative px-3 py-1.5 rounded-[16px] text-xs md:text-[13px] font-sans leading-normal shadow-sm ${
                      isMe 
                        ? 'bg-[#555555] text-white rounded-tr-none' 
                        : 'bg-blue-600 text-white rounded-tl-none'
                    }`}
                  >
                    {/* Delete individual message button */}
                    <button
                      type="button"
                      onClick={() => setDeletePrompt(msg.id)}
                      className="absolute -top-2 -right-2 bg-neutral-950 border border-white/20 text-neutral-400 hover:text-red-500 rounded-full p-1 shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Render content */}
                    {(!msg.type || msg.type === 'text') && <p className="break-words">{msg.text}</p>}

                    {/* Captured image display */}
                    {msg.type === 'image' && (
                      <div className="relative group/media inline-block">
                        {msg.mediaUrl === 'mockup-photo' ? (
                          <div className="w-56 h-56 bg-neutral-800 border border-white/20 rounded-xl flex items-center justify-center font-mono text-[9px] text-neutral-400">
                            Captured Image
                          </div>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setMediaMenu(mediaMenu === msg.id ? null : msg.id); }} 
                              className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-black/20 rounded-full text-white cursor-pointer z-10 opacity-0 group-hover/media:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <img 
                              src={msg.mediaUrl || undefined} 
                              alt="direct content" 
                              referrerPolicy="no-referrer"
                              className="w-56 h-56 object-cover rounded-xl border border-white/10"
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Captured video display */}
                    {msg.type === 'video' && (
                      <div className="relative group/media inline-block">
                        {msg.mediaUrl === 'mockup-video' ? (
                          <div className="w-56 h-56 bg-neutral-800 border border-cyan-500/20 rounded-xl flex items-center justify-center font-mono text-[9px] text-cyan-400">
                            Decrypted Video
                          </div>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setMediaMenu(mediaMenu === msg.id ? null : msg.id); }} 
                              className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-black/20 rounded-full text-white cursor-pointer z-10 opacity-0 group-hover/media:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <video 
                              src={msg.mediaUrl || undefined} 
                              controls 
                              playsInline 
                              controlsList="nodownload noplaybackrate nofullscreen"
                              disablePictureInPicture
                              disableRemotePlayback
                              className="w-56 h-56 rounded-xl bg-black object-cover" 
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Recorded voice note display */}
                    {msg.type === 'audio' && msg.mediaUrl && (
                      <VoiceMessageBubble 
                        messageId={msg.id}
                        audioUrl={msg.mediaUrl}
                        duration={msg.duration || 5}
                        fileSize={msg.fileSize}
                        status={msg.status}
                        uploadPercent={uploadProgress[msg.id]}
                        onRetryUpload={async () => {
                        if (!msg.mediaUrl) return;
                        try {
                          const res = await fetch(msg.mediaUrl);
                          const blob = await res.blob();
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));
                          uploadVoiceMessage(blob, msg.duration || 0, "me", "them", msg.id);
                        } catch (err) {
                          console.error("Retry failed:", err);
                        }
                      }}
                        isMe={isMe}
                      />
                    )}
                  </div>
                  
                  {/* Status & Timestamp */}
                  <div className={`mt-1.5 flex items-center text-[10px] text-zinc-500 gap-1 px-2.5`}>
                    <span>Seen</span>
                    <span>&bull;</span>
                    <span>
                      {msg.time === 'Just now' 
                        ? 'Today' 
                        : (msg.time === 'Yesterday' 
                          ? 'Yesterday' 
                          : (msg.time === '2 days ago' 
                            ? '2 days ago' 
                            : (msg.time && msg.time.includes(':') ? `Today, ${msg.time}` : 'Today')
                          )
                        )
                      }
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Realtime dynamic simulated typing loading state */}
            {isTyping && (
              <div className="flex flex-col items-start max-w-[75%] self-start animate-fade-in">
                <div className="bg-blue-600 border border-white/5 text-blue-100 px-3 py-1.5 rounded-[16px] rounded-tl-none text-xs flex items-center space-x-1.5 shadow-sm">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Core Input Bar matching Image 2 perfectly */}
          <div className={`w-full shrink-0 pb-2 pt-1 px-4 z-20 space-y-2 bg-transparent`}>
            {isRecordingMic ? (
              <VoiceRecordingBar
                recordingTime={micTimer}
                onCancel={cancelRecording}
                onSend={stopMic}
                isBlocked={blockedUsers.includes(activeChatUser.name)}
              />
            ) : (
              /* Image 2 compliant dual camera/mic with send-pill input row */
              <form 
                onSubmit={handleSendMessage} 
                className={`w-full border border-white/5 rounded-[999px] pl-5 pr-1.5 h-12 flex items-center relative ${glassmorphismActive ? 'bg-black/30 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-black/20 shadow-lg shadow-black/20'}`}
              >
                {/* Input with placeholder "message" matching Image 2 */}
                <input
                  type="text"
                  value={inputText}
                  disabled={blockedUsers.includes(activeChatUser.name)}
                  onChange={(e) => setInputText(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder={blockedUsers.includes(activeChatUser.name) ? "This user is blocked" : "message"}
                  className={`flex-grow bg-transparent border-none outline-none text-white text-[15px] focus:ring-0 py-1 min-w-0 mr-2 ${
                    blockedUsers.includes(activeChatUser.name) ? 'opacity-50 cursor-not-allowed font-bold placeholder-red-400' : 'placeholder-zinc-500'
                  }`}
                />

                {/* Media tools triggers */}
                <div className="flex items-center space-x-1 shrink-0 mr-3 relative">
                  <button
                    type="button" 
                    disabled={blockedUsers.includes(activeChatUser.name)}
                    onClick={() => setIsGalleryPopupOpen(!isGalleryPopupOpen)}
                    className={`p-1.5 text-white hover:bg-neutral-800 rounded-full transition-all cursor-pointer ${
                      blockedUsers.includes(activeChatUser.name) ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title="Photo Lens"
                  >
                    <Plus className="w-6 h-6 text-zinc-300" />
                  </button>
                  {isGalleryPopupOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3">
                      <button 
                         type="button"
                        onClick={() => {
                          setIsGalleryPopupOpen(false);
                          fileInputRef.current?.click();
                        }}
                         className="bg-[#2a2a2c] text-[#f56c70] px-6 py-2.5 rounded-[16px] font-sans font-bold text-[17px] tracking-wide cursor-pointer hover:opacity-90 shadow-2xl border border-white/5 whitespace-nowrap"
                      >
                        Gallary
                      </button>
                    </div>
                  )}
                  <button
                    type="button" 
                    disabled={blockedUsers.includes(activeChatUser.name)}
                    onClick={startMic}
                    className={`p-1 text-white hover:bg-neutral-800 rounded-full transition-all cursor-pointer relative ${
                      blockedUsers.includes(activeChatUser.name) ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title="Audio Direct"
                  >
                    <Mic className="w-[22px] h-[22px] text-zinc-300" />
                    <div className="absolute bottom-0 right-0 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center -mb-0.5 -mr-0.5 border-2 border-[#131315]">
                       <svg className="w-3 h-3 text-black -ml-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-5 4 10 3-7 4 5h3"/></svg>
                    </div>
                  </button>
                </div>

                {/* Send Button match Image 2 color theme */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || blockedUsers.includes(activeChatUser.name)}
                  className={`px-5 py-2 rounded-[99px] text-white font-extrabold text-[12px] tracking-wider uppercase hover:opacity-95 active:scale-95 transition-all shrink-0 cursor-pointer h-[34px] flex items-center justify-center font-sans ${
                    inputText.trim() && !blockedUsers.includes(activeChatUser.name)
                      ? 'bg-blue-600 shadow-sm' 
                      : 'bg-blue-600/45 text-white/50 cursor-not-allowed'
                  }`}
                >
                  send
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0] && activeChatUser) {
                    const file = e.target.files[0];
                    const isVideo = file.type.startsWith('video/');
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const mediaUrl = event.target?.result as string;
                      const newMsg = {
                        id: `usr-${Date.now()}`,
                        sender: 'me' as const,
                        text: '',
                        type: isVideo ? 'video' as const : 'image' as const,
                        mediaUrl,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        createdAt: Date.now()
                      };

                      setMessages(prev => {
                        const updated = [...prev, newMsg];
                        setChatHistories(hist => ({
                          ...hist,
                          [activeChatUser.id]: updated
                        }));
                        return updated;
                      });

                      showCallNotification(`${isVideo ? 'Video' : 'Image'} attached from gallery`);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = ''; // Reset input to allow sending same file again if needed
                  }
                }} />
              </form>
            )}
          </div>



          {/* ========================================================
              DIRECT INTERACTIVE CAMERA VIEWPORT (NOT SAVED IN GALLERY)
              ======================================================== */}
          {isCameraActive && (
            <div className="absolute inset-0 bg-neutral-950 z-[120] flex flex-col justify-between p-6 pb-24 text-white animate-slide-up">
              
              {/* Header status */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                  {cameraMode === 'photo' ? 'PHOTO CAPTURE' : `VIDEO RECORD (${cameraTimer}s)`}
                </span>
                <span className="bg-neutral-900 border border-white/10 px-2.5 py-1 rounded-full text-[8px] font-bold text-neutral-400">
                  direct message only - zero gallery save
                </span>
              </div>

              {/* Camera Stream viewport */}
              <div className="flex-1 my-4 rounded-3xl overflow-hidden relative border border-white/10 bg-neutral-900 flex items-center justify-center">
                {cameraStream && !isUsingMockCamera ? (
                  <video 
                    ref={cameraVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover transition-transform ${
                      cameraType === 'user' ? 'scale-x-[-1]' : 'scale-x-100'
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-950 flex flex-col justify-between p-6 overflow-hidden">
                    
                    {/* Retro Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(245,44,104,0.06)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(245,44,104,0.06)_1.5px,transparent_1.5px)] bg-[size:15px_15px] pointer-events-none" />
                    
                    {/* Moving Laser scanline effect */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#F52C68] opacity-70 animate-bounce shadow-[0_0_8px_#F52C68]" style={{ animationDuration: '3.5s' }} />

                    {/* Simulation metadata header */}
                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400 relative z-10">
                      <div className="flex items-center gap-1.5 uppercase">
                        <span className="w-1.5 h-1.5 bg-[#F52C68] rounded-full animate-ping" />
                        <span className="text-[#F52C68] font-bold">active telemetry</span>
                      </div>
                      <span className="text-zinc-500 lowercase">
                        {cameraType === 'user' ? 'front_sensor_f1.2.chn' : 'rear_telephoto_lrf.chn'}
                      </span>
                    </div>

                    {/* Camera view content depending on lens selection */}
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-4">
                      {cameraType === 'user' ? (
                        /* Front Camera Visual */
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className="relative">
                            {/* Animated scanner target rings */}
                            <div className="absolute -inset-4 border-2 border-white/5 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
                            <div className="absolute -inset-2 border border-[#F52C68]/20 rounded-full animate-reverse-spin" style={{ animationDuration: '4s' }} />
                            
                            {/* Human face silhouette mockup */}
                            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center relative overflow-hidden text-neutral-400 shadow-[0_0_15px_rgba(245,44,104,0.15)]">
                              <Bot className="w-10 h-10 text-neutral-300 stroke-[1.5]" />
                              <div className="absolute bottom-1 w-5/6 h-5 bg-[#F52C68]/15 rounded-t-full border-t border-[#F52C68]/50 flex items-center justify-center">
                                <span className="text-[7px] text-[#F52C68] font-mono font-bold tracking-tight uppercase">user matches</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold tracking-wider text-neutral-200 lowercase">{username.toLowerCase().replace(/\s+/g, '_')}</p>
                            <p className="text-[8px] font-mono text-zinc-500">facetime target locked &bull; auto-tracking</p>
                          </div>
                        </div>
                      ) : (
                        /* Back Camera Visual */
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className="relative">
                            {/* Square viewfinder target */}
                            <div className="absolute -inset-6 border border-cyan-500/10" />
                            <div className="absolute -top-6 -left-6 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                            <div className="absolute -top-6 -right-6 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                            <div className="absolute -bottom-6 -left-6 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                            <div className="absolute -bottom-6 -right-6 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                            
                            {/* Reticle icon */}
                            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center relative text-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                              <ShieldCheck className="w-9 h-9 stroke-[1.2]" />
                              <div className="absolute bottom-2.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                                <span className="text-[7px] text-cyan-400 font-mono tracking-tight font-bold">LIDAR ON</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-bold tracking-wider text-center text-neutral-200 uppercase">ENVIRONMENT SCANNING</p>
                            <p className="text-[8px] font-mono text-cyan-500">focal length 24mm &bull; active mesh range</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simulation metadata footer indicators */}
                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 relative z-10 border-t border-white/5 pt-1.5">
                      <span>iso 400 &bull; 1/60s</span>
                      <span className="text-[#F52C68] font-bold tracking-widest uppercase">broadcast ready</span>
                    </div>

                  </div>
                )}
              </div>

              {/* Controls layout */}
              <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 flex flex-col items-center space-y-4">
                
                {/* Photo or Video toggle */}
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-full border border-white/5 w-2/3 justify-center">
                  <button 
                    type="button"
                    onClick={() => {
                      if (isRecordingVideo) return;
                      setCameraMode('photo');
                    }}
                    className={`flex-1 text-[10px] font-bold py-1 px-3 rounded-full transition-all uppercase text-center cursor-pointer ${
                      cameraMode === 'photo' ? 'bg-[#F52C68] text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Photo
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (isRecordingVideo) return;
                      setCameraMode('video');
                    }}
                    className={`flex-1 text-[10px] font-bold py-1 px-3 rounded-full transition-all uppercase text-center cursor-pointer ${
                      cameraMode === 'video' ? 'bg-[#F52C68] text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Video
                  </button>
                </div>

                {/* Front / Back camera toggle buttons */}
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-full border border-white/5 w-5/6 justify-center">
                  <button 
                    type="button"
                    onClick={() => {
                      if (isRecordingVideo) return;
                      setCameraType('user');
                      startCamera('user');
                    }}
                    className={`flex-1 text-[9px] font-bold py-1 px-2.5 rounded-full transition-all uppercase text-center cursor-pointer ${
                      cameraType === 'user' ? 'bg-zinc-100 text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    front camera
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (isRecordingVideo) return;
                      setCameraType('environment');
                      startCamera('environment');
                    }}
                    className={`flex-1 text-[9px] font-bold py-1 px-2.5 rounded-full transition-all uppercase text-center cursor-pointer ${
                      cameraType === 'environment' ? 'bg-zinc-100 text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    back camera
                  </button>
                </div>

                {/* Shutter row (Front/Back lens trigger is now separated above) */}
                <div className="w-full flex items-center justify-center gap-12 pt-1">
                  
                  {/* Cancel button */}
                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="w-10 h-10 rounded-full border border-neutral-700 text-neutral-400 flex items-center justify-center hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Main Shutter trigger */}
                  <button 
                    type="button"
                    onClick={handleCameraCapture}
                    className="relative flex items-center justify-center p-1 rounded-full border-4 border-white cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className={`w-12 h-12 rounded-full transition-all ${
                      cameraMode === 'photo' 
                        ? 'bg-white hover:bg-neutral-200' 
                        : (isRecordingVideo ? 'bg-red-600 animate-pulse' : 'bg-red-500 hover:bg-red-600')
                    }`} />
                  </button>
                </div>

              </div>

            </div>
          )}



        </div>
      ) : (
        /* RENDER SIMPLE LIST SCREEN (IF CHAT ROOM IS CLOSED) */
        <>
          {/* Messages Title above the Search Input box */}
          <div className="px-1.5 mb-2.5 text-left select-none flex items-center justify-between safe-area-top">
            <h1 className="text-base font-extrabold font-mono tracking-widest text-white uppercase">Messages</h1>
            <button
              onClick={() => {
                scopedStorage.setItem(
                  "booran_seen_notifications_count",
                  totalRawNotifications.toString(),
                );
                setSeenNotificationsCount(totalRawNotifications);
                if (onPushRoute) {
                  onPushRoute("notifications");
                }
              }}
              className="relative w-10 h-10 bg-white text-black hover:bg-neutral-100 rounded-[11px] flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all cursor-pointer shadow-md shrink-0 animate-fade-in"
              title="Notifications & Invites"
            >
              <Bell className="w-5 h-5 fill-black stroke-none" />
              {displayCount > 0 && (
                <div className="absolute top-0 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black"></div>
              )}
            </button>
          </div>

          {/* User Search Bar */}
          <div className="w-full mb-6">
            <div className="h-10 bg-[#ccc] rounded-full px-3 flex items-center justify-center space-x-2 transition-all">
              <Search className="w-4 h-4 text-neutral-950 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH FOR USER"
                className="w-full bg-transparent outline-none text-neutral-950 text-sm font-bold placeholder-neutral-700 text-center py-1.5 focus:ring-0 select-text"
              />
            </div>
          </div>

          {/* Group Choice Controller */}
          <div className="flex items-center justify-between mb-5 px-1.5 border-t border-b border-white/10 py-2.5">
            {!isGroupSelectionMode ? (
              <button
                onClick={() => {
                  setIsGroupSelectionMode(true);
                  setSelectedGroupMemberIds([]);
                }}
                className="text-sm text-white hover:text-neutral-300 font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="text-base font-extrabold">+</span> CREATE GROUP
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-white font-bold uppercase">
                  SELECT MEMBERS ({selectedGroupMemberIds.length})
                </span>
                <div className="flex items-center space-x-2.5">
                  <button 
                    onClick={() => {
                      setIsGroupSelectionMode(false);
                      setSelectedGroupMemberIds([]);
                    }}
                    className="text-[10px] uppercase font-mono font-black bg-neutral-900 border border-white/10 px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white cursor-pointer transition-transform active:scale-95"
                  >
                    cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedGroupMemberIds.length === 0) {
                        setToast("Please select at least 1 member");
                        setTimeout(() => setToast(null), 1500);
                        return;
                      }
                      setShowCreateGroupDialog(true);
                    }}
                    className="text-[10px] uppercase font-mono font-black bg-[#F52C68] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#ff427a] cursor-pointer transition-transform active:scale-95"
                  >
                    done
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* Simple Mixed List of Groups and Direct Contacts - only this container scrolls vertically! */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2 px-1.5 pb-20 custom-scrollbar">
              {(() => {
                // Combine and filter by searchQuery
                const hasSearch = searchQuery.trim() !== '';
                // Filter out permanently deleted users from the list/search entirely
                const sourceUsersForList = (hasSearch ? mockUsersRaw : mockUsers).filter(u => {
                  const nameLower = u.name.toLowerCase();
                  if (username && nameLower === username.toLowerCase()) return false;
                  const handleLower = `@${u.name.toLowerCase().replace(/\s+/g, '_')}`;
                  const fontFriendlyLower = `@${u.name.toLowerCase().replace(' ', '_')}`;
                  
                  const isNotDeleted = !deletedUsers.includes(nameLower) && 
                         !deletedUsers.includes(handleLower) && 
                         !deletedUsers.includes(fontFriendlyLower);

                  const isConnected = connectionList.some(c => {
                    const cl = c.toLowerCase();
                    const cleanC = cl.replace(/^@+/, '');
                    const cleanNameLower = nameLower.replace(/^@+/, '');
                    return cleanC === cleanNameLower || 
                           `@${cleanC.replace(/\s+/g, '_')}` === handleLower ||
                           cl === handleLower ||
                           cl === nameLower;
                  });
                  const isPending = pendingAccepts.some(p => p.name.toLowerCase() === nameLower) || sentRequests.some(p => p.name.toLowerCase() === nameLower);

                  return isNotDeleted && (hasSearch || isConnected || isPending);
                });

                const combinedItems = isGroupSelectionMode
                  ? sourceUsersForList.map(u => ({ ...u, isGroup: false }))
                  : [
                      ...groups.map(g => ({ ...g, isGroup: true })),
                      ...sourceUsersForList.map(u => ({ ...u, isGroup: false }))
                    ];

                const filteredItems = combinedItems.filter(item => {
                  const isBlocked = blockedUsers.some(b => b.toLowerCase() === item.name.toLowerCase());
                  return !isBlocked && item.name.toLowerCase().includes(searchQuery.toLowerCase());
                });

                const sortedFilteredItems = [...filteredItems].sort((a, b) => {
                  const aHist = chatHistories[a.id] || [];
                  const bHist = chatHistories[b.id] || [];
                  const aLast = aHist.length > 0 ? aHist[aHist.length - 1] : null;
                  const bLast = bHist.length > 0 ? bHist[bHist.length - 1] : null;

                  const getTs = (msg: any) => {
                    if (!msg || !msg.id) return 0;
                    const match = msg.id.match(/[_-](\d{13})/);
                    return match ? parseInt(match[1]) : 0;
                  };

                  const aTs = getTs(aLast);
                  const bTs = getTs(bLast);
                  
                  if (aTs !== bTs) {
                    return bTs - aTs;
                  }
                  
                  // Keep initial order if no timestamps
                  return 0;
                });

                if (sortedFilteredItems.length === 0) {
                  return null;
                }

                return sortedFilteredItems.map((item) => {
                  const isChecked = selectedGroupMemberIds.includes(item.id);
                  // Ensure name formatting strips any existing leading @ symbols before applying the internal handle check if needed,
                  // but we want to display it WITHOUT any @ prefix as per request.
                  const baseName = item.name.toLowerCase().replace(/\s+/g, '_').replace(/^@+/, '');
                  const val = scopedStorage.getItem('booran_user_name_hide');
                  const isHidden = (val !== null ? val === 'true' : true) && !item.isGroup;
                  const handleName = hasSearch && isHidden ? '**********' : baseName;
                  
                  // Calculate if the sender is unread
                  const isUnread = unreadSenders.some(u => {
                    const uLower = u.toLowerCase().trim().replace(/^@+/, '');
                    const itemNameLower = item.name.toLowerCase().trim().replace(/^@+/, '');
                    const handleLower = handleName.trim();
                    return uLower === itemNameLower || 
                           uLower === handleLower || 
                           uLower.replace(' ', '_') === itemNameLower.replace(' ', '_') ||
                           uLower.replace(' ', '_') === handleLower.replace(' ', '_');
                  });

                  // Find if user/endpoint is connected
                  const isUserConnected = !item.isGroup && connectionList.some(c => 
                    c.toLowerCase().replace(/^@+/, '') === item.name.toLowerCase().replace(/^@+/, '') || 
                    c.toLowerCase().replace(/^@+/, '') === handleName
                  );

                  return (
                    <div
                      key={item.isGroup ? `g_${item.id}` : `u_${item.id}`}
                      onClick={() => {
                        if (isGroupSelectionMode) {
                          if (!item.isGroup) {
                            if (isChecked) {
                              setSelectedGroupMemberIds(prev => prev.filter(id => id !== item.id));
                            } else {
                              setSelectedGroupMemberIds(prev => [...prev, item.id]);
                            }
                          }
                        } else {
                          if (item.isGroup) {
                            handleGroupClick(item);
                          } else {
                            handleUserClick(item);
                          }
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl cursor-pointer group transition-all text-left bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 shadow-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {item.avatar ? (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewAvatar({ 
                                name: item.name, 
                                avatar: item.avatar 
                              });
                            }}
                            className="relative shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                            title="View large profile picture"
                          >
                            <img 
                              src={item.avatar} 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border-2 border-white/20 group-hover:border-[#F52C68] transition-all duration-200" 
                            />
                            {isUnread && (
                              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-red-500 border-2 border-black rounded-full flex items-center justify-center shadow animate-pulse z-20" title="New Message">
                                <span className="w-1.5 h-1.5 bg-white rounded-full bg-opacity-90" />
                              </div>
                            )}
                            {item.isGroup && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 border-2 border-black rounded-full flex items-center justify-center shadow" title="Group Channel">
                                <span className="text-[8.5px] font-black text-white leading-none">G</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative w-[40px] h-[40px] rounded-xl bg-[#ccc] group-hover:bg-pink-400 transition-colors shrink-0 flex items-center justify-center">                          </div>
                        )}
                        
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors tracking-wide">
                            {handleName}
                          </span>
                          {item.isGroup && (
                            <p className="text-[10px] text-neutral-300 font-mono mt-0.5 uppercase">
                              {item.members?.length || 0} MEMBERS &bull; ADMIN: {item.adminId === 'me' ? 'YOU' : 'SYSTEM'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Checkbox of first image rendered on the far right */}
                        {isGroupSelectionMode && !item.isGroup && (
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isChecked 
                              ? 'bg-[#F25C84] border-[#F25C84]' 
                              : 'bg-zinc-800 border-zinc-600'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white stroke-[4]" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              
            </div>
        </>
      )}

      {/* Create custom group chat modal overlay */}
      {showCreateGroupDialog && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-md z-[201] flex justify-center p-6 animate-fade-in text-white items-center">
          <div className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            
            {/* Nested Confirmation Overlay for Member Deletion (Mistaken Selection) */}
            {memberIdToRemove && (
              <div className="absolute inset-0 bg-black/55 z-[210] flex flex-col justify-center items-center p-5 animate-fade-in">
                <div className="text-center space-y-4 max-w-[240px]">
                  <div className="w-12 h-12 rounded-full bg-red-650/15 text-[#F52C68] flex items-center justify-center mx-auto border border-[#F52C68]/25 bg-red-500/10">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase font-mono">Remove Contact?</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                      Remove{" "}
                      <span className="text-white font-semibold">
                        {mockUsers.find(u => u.id === memberIdToRemove)?.name.toLowerCase().replace(' ', '_')}
                      </span>{" "}
                      from collaboration queue?
                    </p>
                  </div>
                  <div className="flex gap-2.5 pt-1 w-full">
                    <button
                      type="button"
                      onClick={() => setMemberIdToRemove(null)}
                      className="flex-1 py-1.5 bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-bold uppercase font-mono text-[8.5px] rounded-lg cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroupMemberIds(prev => prev.filter(id => id !== memberIdToRemove));
                        setMemberIdToRemove(null);
                        setToast("Contact unselected successfully");
                        setTimeout(() => setToast(null), 1500);
                      }}
                      className="flex-1 py-1.5 bg-[#F52C68] hover:bg-[#ff427a] text-white font-bold uppercase font-mono text-[8.5px] rounded-lg cursor-pointer"
                    >
                      Ok
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="text-left">
                <span className="text-xl font-bold text-white block font-sans tracking-tight">Create Group</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreateGroupDialog(false)} 
                className="p-1.5 text-neutral-400 hover:text-white cursor-pointer active:scale-95 shrink-0 bg-[#1a1a1a] rounded-full hover:bg-neutral-800 transition-colors border border-white/5 hover:border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input naming */}
            <div className="space-y-2 mb-5 text-left">
              <label className="text-xs text-[#a3a3a3] uppercase font-sans font-semibold tracking-wider block">Add New Group Name</label>
              <input 
                type="text" 
                value={customGroupName}
                onChange={(e) => setCustomGroupName(e.target.value)}
                placeholder="Booran Unified Grid"
                className="w-full bg-[#262626] border border-white/5 hover:border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F52C68] font-semibold transition-colors shadow-inner"
              />
            </div>
            
            {/* Profile Pic */}
            <div className="space-y-2 mb-6 text-left">
              <label className="text-xs text-[#a3a3a3] uppercase font-sans font-semibold tracking-wider block">Profile Pic</label>
              <div className="flex items-center gap-3">
                <label className="w-24 h-24 flex flex-col items-center justify-center rounded-2xl bg-[#262626] border border-dashed border-white/10 hover:border-white/30 cursor-pointer overflow-hidden shrink-0 transition-colors group shadow-inner">
                  {customGroupAvatar && customGroupAvatar !== presets[0] ? (
                    <img src={customGroupAvatar} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="Group Avatar" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-[#737373] group-hover:text-white transition-colors" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setCustomGroupAvatar(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Selected people display list inside popup */}
            <div className="space-y-2 mb-6 text-left">
              <label className="text-xs text-[#a3a3a3] uppercase font-sans font-semibold tracking-wider block">Selected People ({selectedGroupMemberIds.length})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 bg-[#262626] p-3 rounded-2xl border border-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent shadow-inner">
                {selectedGroupMemberIds.map((userId) => {
                  const userDetail = mockUsers.find(u => u.id === userId);
                  if (!userDetail) return null;
                  
                  return (
                    <div key={userDetail.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#333333] border border-white/5 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={userDetail.avatar || undefined} 
                          alt={userDetail.name}
                          className="w-8 h-8 rounded-lg object-cover border border-white/5"
                        />
                        <span className="text-sm text-[#e5e5e5] font-semibold truncate lowercase">
                          {userDetail.name.toLowerCase().replace(' ', '_')}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setMemberIdToRemove(userDetail.id)}
                        className="p-1.5 hover:text-[#F52C68] hover:bg-[#F52C68]/10 text-[#a3a3a3] rounded-lg active:scale-95 transition-all cursor-pointer"
                        title="Remove user from selection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                
                {selectedGroupMemberIds.length === 0 && (
                  <div className="text-center py-6 text-[#737373] text-sm font-mono bg-[#333333] rounded-xl border border-white/5">
                    No users selected. Cancel to choose contacts.
                  </div>
                )}
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateGroupDialog(false)}
                className="flex-1 py-3 bg-[#262626] hover:bg-[#333333] border border-white/5 text-[#d4d4d4] font-bold uppercase font-sans text-xs tracking-wider rounded-2xl cursor-pointer transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchCustomGroupChat}
                className="flex-1 py-3 bg-[#F52C68] hover:bg-[#ff427a] text-white font-bold uppercase font-sans text-xs tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-[#F52C68]/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Launch Group
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Members dynamically modal - "all users can add new people to join other" */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-md z-[201] flex items-center justify-center p-6 animate-fade-in text-white">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <div className="text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-[#F52C68] block">Add Members</span>
                <span className="text-xs text-neutral-400 font-semibold lowercase">all nodes can expand this channel</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddMembersModal(false)} 
                className="p-1 text-neutral-400 hover:text-white cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of other users */}
            <div className="text-left mb-6">
              <label className="text-[8px] text-neutral-500 uppercase font-mono block mb-2">Select Active Nodes to Invite</label>
              
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {mockUsers
                  .filter(u => !activeChatUser?.members?.some((m: any) => m.id === u.id))
                  .map((user) => {
                    const isSelectedToAdd = addMembersSelectedIds.includes(user.id);
                    return (
                      <div 
                        key={user.id}
                        onClick={() => {
                          if (isSelectedToAdd) {
                            setAddMembersSelectedIds(prev => prev.filter(id => id !== user.id));
                          } else {
                            setAddMembersSelectedIds(prev => [...prev, user.id]);
                          }
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-black hover:bg-neutral-800 cursor-pointer border border-white/5 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-2.5">
                          <img src={user.avatar || undefined} className="w-6 h-6 rounded-md object-cover" />
                          <span className="text-xs font-semibold text-neutral-300">{user.name.toLowerCase().replace(' ', '_')}</span>
                        </div>
                        
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelectedToAdd ? 'bg-[#F52C68] border-[#F52C68]' : 'border-neutral-600 bg-transparent'}`}>
                          {isSelectedToAdd && <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />}
                        </div>
                      </div>
                    );
                })}

                {mockUsers.filter(u => !activeChatUser?.members?.some((m: any) => m.id === u.id)).length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                    All existing node addresses are already members.
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddMembersModal(false)}
                className="flex-1 py-2.5 bg-neutral-950 border border-white/5 hover:bg-neutral-800 text-neutral-400 font-bold uppercase font-mono text-[9px] rounded-xl cursor-pointer"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewPeopleToGroup}
                disabled={addMembersSelectedIds.length === 0}
                className={`flex-1 py-2.5 font-bold uppercase font-mono text-[9px] rounded-xl cursor-pointer transition-all ${
                  addMembersSelectedIds.length > 0 ? 'bg-[#F52C68] hover:bg-[#ff427a] text-white' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-white/5'
                }`}
              >
                invite users
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- SECURE CONFERENCE CALL OVERLAY (LIMIT 15 MEMBERS MAX) ----------------- */}
      {activeCallType && (
        <div className="fixed inset-0 bg-[#0a0a0c] z-[300] flex flex-col text-white animate-fade-in font-sans overflow-hidden">
          
          {/* Top Status Bar */}
          <div className="bg-black/20 border-b border-white/5 py-3 px-5 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] font-black tracking-widest text-[#F52C68] uppercase font-mono block">SECURE GRID CONFERENCE</span>
                <span className="text-[8.5px] text-zinc-400 font-mono tracking-wider uppercase">AES-256 P2P TUNNEL | ACT: {activeCallType.toUpperCase()}</span>
              </div>
            </div>
            
            {/* Limit Indicator */}
            <div className="bg-[#1a1a1f] border border-white/10 rounded-xl px-3 py-1 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#F52C68]" />
              <span className="text-xs font-mono font-bold">
                {callMembers.length} <span className="text-neutral-500">/ 15 MEMBERS Limit</span>
              </span>
            </div>
          </div>

          {/* Grid Panel for Conference Members (Adaptive layouts based on count) */}
          <div className="flex-grow overflow-y-auto p-4 flex items-center justify-center min-h-0 custom-scrollbar bg-radial-gradient">
            {!isGroupCall && callMembers.length === 2 ? (
              /* Custom Elegant 1-on-1 direct call layout with Picture-in-Picture */
              <div className="relative w-full max-w-4xl aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-[#0c0c0e] shadow-2xl flex items-center justify-center select-none">
                
                {/* LARGE WINDOW FOR WHOM WE DIALED (Remote contact) */}
                {(() => {
                  const remoteMember = callMembers.find(m => !m.isMe) || callMembers[1];
                  return (
                    <div className="absolute inset-0 w-full h-full">
                      {/* Dynamic video feed vs. centered avatar backup representation */}
                      {activeCallType === 'video' && !isCallVideoOff ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={remoteMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'} 
                            alt={remoteMember.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter brightness-90 contrast-95" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                        </div>
                      ) : (
                        /* Audio / Normal Call representation */
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-[#09090b]">
                          <div 
                            className="absolute inset-0 bg-cover bg-center filter opacity-10 blur-2xl pointer-events-none" 
                            style={{ backgroundImage: `url(${remoteMember.avatar})` }} 
                          />
                          
                          {/* Main Glowing Avatar halo wave when speaking */}
                          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
                            <div className="relative">
                              {remoteMember.isSpeaking && !isCallMuted && !remoteMember.isMuted ? (
                                <div className="absolute inset-0 w-28 h-28 -m-2 rounded-full border border-[#F52C68]/40 animate-ping duration-1000" />
                              ) : null}
                              
                              <div className={`w-24 h-24 rounded-3xl overflow-hidden border-2 shadow-2xl transition-transform ${
                                remoteMember.isSpeaking && !isCallMuted && !remoteMember.isMuted ? 'border-[#F52C68] scale-105' : 'border-white/10'
                              }`}>
                                <img 
                                  src={remoteMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'} 
                                  alt={remoteMember.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            </div>
                            
                            {/* Speaking ripple indicator bar */}
                            {remoteMember.isSpeaking && !isCallMuted && !remoteMember.isMuted ? (
                              <div className="flex items-center gap-1 h-3 shrink-0">
                                <span className="w-1 bg-[#F52C68] rounded animate-bounce h-3" style={{ animationDelay: '0s' }} />
                                <span className="w-1 bg-[#F52C68] rounded animate-bounce h-2" style={{ animationDelay: '0.15s' }} />
                                <span className="w-1 bg-[#F52C68] rounded animate-bounce h-4" style={{ animationDelay: '0.3s' }} />
                                <span className="w-1 bg-[#F52C68] rounded animate-bounce h-2" style={{ animationDelay: '0.45s' }} />
                              </div>
                            ) : (
                              <div className="h-3 shrink-0 text-neutral-500 text-[8.5px] uppercase font-mono tracking-wider font-semibold">
                                active connection
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Info overlay tag at bottom left */}
                      <div className="absolute bottom-4 left-4 flex items-center justify-between z-20 select-none bg-black/55 rounded-2xl py-1.5 px-3 backdrop-blur-md border border-white/5">
                        <span className="text-[11px] font-bold text-zinc-100 font-mono tracking-wide">
                          {remoteMember.name} (Dialed)
                        </span>
                        {remoteMember.isMuted && (
                          <span className="text-[8px] text-red-500 font-mono font-bold uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded ml-2">
                            Mute
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* SMALL PICTURE-IN-PICTURE DIALED WINDOW (Self "me" feed) */}
                {(() => {
                  const myMember = callMembers.find(m => m.isMe) || callMembers[0];
                  return (
                    <div className="absolute bottom-4 right-4 w-28 h-20 md:w-44 md:h-30 rounded-2xl overflow-hidden border-2 border-white/20 hover:border-[#F52C68]/50 shadow-2xl z-30 bg-[#121216] transition-all">
                      {activeCallType === 'video' && !isCallVideoOff && isCameraActive && cameraStream ? (
                        <video 
                          ref={(el) => {
                            if (el && cameraStream) {
                              el.srcObject = cameraStream;
                              el.play().catch(e => {});
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        /* Traditional Picture-in-picture fallback avatar preview representation */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-white/5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                            <img 
                              src={myMember.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=120&h=120&q=80'} 
                              alt="Self micro-avatar preview" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Floating Identity tag */}
                      <div className="absolute bottom-1 right-1 bg-black/20 rounded px-1.5 py-0.5 backdrop-blur-sm border border-white/5">
                        <span className="text-[8px] font-mono font-bold text-zinc-300">siddhu (You)</span>
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              /* Group conference members adaptive grid layout */
              <div className={`grid gap-3 w-full max-w-5xl items-center justify-center ${
                callMembers.length <= 1 ? 'grid-cols-1' :
                callMembers.length <= 2 ? 'grid-cols-2' :
                callMembers.length <= 4 ? 'grid-cols-2 lg:grid-cols-2' :
                callMembers.length <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                callMembers.length <= 9 ? 'grid-cols-3 md:grid-cols-3' :
                'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              }`}>
                
                {callMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className={`relative rounded-3xl overflow-hidden border transition-all duration-300 aspect-video md:aspect-[4/3] flex flex-col items-center justify-center bg-[#121216] select-none ${
                      member.isSpeaking && !isCallMuted && !member.isMuted
                        ? 'border-[#F52C68] ring-2 ring-[#F52C68]/20 bg-[#161215]'
                        : 'border-white/5 bg-[#121216]/80'
                    }`}
                  >
                    
                    {/* Dynamic Stream Graphic / Video Mockup */}
                    {activeCallType === 'video' && !isCallVideoOff && (!member.isMe || !isCallVideoOff) ? (
                      <div className="absolute inset-0 w-full h-full">
                        {/* Self feed live rendering if active to create ultra-high realism */}
                        {member.isMe && isCameraActive && cameraStream ? (
                          <video 
                            ref={(el) => {
                              if (el && cameraStream) {
                                el.srcObject = cameraStream;
                                el.play().catch(e => {});
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <img 
                              src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'} 
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover filter brightness-75 contrast-95" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Non-Video avatar / overlay center icon */}
                    {((activeCallType === 'audio') || (member.isMe && isCallVideoOff) || (activeCallType === 'video' && isCallVideoOff)) && (
                      <div className="relative flex flex-col items-center justify-center space-y-3 z-10 font-sans">
                        
                        {/* Glowing audio halo waves when speaking */}
                        {member.isSpeaking && !isCallMuted && !member.isMuted ? (
                          <div className="absolute inset-0 w-24 h-24 -m-6 rounded-full border border-[#F52C68]/40 animate-ping duration-1000" />
                        ) : null}
                        
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-xl shrink-0 transition-transform ${
                          member.isSpeaking && !isCallMuted && !member.isMuted ? 'border-[#F52C68] scale-105' : 'border-white/10'
                        }`}>
                          <img 
                            src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'} 
                            alt={member.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        
                        {/* Sound Wave ripple graphic if talking */}
                        {member.isSpeaking && !isCallMuted && !member.isMuted ? (
                          <div className="flex items-center gap-1 h-3 shrink-0">
                            <span className="w-1 bg-[#F52C68] rounded animate-bounce h-3" style={{ animationDelay: '0s' }} />
                            <span className="w-1 bg-[#F52C68] rounded animate-bounce h-2" style={{ animationDelay: '0.15s' }} />
                            <span className="w-1 bg-[#F52C68] rounded animate-bounce h-4" style={{ animationDelay: '0.3s' }} />
                            <span className="w-1 bg-[#F52C68] rounded animate-bounce h-2" style={{ animationDelay: '0.45s' }} />
                          </div>
                        ) : (
                          <div className="h-3 shrink-0 text-neutral-500 text-[8.5px] uppercase font-mono tracking-wider font-semibold">
                            silent
                          </div>
                        )}
                      </div>
                    )}

                    {/* Profile overlay details at bottom */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 select-none bg-black/20 rounded-xl py-1 px-2.5 backdrop-blur-sm border border-white/5">
                      <span className="text-[10px] font-bold text-zinc-200 truncate pr-1">
                        {member.name}
                      </span>
                      
                      {/* Status icons: Muted / Kick */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {member.isMuted && (
                          <span className="text-[9px] text-red-500 font-mono font-bold uppercase tracking-wider bg-red-500/10 px-1 py-0.5 rounded">
                            Muted
                          </span>
                        )}
                        
                        {/* Standard Kick Trigger so we can prune members easily */}
                        {!member.isMe && (
                          <button
                            type="button"
                            onClick={() => handleKickCallMember(member.id)}
                            className="p-1 rounded bg-neutral-950/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Kick participant address"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}

                {/* Invitation Helper placeholder node if counts is below 15, restricted ONLY to genuine Group calls */}
                {isGroupCall && callMembers.length < 15 && (
                  <button
                    type="button"
                    onClick={handleAddConferenceMember}
                    className="rounded-3xl border border-dashed border-white/10 hover:border-[#F52C68]/40 hover:bg-neutral-900/40 text-left cursor-pointer flex flex-col items-center justify-center p-4 transition-all duration-200 group aspect-video min-h-[100px]"
                  >
                    <PlusCircle className="w-7 h-7 text-neutral-500 group-hover:text-[#F52C68] transition-colors mb-2 stroke-[1.5]" />
                    <span className="text-[10.5px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase font-mono tracking-wider">
                      Add Participant
                    </span>
                    <span className="text-[8.5px] text-neutral-500 lowercase font-mono">
                      {15 - callMembers.length} secure slots remaining
                    </span>
                  </button>
                )}

              </div>
            )}
          </div>

          {/* Action Call Control HUD Bar */}
          <div className="bg-[#121215] border-t border-white/5 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 select-none">
            
            {/* Meta status details */}
            <div className="text-center md:text-left shrink-0">
              <span className="text-[9px] font-bold text-[#F52C68] uppercase font-mono tracking-widest block mb-0.5">
                CONFERENCE CONTROL DESK
              </span>
              <span className="text-neutral-400 text-xs font-semibold lowercase">
                limit 15 members • currently chatting securely with {callMembers.length} nodes
              </span>
            </div>

            {/* Core Interaction Buttons */}
            <div className="flex items-center space-x-3.5">
              
              {/* Mic toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsCallMuted(!isCallMuted);
                  showCallNotification(isCallMuted ? "🎙️ Microphone unmuted." : "🔇 Microphone muted.");
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isCallMuted 
                    ? 'bg-red-500 text-white hover:bg-red-600 scale-95' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                }`}
                title="Mute/Unmute microphone"
              >
                <Mic className={`w-5 h-5 ${isCallMuted ? 'animate-pulse' : ''}`} />
              </button>

              {/* Video Camera Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsCallVideoOff(!isCallVideoOff);
                  showCallNotification(isCallVideoOff ? "📹 Video camera active." : "🚫 Video stream turned off.");
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isCallVideoOff 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white'
                }`}
                title="Toggle local video feed"
              >
                {isCallVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Speaker Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsCallSpeakerOn(!isCallSpeakerOn);
                  showCallNotification(isCallSpeakerOn ? "🔈 Speaker output deactivated." : "🔊 Speaker output activated.");
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isCallSpeakerOn 
                    ? 'bg-[#1b2a47] border border-blue-500/20 text-blue-400 hover:bg-[#253961]' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                }`}
                title="Mute incoming audio"
              >
                {isCallSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Add member button */}
              <button
                type="button"
                onClick={handleAddConferenceMember}
                disabled={callMembers.length >= 15}
                className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-neutral-300 hover:text-white disabled:text-neutral-700 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                title="Invite active node"
              >
                <UserPlus className="w-5 h-5" />
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveCallType(null);
                  setCallMembers([]);
                  showCallNotification("🔴 Conference Call ended.");
                }}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform active:scale-90 shadow-lg cursor-pointer"
                title="End Conference Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

            </div>

            {/* Close instruction feedback */}
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest shrink-0">
              limit capped strictly at 15
            </span>

          </div>

        </div>
      )}



      {/* Camera Permission Request Modal overlay */}
      {showDirectCameraPermissionModal && (
        <div className="fixed inset-0 z-[200000] bg-black/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111113] border border-[#232328] rounded-3xl p-6 shadow-2xl relative text-left animate-in fade-in zoom-in duration-150">
            <button 
              onClick={() => {
                setShowDirectCameraPermissionModal(false);
                setToast("Camera request denied.");
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <span className="text-lg font-bold">✕</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-0.5">
                <Camera className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-100 tracking-wider">Access request</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Authorization query</p>
              </div>
            </div>

            <p className="text-[11px] text-[#e0e0ea] leading-relaxed font-sans mb-5">
              Secure Chat Engine requests access to authorize the video camera lens stream:
            </p>

            <div className="space-y-3 mb-6 bg-black/20 border border-white/5 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-200 uppercase tracking-wider font-bold">
                  Camera viewport
                </span>
                <div className="w-8 h-4 rounded-full bg-indigo-500 relative transition-colors cursor-pointer flex items-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-white absolute right-0.5 shadow-sm transform transition-transform" />
                </div>
              </div>
              <p className="text-[9px] text-neutral-400 leading-normal font-mono">
                Used to stream video preview frames, snap instant chat attachments, and trigger back/front perspective switching.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowDirectCameraPermissionModal(false);
                  setToast("Camera Access declined.");
                }}
                className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-850 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider text-white border border-white/10 cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setCameraPermissionConfirmedThisSession(true);
                  setShowDirectCameraPermissionModal(false);
                  setTimeout(() => {
                    startCamera(pendingCameraTargetType);
                  }, 100);
                }}
                className="flex-1 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-505 bg-indigo-600 hover:opacity-90 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider text-white font-extrabold cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.25)]"
              >
                Apply & Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Deletion Modal */}
      {deletePrompt && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1c] border border-white/10 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center space-y-5 shadow-2xl text-center">
            
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-wide font-sans antialiased">
                Delete Message
              </h3>
              <p className="text-xs text-neutral-400">
                Are you sure you want to delete this message?
              </p>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2.5">
              {messages.find(m => m.id === deletePrompt)?.sender === 'me' && (
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(true)}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow"
                >
                  Delete for Everyone
                </button>
              )}
              
              <button
                type="button"
                onClick={() => handleDeleteMessage(false)}
                className="w-full py-2.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-200 font-sans text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Delete for Me
              </button>

              <button
                type="button"
                onClick={() => setDeletePrompt(null)}
                className="w-full py-2 bg-transparent text-neutral-500 hover:text-neutral-300 font-sans text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Options Overlay Menu */}
      {mediaMenu && (
        <>
          <div 
            className="absolute inset-0 z-[200] bg-black/35 backdrop-blur-[5px] pointer-events-auto cursor-pointer animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setMediaMenu(null);
            }}
          />
          <div 
            className="absolute z-[201] w-[85%] max-w-[280px] flex flex-col items-center animate-in zoom-in-95 duration-200 bg-[#1c1c1e] border border-white/10 p-3 rounded-[24px] shadow-2xl gap-2 text-center"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              className="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white p-4 rounded-[16px] font-bold text-base flex items-center justify-between active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                const msgId = mediaMenu;
                setMediaMenu(null);
                setMediaFlashPermission(msgId);
              }}
            >
              <span className="flex-1 text-center pl-6 font-sans">Add to Flash</span>
              <span className="text-[#0091FF] text-2xl font-black mr-1">›</span>
            </button>

            <button
              className="w-full bg-[#3a3a3c]/70 hover:bg-[#48484a] text-zinc-300 py-3 rounded-[16px] font-semibold text-sm text-center active:scale-95 transition-all font-sans"
              onClick={(e) => {
                e.stopPropagation();
                setMediaMenu(null);
              }}
            >
              Back
            </button>
          </div>
        </>
      )}

      {/* Media Flash Confirmation Modal */}
      {mediaFlashPermission && (
        <>
          <div 
            className="absolute inset-0 z-[250] bg-black/50 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setMediaFlashPermission(null);
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[251] w-[85%] max-w-[340px] flex flex-col items-center animate-in zoom-in-95 duration-200"
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
              <h3 className="text-white font-bold text-lg mb-2 text-center font-sans">Add to your flash?</h3>
              <p className="text-neutral-400 text-sm text-center mb-6 font-sans">
                This post will be added to your flash for 24 hours. Your connections can view it.
              </p>
              
              <div className="flex w-full space-x-3">
                <button 
                  onClick={() => setMediaFlashPermission(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition font-sans text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setMediaFlashPermission(null);
                    setToast("Added to your flash for 24h.");
                    setTimeout(() => setToast(null), 2500);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition font-sans text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
