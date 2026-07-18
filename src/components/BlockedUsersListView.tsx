import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, UserX, Trash2, CheckCircle2 } from 'lucide-react';
import { BlockedUser } from '../types';
import { getHumanAvatar } from '../utils/avatar';
import { api } from '../services/api';

interface SwipeableRowWrapperProps {
  children: React.ReactNode;
  onSwipeRight: () => void;
  onClick: () => void;
}

function SwipeableRowWrapper({ children, onSwipeRight, onClick }: SwipeableRowWrapperProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setIsSwiping(true);
  };

  const handleMove = (clientX: number) => {
    if (startX === null || !isSwiping) return;
    const diff = clientX - startX;
    if (diff > 0) {
      setCurrentX(diff);
    }
  };

  const handleEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    setStartX(null);
    if (currentX > 120) {
      onSwipeRight();
    } else {
      setCurrentX(0);
    }
  };

  return (
    <div
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => {
        if (isSwiping) {
          handleMove(e.clientX);
        }
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onClick={(e) => {
        if (currentX > 15) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
      className="relative w-full bg-[#121212] transition-colors hover:bg-neutral-950 cursor-pointer touch-pan-y"
      style={{
        transform: `translateX(${currentX}px)`,
        transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  );
}

interface BlockedUsersListViewProps {
  onBack: () => void;
}

export default function BlockedUsersListView({ onBack }: BlockedUsersListViewProps) {
  const [blockedList, setBlockedList] = useState<BlockedUser[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = scopedStorage.getItem('booran_blocked_users');
      let usernames: string[] = [];
      if (stored) {
        usernames = JSON.parse(stored);
      } else {
        usernames = ['spammer_core', 'bot_alpha9', 'noise_injector', 'tracker_opt_out'];
        scopedStorage.setItem('booran_blocked_users', JSON.stringify(usernames));
      }
      setBlockedList(usernames.map((name, index) => ({
        id: `unq-${index}-${name}`,
        username: name
      })));
    } catch (_) {
      const fallback = ['spammer_core', 'bot_alpha9', 'noise_injector', 'tracker_opt_out'];
      setBlockedList(fallback.map((name, index) => ({
        id: `unq-${index}-${name}`,
        username: name
      })));
    }
  }, []);

  const handleUnblockSingle = async (username: string) => {
    try {
      await api.unblockUser(username);
      const newList = blockedList.filter(u => u.username !== username);
      setBlockedList(newList);

      const usernamesArray = newList.map(u => u.username);
      scopedStorage.setItem('booran_blocked_users', JSON.stringify(usernamesArray));
      window.dispatchEvent(new Event('booran-blocked-sync'));

      setToastMessage(`Unblocked @${username}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to unblock:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      <header className="flex items-center space-x-3 mb-8">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center justify-center font-sans animate-fade-in"
        >
          <ArrowLeft className="w-5.5 h-5.5" />
        </button>
        <h2 className="text-[16px] font-bold font-display tracking-tight text-white leading-none">Blocked users</h2>
      </header>
 
      <main className="max-w-sm mx-auto space-y-4">
        {toastMessage && (
          <div className="bg-white/5 border border-white/20 p-2.5 rounded-xl text-xs text-white text-center animate-fade-in flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="w-4 h-4 text-white animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}
 
        {/* List of blocked user rows with size 14 username in serial order (number wise), unblock right cursor */}
        {blockedList.length === 0 ? (
          <div className="py-12 bg-[#0c0c0e] border border-white/5 rounded-2xl text-center space-y-2 select-none">
            <UserX className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
            <p className="text-xs text-neutral-400 font-semibold">All blocks cleared successfully.</p>
          </div>
        ) : (
          <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-xl">
            {blockedList.map((user, index) => {
              return (
                <div key={user.id} className="relative overflow-hidden bg-neutral-950/60 select-none group">
                  <div className="w-full px-4 py-3.5 flex items-center justify-between text-left focus:outline-none select-none">
                    {/* Username with serial order/number on the left, font size 14 */}
                    <span className="text-sm font-semibold text-neutral-100 tracking-wide flex items-center font-sans">
                      <span className="text-neutral-400 font-mono text-xs font-bold mr-2 w-5 text-right shrink-0">
                        {index + 1}.
                      </span>
                      
                      {/* Avatar/profile picture at left side */}
                      <img 
                        src={getHumanAvatar(String(user.username))} 
                        alt={user.username} 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0 mr-2"
                      />

                      <span className="font-mono text-zinc-300 font-bold lowercase truncate max-w-[130px]">
                        {user.username}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleUnblockSingle(user.username)}
                      className="px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider uppercase bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all rounded-lg cursor-pointer shrink-0 border border-white"
                      title="Unblock user"
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
 
      <footer className="mt-8 text-center text-[10px] text-neutral-600 font-mono select-none">
        Blocked Count: {blockedList.length} Handshakes Restricted
      </footer>
    </div>
  );
}
