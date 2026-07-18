import { scopedStorage } from "../utils/storage";
import { trackUserInteractionInInsights } from "../utils/insights";
import React, { forwardRef, useState, useEffect } from 'react';
import StarDoubleTap from './StarDoubleTap';
import { X, Send, Link2, Link2Off } from 'lucide-react';

export interface ReelData {
  id?: string;
  src: string;
  user: string;
  caption?: string;
  likes: number;
  comments: string;
  color: string;
  link?: string;
  contact?: string;
  action?: string;
  mediaType?: 'image' | 'video';
  isEmptyPlaceholder?: boolean;
  createdAt?: number;
  isOwnAd?: boolean;
}

function formatLikes(amount: number): string {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return amount.toString();
}

import { getHumanAvatar, getHumanAvatar as getUserAvatar } from '../utils/avatar';

interface VideoFeedItemProps {
  reel: ReelData;
  isActive: boolean;
  'data-index'?: number;
  dataSaverEnabled?: boolean;
  currentUsername?: string;
  currentUserAvatar?: string;
  onShare?: () => void;
  onAddToFlash?: () => void;
  onAddToScroll?: () => void;
  onAddClick?: () => void;
  onInfoClick?: (username: string) => void;
  onToggleConnection?: (username: string) => void;
  isConnected?: boolean;
  onOpenDMs?: (username: string) => void;
}

