import { scopedStorage } from "../utils/storage";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceMessageMetadata } from '../types/voice';
import { ArrowLeft, Link2, Link2Off, Camera, Smile, Info, Mic, Play, Pause, Phone, Video, MoreVertical, X, Check, ShieldAlert, ImageIcon, Plus, Trash2, Square, RotateCcw } from 'lucide-react';
import { Message } from '../types';

import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useVoiceUploader } from '../hooks/useVoiceUploader';
import { VoiceMessageBubble } from './voice/VoiceMessageBubble';
import { VoiceRecordingBar } from './voice/VoiceRecordingBar';
import { getHumanAvatar as getUserAvatar } from '../utils/avatar';
import { api } from '../services/api';
import { socket } from '../utils/socket';

interface DMDirectMessageThreadProps {
  onBack: () => void;
  connectionList?: string[];
  onToggleConnection?: (name: string) => void;
  targetUser?: string;
  currentUsername: string;
}

const generateId = () => crypto.randomUUID();

export default function DMDirectMessageThread({ 
  onBack,
  connectionList = [],
  onToggleConnection,
  targetUser: propTargetUser,
  currentUsername
}: DMDirectMessageThreadProps) {
  const targetUser = propTargetUser || connectionList[0] || 'User';
  const [groupUsers, setGroupUsers] = useState<string[]>(() => {
    try {
      const saved = scopedStorage.getItem('booran_direct_message_group_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [targetUser];
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const isSendingLock = React.useRef(false);

  // REAL-TIME MESSAGES FROM BACKEND
  useEffect(() => {
    if (!currentUsername || currentUsername === "User") return;

    const fetchMessages = async () => {
      try {
        const data = await api.getMessages(targetUser);
        const formatted = data.map((m: any) => ({
          id: m._id,
          sender: m.senderUsername === currentUsername ? 'me' : 'user',
          text: m.text,
          type: m.isVoice ? 'audio' : (m.mediaUrl ? 'media' : 'text'),
          mediaUrl: m.mediaUrl,
          duration: m.duration,
          createdAt: new Date(m.createdAt).getTime()
        }));
        setMessages(formatted);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();

    socket.on('message-receive', (msg) => {
      if ((msg.senderUsername === targetUser && msg.receiverUsername === currentUsername) ||
          (msg.senderUsername === currentUsername && msg.receiverUsername === targetUser)) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg._id)) return prev;
          return [...prev, {
            id: msg._id,
            sender: msg.senderUsername === currentUsername ? 'me' : 'user',
            text: msg.text,
            type: msg.isVoice ? 'audio' : (msg.mediaUrl ? 'media' : 'text'),
            mediaUrl: msg.mediaUrl,
            duration: msg.duration,
            createdAt: Date.now()
          }];
        });
      }
    });

    return () => {
      socket.off('message-receive');
    };
  }, [targetUser, currentUsername]);

  useEffect(() => {
    try {
      scopedStorage.setItem('booran_direct_message_group_users', JSON.stringify(groupUsers));
    } catch {
      // Storage quota exceeded
    }
  }, [groupUsers]);

  const [inputText, setInputText] = useState('');
  const [showAddUserPrompt, setShowAddUserPrompt] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isGalleryPopupOpen, setIsGalleryPopupOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try {
      const stored = scopedStorage.getItem('booran_blocked_users');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const handleUploadSuccess = useCallback((metadata: VoiceMessageMetadata) => {
    setMessages(prev => {
       const messageMap = new Map<string, Message>(prev.map(m => [m.id, m]));
       const existing = messageMap.get(metadata.messageId);
       if (existing) {
           messageMap.set(metadata.messageId, { ...existing, mediaUrl: metadata.audioUrl, isPending: false, status: 'sent', fileSize: metadata.fileSize });
       }
       return Array.from(messageMap.values());
    });
    setToast("Voice message sent!");
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleUploadFailed = useCallback((messageId: string, error: string) => {
    setMessages(prev => {
       const messageMap = new Map<string, Message>(prev.map(m => [m.id, m]));
       const existing = messageMap.get(messageId);
       if (existing) {
           messageMap.set(messageId, { ...existing, status: 'failed' });
       }
       return Array.from(messageMap.values());
    });
    setToast(error || "Upload failed.");
    setTimeout(() => setToast(null), 3000);
  }, []);

  const {
    uploadProgress,
    uploadVoiceMessage,
  } = useVoiceUploader(handleUploadSuccess, handleUploadFailed);

  const {
    isRecording,
    isPaused: isRecordingPaused,
    recordingTime,
    permissionError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder(async (blob, duration) => {
    const localBlobUrl = URL.createObjectURL(blob);
    
    // Start upload and get the local message ID immediately
    const msgId = "vm_" + generateId();
    uploadVoiceMessage(blob, duration, "me", "user", msgId);
    
    const voiceMsg: Message = {
      id: msgId,
      sender: 'me',
      text: "Voice message",
      type: 'audio',
      mediaUrl: localBlobUrl,
      duration,
      fileSize: blob.size,
      isPending: true,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    setMessages(prev => {
      const messageMap = new Map<string, Message>(prev.map(m => [m.id, m]));
      messageMap.set(voiceMsg.id, voiceMsg);
      return Array.from(messageMap.values());
    });
  });

  // Handle toast permission errors automatically
  useEffect(() => {
    if (permissionError) {
      setToast(permissionError);
      setTimeout(() => setToast(null), 3000);
    }
  }, [permissionError]);

  const [previewAvatar, setPreviewAvatar] = useState<{ name: string; avatar: string } | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportBlockPrompt, setShowReportBlockPrompt] = useState(false);
  const [disconnectPromptUser, setDisconnectPromptUser] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<string | null>(null);
  const [mediaMenu, setMediaMenu] = useState<string | null>(null);
  const [mediaFlashPermission, setMediaFlashPermission] = useState<string | null>(null);

  const handleDeleteMessage = (forBoth: boolean) => {
    if (!deletePrompt) return;
    const msgId = deletePrompt;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setDeletePrompt(null);
    setToast(forBoth ? "Message deleted for everyone" : "Message deleted for you");
    setTimeout(() => setToast(null), 2500);
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const getFormattedTimestamp = (createdAt: number) => {
    const date = new Date(createdAt);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      if (date.getHours() < 12) return "Morning";
      return "Today";
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Auto scroll to bottom only when new messages arrive without causing parent/iframe jumping
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      // Scroll immediately to bottom to prevent raw flicker
      container.scrollTop = container.scrollHeight;
      
      // Handle any lazy rendering offsets with a brief timeout
      const timer = setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const checkIsConnected = () => {
    return connectionList.some(c => 
      c.toLowerCase() === targetUser.toLowerCase() || 
      c.toLowerCase() === `@${targetUser.replace(/\s+/g, '_')}`.toLowerCase()
    );
  };

  const handleToggleChatConnection = () => {
    const isConnNow = checkIsConnected();
    if (isConnNow) {
      setDisconnectPromptUser(connectionList[0] || 'User');
    } else {
      if (onToggleConnection) {
        onToggleConnection(connectionList[0] || 'User');
      }
      setToast(`Connected with ${connectionList[0] || 'User'}!`);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleBlockUser = () => {
    const name = targetUser;
    const isBlocked = blockedUsers.includes(name);
    if (isBlocked) {
      setBlockedUsers(prev => {
        const updated = prev.filter(u => u !== name);
        scopedStorage.setItem('booran_blocked_users', JSON.stringify(updated));
        return updated;
      });
      setToast(`${name} is unblocked`);
      setTimeout(() => setToast(null), 2500);
    } else {
      setShowReportBlockPrompt(true);
    }
  };

  const handleConfirmBlockWithPrompt = (report: boolean) => {
    const name = targetUser;
    setBlockedUsers(prev => {
      const updated = [...prev, name];
      scopedStorage.setItem('booran_blocked_users', JSON.stringify(updated));
      return updated;
    });
    setShowReportBlockPrompt(false);
    if (report) {
      setToast(`Report received successfully. ${name} added to blocked list.`);
    } else {
      setToast(`${name} is blocked`);
    }
    setTimeout(() => setToast(null), 2500);
  };

  const handleSend = async () => {
    if (isSendingLock.current) return;
    if (blockedUsers.includes(targetUser)) return;
    if (!inputText.trim() && !isRecording) return;

    if (isRecording) {
      stopRecording();
      return;
    }

    isSendingLock.current = true;
    setIsSending(true);

    try {
      await api.sendMessage({
        receiverUsername: targetUser,
        text: inputText.trim(),
        isVoice: false
      });
      setInputText('');
    } catch (err) {
      console.error("Failed to send message:", err);
      setToast("Failed to send message.");
    } finally {
      isSendingLock.current = false;
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-white overflow-hidden relative">
      
      {/* Add User Modal */}
      {showAddUserPrompt && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/70 animate-fade-in">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 max-w-[280px] w-full space-y-4">
            <h4 className="text-white font-bold text-center text-sm font-sans">Add to Group</h4>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddUserPrompt(false);
                  setNewUsername('');
                }}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newUsername.trim()) {
                    const cleanName = newUsername.trim();
                    setGroupUsers(prev => [...prev, cleanName]);
                  }
                  setShowAddUserPrompt(false);
                  setNewUsername('');
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/70 animate-fade-in">
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
                  setMessages([]);
                  scopedStorage.removeItem('booran_direct_message_history');
                  scopedStorage.removeItem('booran_direct_message_group_users');
                  setShowDeleteConfirm(false);
                  onBack();
                }}
                className="flex-1 py-2 rounded-xl bg-[#F52C68] hover:bg-[#ff3b75] text-white font-bold text-[10px] uppercase font-mono tracking-wider shadow-[0_0_15px_rgba(245,44,104,0.4)] transition-all active:scale-95 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect confirmation modal */}
      {disconnectPromptUser && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/70 animate-fade-in">
          <div className="text-center space-y-4 max-w-[240px]">
            <div className="w-12 h-12 rounded-full text-[#F52C68] flex items-center justify-center mx-auto border border-[#F52C68]/25 bg-red-500/10 shadow-[0_0_15px_rgba(245,44,104,0.3)]">
              <Link2Off className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Disconnect Link?</h4>
              <p className="text-[10.5px] text-neutral-400 mt-2 leading-relaxed">
                Are you sure you would like to disconnect from{" "}
                <span className="text-white font-semibold">
                  @{disconnectPromptUser.replace(/\s+/g, '_').toLowerCase()}
                </span>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisconnectPromptUser(null)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] uppercase font-mono tracking-wider transition-colors active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onToggleConnection) {
                    onToggleConnection(disconnectPromptUser);
                  }
                  setDisconnectPromptUser(null);
                  setToast(`Disconnected from ${disconnectPromptUser}`);
                  setTimeout(() => setToast(null), 2500);
                }}
                className="flex-1 py-2 rounded-xl bg-[#F52C68] hover:bg-[#ff427a] text-white font-bold text-[10px] uppercase font-mono tracking-wider transition-colors active:scale-95 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#121214] border border-white/10 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 font-mono animate-scale-up">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* AppBar matching Image 2 top design */}
      <header className="sticky top-0 z-30 bg-transparent border-b border-white/5 pt-3 pb-3 px-4 flex items-center justify-between select-none shrink-0 backdrop-blur-xl safe-area-top">
        <div className="flex items-center space-x-2.5">
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1 p-2 -ml-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center space-x-2">
            <img 
              src={getUserAvatar(targetUser)} 
              alt={targetUser}
              className="w-8 h-8 rounded-full border border-white/20 object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="text-[15px] font-extrabold tracking-wide text-white drop-shadow-md">
              @{targetUser.replace(/\s+/g, '_').toLowerCase()}
            </span>
          </div>
        </div>

        {/* Right side spacer */}
        <div className="flex items-center space-x-4 text-white relative">
          <button
            type="button"
            onClick={() => setDisconnectPromptUser(targetUser)}
            className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Dimming overlay for the chat background */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[5px] pointer-events-none z-10" />

      {/* Message list area carrying pristine chat bubbles */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 custom-scrollbar flex flex-col relative z-20">
        <div className="flex flex-col space-y-3.5 w-full mt-auto">
          {(() => {
             const uniqueMsgs = Array.from(new Map<string, Message>(messages.map(m => [m.id, m])).values());
             return uniqueMsgs.filter((m: Message) => !m.createdAt || Date.now() - m.createdAt < 24 * 60 * 60 * 1000).map((msg: Message) => {
               const isMe = msg.sender === 'me';
               const bubbleStyle = isMe 
                 ? 'bg-zinc-900/10 text-white border border-white/5' 
                 : 'bg-zinc-950/10 text-white border border-white/5';
                 
               return (
                 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                   <div className={`px-4 py-2.5 rounded-2xl text-[15px] font-sans ${bubbleStyle} backdrop-blur-xl shadow-lg`}>
                     {msg.type === 'audio' ? (
                       <VoiceMessageBubble 
                         messageId={msg.id}
                         audioUrl={msg.mediaUrl || ''}
                         duration={msg.duration || 0}
                         isMe={isMe}
                       />
                     ) : msg.type === 'media' || msg.type === 'image' || msg.type === 'video' ? (
                       <div className="text-xs">Media message</div>
                     ) : (
                       <span className="break-words">{msg.text}</span>
                     )}
                   </div>
                   <span className="text-[10px] text-zinc-500 mt-1 px-1">{getFormattedTimestamp(msg.createdAt || Date.now())}</span>
                 </div>
               );
             });
          })()}
        </div>
        <div ref={scrollRef} />
      </div>

      {/* Design-compliant sticky footer carrying inputs */}
      <footer className="p-3 bg-transparent sticky bottom-0 shrink-0 z-30">
        <div className="max-w-2xl mx-auto space-y-3">
          
          {isRecording ? (
            <VoiceRecordingBar recordingTime={recordingTime} onCancel={cancelRecording} onSend={stopRecording} />
          ) : (
            /* Normal input field layout matching Image 2 */
            <div className="flex items-center w-full bg-black/20 backdrop-blur-xl rounded-[999px] pl-5 pr-1.5 h-12 border border-white/5 relative">
              
              {/* Message Typing text input */}
              <input
                type="text"
                value={inputText}
                disabled={blockedUsers.includes(targetUser) || isSending}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={blockedUsers.includes(targetUser) ? "This user is blocked" : "message"}
                className={`flex-grow bg-transparent text-white outline-none font-sans text-[15px] py-1 min-w-0 mr-2 ${
                  blockedUsers.includes(targetUser) ? 'opacity-50 cursor-not-allowed font-bold placeholder-red-400' : 'placeholder-zinc-500'
                }`}
              />
              
              {/* Media tools triggers */}
              <div className="flex items-center space-x-1 shrink-0 mr-3 relative">
                <button
                  type="button" 
                  disabled={blockedUsers.includes(targetUser)}
                  onClick={() => setIsGalleryPopupOpen(!isGalleryPopupOpen)}
                  className={`p-1.5 text-white hover:bg-neutral-800/50 rounded-full transition-all cursor-pointer ${
                    blockedUsers.includes(targetUser) ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  title="Photo Lens"
                >
                  <Plus className="w-6 h-6 text-zinc-300" />
                </button>
                {isGalleryPopupOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3">
                    <button 
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
                  disabled={blockedUsers.includes(targetUser)}
                  onClick={startRecording}
                  className={`p-1 text-white hover:bg-neutral-800/50 rounded-full transition-all cursor-pointer relative ${
                    blockedUsers.includes(targetUser) ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  title="Audio Direct"
                >
                  <Mic className="w-[22px] h-[22px] text-zinc-300" />
                  <div className="absolute bottom-0 right-0 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center -mb-0.5 -mr-0.5 border-2 border-[#131315]">
                     <svg className="w-3 h-3 text-black -ml-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-5 4 10 3-7 4 5h3"/></svg>
                  </div>
                </button>
              </div>

              {/* Hot pink/purple send button conforming to Image 2 aesthetics */}
              <button
                onClick={handleSend}
                className={`px-5 py-2 rounded-[99px] text-white font-extrabold text-[12px] tracking-wider uppercase hover:opacity-95 active:scale-95 transition-all shrink-0 cursor-pointer ${
                  (inputText.trim() || isRecording) && !blockedUsers.includes(targetUser) ? 'bg-[#1e44a1]' : 'bg-[#1e44a1]/45 text-white/50 cursor-not-allowed'
                }`}
                disabled={(!inputText.trim() && !isRecording) || blockedUsers.includes(targetUser) || isSending}
              >
                {isSending ? "..." : "send"}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const isVideo = file.type.startsWith('video/');
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const mediaUrl = event.target?.result as string;
                    try {
                      const msg = await api.sendMessage({
                        receiverUsername: targetUser,
                        text: isVideo ? "📹 Video" : "📷 Photo",
                        mediaUrl,
                        type: 'media',
                        mediaType: isVideo ? 'video' : 'image'
                      });

                      setToast(`${isVideo ? 'Video' : 'Image'} sent!`);
                    } catch (err) {
                      console.error("Failed to send media:", err);
                      setToast("Failed to send media.");
                    }
                    setTimeout(() => setToast(null), 2000);
                  };
                  reader.readAsDataURL(file);
                  e.target.value = ''; // Reset input
                }
              }} />
            </div>
          )}
        </div>
      </footer>

      {/* Big avatar preview popup at middle */}
      {previewAvatar && (
        <div 
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in"
          onClick={() => setPreviewAvatar(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-[#16161a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-5 select-none text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setPreviewAvatar(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-60 h-60 rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-4 bg-black flex items-center justify-center">
              <img 
                src={previewAvatar.avatar || getUserAvatar(previewAvatar.name)} 
                alt={previewAvatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </div>

            <h3 className="text-base font-bold text-white tracking-wide">
              {previewAvatar.name}
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              @{previewAvatar.name.toLowerCase().replace(/\s+/g, '_')}
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  handleToggleChatConnection();
                  setPreviewAvatar(null);
                }}
                className={`px-4.5 py-1.8 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 border ${
                  checkIsConnected() 
                    ? 'bg-[#0070f3]/20 text-[#0070f3] border-[#0070f3]/30 hover:bg-[#0070f3]/30' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {checkIsConnected() ? (
                  <>
                    <Link2 className="w-3.5 h-3.5 rotate-45" />
                    Connected (Known)
                  </>
                ) : (
                  <>
                    <Link2Off className="w-3.5 h-3.5 rotate-45" />
                    Disconnected (Unknown)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleBlockUser();
                  setPreviewAvatar(null);
                }}
                className="px-4.5 py-1.8 bg-neutral-900 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 border border-white/5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportBlockPrompt && (
        <div 
          className="fixed inset-0 z-[1010] bg-black/55 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in cursor-default select-none"
          onClick={() => setShowReportBlockPrompt(false)}
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
                Do you want to file an abuse report for <span className="text-red-400 font-bold font-mono">@zack_holmes</span> before restricting communications?
              </p>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleConfirmBlockWithPrompt(true)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow"
              >
                Report & Block User
              </button>
              
              <button
                type="button"
                onClick={() => handleConfirmBlockWithPrompt(false)}
                className="w-full py-2.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-200 font-sans text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Block Only
              </button>

              <button
                type="button"
                onClick={() => setShowReportBlockPrompt(false)}
                className="w-full py-2 bg-transparent text-neutral-500 hover:text-neutral-300 font-sans text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Message Deletion Modal */}
      {deletePrompt && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
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
            className="absolute inset-0 z-[100] bg-black/35 backdrop-blur-[5px] pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setMediaMenu(null);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setMediaMenu(null);
            }}
          />
          <div 
            className="absolute z-[101] w-[85%] max-w-[280px] flex flex-col items-center animate-in zoom-in-95 duration-200 bg-[#1c1c1e] border border-white/10 p-3 rounded-[24px] shadow-2xl gap-2"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMediaMenu(null);
              } else {
                e.stopPropagation();
              }
            }}
            onTouchStart={(e) => {
              if (e.target === e.currentTarget) {
                setMediaMenu(null);
              } else {
                e.stopPropagation();
              }
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
              <span className="flex-1 text-center pl-6">Add to Flash</span>
              <span className="text-[#0091FF] text-2xl font-black mr-1">›</span>
            </button>
          </div>
        </>
      )}

      {/* Media Flash Confirmation Modal */}
      {mediaFlashPermission && (
        <>
          <div 
            className="absolute inset-0 z-[150] bg-black/50 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setMediaFlashPermission(null);
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[151] w-[85%] max-w-[340px] flex flex-col items-center animate-in zoom-in-95 duration-200"
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
                  onClick={() => setMediaFlashPermission(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const msg = messages.find(m => m.id === mediaFlashPermission);
                    if (msg && msg.mediaUrl) {
                      try {
                        await api.createFlash({
                          userId: currentUsername || "anonymous",
                          username: currentUsername,
                          mediaUrl: msg.mediaUrl,
                          mediaType: msg.type === 'video' ? 'video' : 'image',
                          caption: "Shared from chat",
                        });
                        setToast("Added to your flash for 24h.");
                      } catch (err) {
                        console.error("Failed to add to flash:", err);
                        setToast("Failed to add to flash.");
                      }
                    }
                    setMediaFlashPermission(null);
                    setTimeout(() => setToast(null), 2500);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition"
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