export const VideoFeedItem = forwardRef<HTMLVideoElement, VideoFeedItemProps>(
  ({ reel, isActive, 'data-index': dataIndex, dataSaverEnabled, currentUsername = "User", currentUserAvatar, onShare, onAddToFlash, onAddToScroll, onAddClick, onInfoClick, onToggleConnection, isConnected = false, onOpenDMs }, propsRef) => {
    const [showStarPop, setShowStarPop] = useState(false);
    const [showFlashPermission, setShowFlashPermission] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [starPopKey, setStarPopKey] = useState(0);
    const [isStarred, setIsStarred] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentsList, setCommentsList] = useState<{user: string, text: string, time: string}[]>(() => {
      if (reel.user === currentUsername || reel.user === `@${currentUsername}` || reel.user === 'User') {
        return [];
      }
      return [
        {user: "tech_guru", text: "Wow, this looks amazing! 🔥", time: "2h ago"},
        {user: "wanderer99", text: "Where was this filmed? Looks incredible! 😍", time: "5h ago"},
        {user: "aesthetic_vibes", text: "The editing on this is top notch 👏", time: "1d ago"},
        {user: "creator_mark", text: "Quality is so crisp! What camera? 🎥", time: "1d ago"},
        {user: "neon_shadow", text: "Absolutely stunning. 💯", time: "2d ago"}
      ];
    });
    const [showProfileWindow, setShowProfileWindow] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const localVideoRef = React.useRef<HTMLVideoElement | null>(null);

    React.useEffect(() => {
      const video = localVideoRef.current;
      if (video) {
        if (isActive) {
          video.currentTime = 0;
          setIsPaused(false);
          
          if (!video.src || video.error) {
            console.warn('Video source is empty or has an error, skipping play');
            return;
          }

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.log('Autoplay effect prevented, trying muted:', e);
              if (localVideoRef.current) {
                setIsMuted(true);
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch(err => {
                  console.warn('Muted autoplay failed too:', err);
                });
              }
            });
          }
        } else {
          video.pause();
        }
      }
    }, [isActive]);

    React.useEffect(() => {
      const video = localVideoRef.current;
      if (video && isActive) {
        if (isPaused) {
          video.pause();
        } else {
          if (!video.src || video.error) {
            console.warn('Video source is empty or has an error, skipping play');
            return;
          }

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.log('Play on resume prevented, trying muted:', e);
              if (localVideoRef.current) {
                setIsMuted(true);
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch(err => {
                  console.warn('Play on resume failed muted too:', err);
                });
              }
            });
          }
        }
      }
    }, [isPaused, isActive]);
    
    // Load persisted comments on mount
    useEffect(() => {
      try {
        const storageKey = `comments_${reel.id || reel.src}`;
        const stored = scopedStorage.getItem(storageKey);
        if (stored) {
          setCommentsList(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load comments');
      }
    }, [reel.id, reel.src]);

    const isUserReel = reel.user === currentUsername || reel.user === `@${currentUsername}` || reel.user === 'User';
    const baseLikes = isUserReel ? 0 : (typeof reel.likes === 'number' ? reel.likes : 0);
    const displayLikes = baseLikes + (isStarred ? 1 : 0);
    
    // For mock videos, base comment count is parsed from reel.comments (if any)
    // For newly added comments, we add the difference to the base count
    const parseMockComments = (str: string | undefined): number => {
      if (!str) return 0;
      const clean = str.replace(/k/g, '000').replace(/m/g, '000000').replace(/\./g, '');
      const parsed = parseInt(clean, 10);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    let displayCommentCountStr = "";
    if (isUserReel) {
      displayCommentCountStr = formatLikes(commentsList.length);
    } else {
      // It's a mock video with 5 initial mock comments. 
      // Any comments beyond 5 are user-added.
      const userAddedCommentsCount = Math.max(0, commentsList.length - 5);
      // Let's check if the user actually added comments. If they just opened it, it shows the string from reel.comments.
      if (userAddedCommentsCount > 0) {
        const baseMockCount = parseMockComments(reel.comments);
        displayCommentCountStr = formatLikes(baseMockCount + userAddedCommentsCount);
      } else {
        displayCommentCountStr = reel.comments || "0";
      }
    }

    const toggleStar = () => {
      const nextStarred = !isStarred;
      setIsStarred(nextStarred);
      trackUserInteractionInInsights(reel.id || reel.src, nextStarred ? "star" : "unstar", currentUsername);
    };

    const handleAddComment = () => {
      if (!commentText.trim()) return;
      const newComment = {
        user: currentUsername, // Real username
        text: commentText.trim(),
        time: "Just now"
      };
      const updatedComments = [...commentsList, newComment];
      setCommentsList(updatedComments);
      setCommentText('');
      
      // Persist
      try {
        const storageKey = `comments_${reel.id || reel.src}`;
        scopedStorage.setItem(storageKey, JSON.stringify(updatedComments));
      } catch (e) {
        console.warn('Failed to persist comments');
      }
    };
    
    return (
      <div 
        className="w-full h-full snap-start snap-always relative bg-black flex items-center justify-center overflow-hidden"
        data-index={dataIndex}
        onClick={(e) => {
          if (showComments) return;
          if (reel.mediaType !== 'image') {
            setIsPaused(prev => !prev);
          }
        }}
        onDoubleClick={(e) => {
          if (showComments) return;
          e.stopPropagation();
          if (!isStarred) {
            setIsStarred(true);
            trackUserInteractionInInsights(reel.src, "star", currentUsername);
          }
          setStarPopKey(prev => prev + 1);
          setShowStarPop(true);
        }}
      >
        {reel.mediaType === 'image' ? (
          <img
            src={reel.src}
            className={`absolute top-0 left-0 w-full h-full object-contain bg-black ${dataSaverEnabled ? 'blur-[2px]' : ''}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <video
            ref={ref => {
              if (typeof propsRef === 'function') propsRef(ref);
              else if (propsRef) propsRef.current = ref;
              localVideoRef.current = ref;
            }}
            src={reel.src}
            className={`absolute top-0 left-0 w-full h-full object-contain bg-black ${dataSaverEnabled ? 'blur-[2px]' : ''}`}
            loop
            muted={isMuted}
            playsInline
            autoPlay={isActive}
            preload="auto"
            onError={(e) => {
              console.warn("Video failed to load, falling back to reliable URL:", reel.src);
              const target = e.currentTarget;
              const fallbackUrl = "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-street-with-neon-lights-40135-large.mp4";
              if (target.src !== fallbackUrl) {
                target.src = fallbackUrl;
                target.load();
                if (isActive) {
                  target.play().catch(err => console.log("Play failed on fallback:", err));
                }
              }
            }}
          />
        )}
        
        {isPaused && reel.mediaType !== 'image' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md">
               <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {showStarPop && <StarDoubleTap key={starPopKey} scale={0.8} onComplete={() => setShowStarPop(false)} />}

        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-[120px] px-4">
          <div className="w-full flex items-end justify-between pointer-events-auto gap-4">
            
            <div className="flex flex-col mb-4 flex-1 min-w-0 pr-12">
              {reel.action !== 'NONE' && (reel.contact || reel.link) && (
                <div 
                  className="bg-[#CC1016] hover:bg-[#E51219] rounded-lg flex items-center justify-between shadow-lg mb-3 px-4 py-2 w-full max-w-[200px] cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reel.link) {
                      let url = reel.link.trim();
                      if (!/^https?:\/\//i.test(url)) {
                        url = 'https://' + url;
                      }
                      window.open(url, '_blank');
                    } else if (reel.contact) {
                      const cleanNumber = reel.contact.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${cleanNumber}`, '_blank');
                    }
                  }}
                >
                  <span className="text-white font-bold tracking-wide text-[16px] truncate mr-2">
                    {reel.action ? reel.action.toUpperCase() : (reel.contact && reel.link ? 'APPLY' : reel.contact ? 'CONTACT' : 'LINK')}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px] text-white shrink-0">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              )}
              <div className="flex items-start space-x-4 translate-y-[14px] w-full">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileWindow(true);
                  }}
                  className="w-[48px] h-[48px] rounded-[16px] flex items-center justify-center overflow-hidden shrink-0 transition-transform active:scale-95 cursor-pointer bg-neutral-800 border border-white/20 shadow-inner"
                >
                  <img
                    src={reel.user === currentUsername && currentUserAvatar ? currentUserAvatar : getUserAvatar(reel.user)}
                    alt={reel.user}
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="flex flex-col drop-shadow-md flex-1 min-w-0">
                  <div className="flex items-center gap-x-2 gap-y-1">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDMs?.(reel.user);
                      }}
                      className="text-white font-bold text-[20px] tracking-tight hover:underline cursor-pointer truncate whitespace-nowrap max-w-[150px] sm:max-w-[200px] leading-tight"
                    >
                      {reel.user}
                    </span>
                    {!isUserReel && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-black text-white bg-gradient-to-r from-amber-400 to-amber-600 px-1.5 py-[2px] rounded uppercase shadow-[0_0_10px_rgba(251,191,36,0.4)] border border-white/20 tracking-[0.15em] mt-0.5">
                          PRO
                        </span>
                        <div 
                          className="flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 bg-black/40 backdrop-blur-sm p-1 rounded-full border border-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleConnection?.(reel.user);
                          }}
                          title={isConnected ? "Connected (Known)" : "Disconnected (Unknown)"}
                        >
                          {isConnected ? (
                            <Link2 className="w-4 h-4 text-[#0070f3] rotate-45 shrink-0" />
                          ) : (
                            <Link2Off className="w-4 h-4 text-red-500 rotate-45 shrink-0" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {reel.caption && (
                    <p className="text-white/90 text-sm mt-1 line-clamp-2">{reel.caption}</p>
                  )}
                  <div className="hidden">Contact: {reel.contact} | Link: {reel.link}</div>
                </div>
              </div>
              {(reel.contact || reel.link || reel.color === '#d1d1d1') && (
                <div className="text-[10px] text-white/70 mt-1 uppercase tracking-widest font-semibold ml-[64px] translate-y-[14px]">
                  {reel.user === currentUsername || reel.user === `@${currentUsername}` ? "YOUR AD" : "AD"}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center space-y-0.5 shrink-0 pb-2 -mr-1">
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar();
                }}
                className="flex flex-col items-center space-y-0 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white drop-shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
                  <svg viewBox="0 0 24 24" fill={isStarred ? "url(#starGradient)" : "none"} stroke={isStarred ? "none" : "white"} strokeWidth={isStarred ? 0 : 2} className="w-[32px] h-[32px] drop-shadow-md transition-colors">
                    <defs>
                      <linearGradient id="starGradient" x1="0%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="100%" stopColor="#0284C7" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-[13px] tracking-wide drop-shadow-md pt-0">{formatLikes(displayLikes)}</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(true);
                }}
                className="flex flex-col items-center space-y-0 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white drop-shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[28px] h-[28px] drop-shadow-md">
                    <path d="M7 9v-3a2 2 0 0 1 2 -2h9a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-3" />
                    <path d="M14 9h-9a2 2 0 0 0 -2 2v9h3l3 3v-3h5a2 2 0 0 0 2 -2v-7a2 2 0 0 0 -2 -2z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-[13px] tracking-wide drop-shadow-md pt-0">{displayCommentCountStr}</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShare) onShare();
                }}
                className="flex flex-col items-center space-y-0 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white drop-shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px] drop-shadow-md">
                    <circle cx="18" cy="6" r="3.5" fill="black" fillOpacity="0.2" />
                    <circle cx="6" cy="12" r="3.5" fill="black" fillOpacity="0.2" />
                    <circle cx="18" cy="18" r="3.5" fill="black" fillOpacity="0.2" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="16.49"/>
                    <line x1="15.41" y1="7.51" x2="8.59" y2="10.49"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-[13px] tracking-wide drop-shadow-md pt-0">Share</span>
              </button>

              {!reel.isOwnAd && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMenu(true);
                  }}
                  className="flex flex-col items-center space-y-0 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white drop-shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[28px] h-[28px] drop-shadow-md">
                      <rect x="9" y="10" width="12" height="12" rx="4" />
                      <path d="M15 13v6" />
                      <path d="M12 16h6" />
                      <path d="M14 10v-1a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h1" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-[13px] tracking-wide drop-shadow-md pt-0">Add</span>
                </button>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onInfoClick?.(reel.user);
                }}
                className="flex flex-col items-center space-y-0 group cursor-pointer text-white"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center drop-shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[28px] h-[28px] drop-shadow-md">
                    <path d="M12 2l10 18H2L12 2z" />
                    <path d="M12 20v-8" />
                  </svg>
                </div>
                <span className="text-white font-bold text-[13px] tracking-wide drop-shadow-md pt-0">Info</span>
              </button>

            </div>
          </div>
        </div>

        {/* Comments Bottom Sheet & Overlay */}
        {showComments && (
          <>
            {/* Invisible overlay for tap-to-close */}
            <div 
              className="absolute inset-0 z-40 bg-black/20" 
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(false);
              }}
            />
            
            <div 
              className="absolute inset-x-0 bottom-0 top-1/2 bg-black border-t border-[#333] rounded-t-3xl flex flex-col z-50 animate-in slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <span className="text-white font-bold tracking-widest uppercase">Comments ({displayCommentCountStr})</span>
              <button 
                onClick={() => setShowComments(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 relative">
              {commentsList.map((c, idx) => (
                <div key={idx} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 shrink-0 overflow-hidden border border-[#333]">
                    <img src={getHumanAvatar(String(c.user))} alt={c.user} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-white font-semibold text-sm">{c.user}</span>
                      <span className="text-neutral-500 text-[10px]">{c.time}</span>
                    </div>
                    <p className="text-neutral-300 text-sm mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 pb-[130px] border-t border-[#333] bg-black w-full">
              <div className="flex items-center space-x-3 bg-neutral-900/60 backdrop-blur-md p-1 pl-3 rounded-full border border-white/5">
                <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden bg-neutral-800 border border-white/10">
                  <img src={getHumanAvatar(String(currentUsername.replace(/[^a-zA-Z0-9]/g, '_')))} alt="CurrentUser" className="w-full h-full object-cover" />
                </div>
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder="Add comment..."
                  className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none text-sm py-2"
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className={`p-2 rounded-full transition-colors ${commentText.trim() ? 'text-pink-500 hover:bg-pink-500/10' : 'text-neutral-600'}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Add Menu Modal */}
        {showAddMenu && (
          <>
            <div 
              className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(false);
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[85%] max-w-[320px] flex flex-col items-center animate-in zoom-in-95 duration-200 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full bg-[#1e1e1e] border border-white/5 text-white p-5 rounded-[20px] font-bold text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
                onClick={() => {
                  setShowAddMenu(false);
                  if (onAddToFlash) {
                    onAddToFlash();
                  } else {
                    setShowFlashPermission(true);
                  }
                }}
              >
                <span className="flex-1 text-center pl-6">Add to Flash</span>
                <span className="text-[#0091FF] text-2xl font-black mr-2">›</span>
              </button>
              
              <button
                className="w-full bg-[#2a2a2a] border border-white/5 text-white p-5 rounded-[20px] font-normal text-lg flex items-center justify-between active:scale-95 transition-transform shadow-2xl"
                onClick={() => {
                  setShowAddMenu(false);
                  if (onAddToScroll) {
                    onAddToScroll();
                  } else if (onAddClick) {
                    onAddClick();
                  }
                }}
              >
                <span className="flex-1 text-center pl-6">Add to scroll</span>
                <span className="text-[#0055FF] text-2xl font-black mr-2">›</span>
              </button>
            </div>
          </>
        )}

        {/* Flash Permission Modal */}
        {showFlashPermission && (
          <>
            <div 
              className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowFlashPermission(false);
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-[85%] max-w-[320px] shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                   <rect x="9" y="10" width="12" height="12" rx="4" />
                   <path d="M15 13v6" />
                   <path d="M12 16h6" />
                   <path d="M14 10v-1a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h1" />
                 </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 text-center">Add to your flash?</h3>
              <p className="text-neutral-400 text-sm text-center mb-6">
                This scroll will be added to your flash for 24 hours. Your connections can view it.
              </p>
              
              <div className="flex w-full space-x-3">
                <button 
                  onClick={() => setShowFlashPermission(false)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 text-white font-semibold hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowFlashPermission(false);
                    if (onAddToFlash) onAddToFlash();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition"
                >
                  Post
                </button>
              </div>
            </div>
          </>
        )}

        {/* Small Profile Window Popup */}
        {showProfileWindow && (
          <>
            <div 
              className="absolute inset-0 z-40 bg-transparent" 
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileWindow(false);
              }}
            />
            <div 
              className="absolute left-4 bottom-[80px] z-50 bg-[#1c1c1e] rounded-2xl p-4 w-[250px] shadow-2xl border border-white/10 animate-in zoom-in-95 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-[48px] h-[48px] rounded-[16px] flex items-center justify-center overflow-hidden shrink-0 bg-neutral-800 border border-white/20">
                  <img
                    src={reel.user === currentUsername && currentUserAvatar ? currentUserAvatar : getUserAvatar(reel.user)}
                    alt={reel.user}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-white font-bold text-base truncate">{reel.user}</div>
                  <div className="text-neutral-400 text-xs truncate">Profile Info</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    setShowProfileWindow(false);
                    onInfoClick?.(reel.user);
                  }}
                  className="w-full py-2 bg-white text-black rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

VideoFeedItem.displayName = 'VideoFeedItem';

