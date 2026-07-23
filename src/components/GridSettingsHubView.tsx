import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef } from 'react';
import { CameraPlusIcon } from './CameraPlusIcon';
import { Settings, Plus, Truck, Star, Shield } from 'lucide-react';

import BooranRobotTerminal from './BooranRobotTerminal';

interface GridSettingsHubViewProps {
  currentUserAvatar: string;
  currentUsername: string;
  onSettingsSelected: () => void;
  onShopiSelected: () => void;
  onAdSelected: () => void;
  onStarsSelected: () => void;
  onPrivacySelected: () => void;
  onLoginSuccess: (username: string) => void;
  onGoToLogin?: (isEmpty?: boolean) => void;
  onGoToRegister?: () => void;
  onPushRoute?: (route: any) => void;
  onOpenSessionManager?: () => void;
}

// Highly accurate vector-style Robot render representing the exact layout in the screenshot
const ExactRobotIcon = ({ isActive }: { isActive: boolean }) => (
  <div 
    id="mock-robot-character" 
    className="relative flex items-center justify-center select-none"
  >
    {/* Ambient radial halo glow pulsing behind the robot exactly like the photo */}
    {isActive && (
      <div className="absolute w-[124px] h-[124px] bg-white/20 rounded-full blur-[26px] pointer-events-none animate-pulse transition-all duration-700" />
    )}
    
    <svg 
      width="80" 
      height="100" 
      viewBox="0 0 80 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-300 transform ${
        isActive 
          ? 'scale-[1.12] filter drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]' 
          : 'hover:scale-[1.12] hover:filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
      }`}
    >
      {/* Antenna - Straight vertical centered bar */}
      <line x1="40" y1="8" x2="40" y2="18" stroke="white" strokeWidth="3" strokeLinecap="round" />
      
      {/* Head - Rounded rectangle */}
      <rect x="14" y="18" width="52" height="32" rx="11" fill="black" stroke="white" strokeWidth="3" />
      
      {/* Eyes - Two small white dots */}
      <circle cx="31" cy="34" r="2.2" fill="white" />
      <circle cx="49" cy="34" r="2.2" fill="white" />
      
      {/* Neck - Center vertical connection */}
      <line x1="40" y1="50" x2="40" y2="56" stroke="white" strokeWidth="3" strokeLinecap="round" />
      
      {/* Torso - Rectangular body block */}
      <rect x="23" y="56" width="34" height="24" rx="3.5" fill="black" stroke="white" strokeWidth="3" />
      
      {/* Arms - Diagonal lines pointing down and outward */}
      <line x1="23" y1="62" x2="14" y2="71" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="57" y1="62" x2="66" y2="71" stroke="white" strokeWidth="3" strokeLinecap="round" />
      
      {/* Legs - Parallel vertical lines extending from bottom */}
      <line x1="30" y1="80" x2="30" y2="93" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="80" x2="50" y2="93" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

export default function GridSettingsHubView({
  currentUserAvatar,
  currentUsername,
  onSettingsSelected,
  onShopiSelected,
  onAdSelected,
  onStarsSelected,
  onPrivacySelected,
  onLoginSuccess,
  onGoToLogin,
  onGoToRegister,
  onPushRoute
}: GridSettingsHubViewProps) {
  // Manage state to show or hide dial nodes
  const [showFeatures, setShowFeatures] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  useEffect(() => {
    const raw = scopedStorage.getItem('booran_sessions');
    try {
      setSessionsList(raw ? JSON.parse(raw) : []);
    } catch(e) { }
  }, [showLoginModal]);

  const handleSwitchAccount = (s: any) => {
    triggerHubToast(`Switching to @${s.username}...`);
    scopedStorage.setItem('booran_token', s.token);
    scopedStorage.setItem('booran_username', s.username);
    setTimeout(() => {
      onLoginSuccess(s.username);
      setShowLoginModal(false);
    }, 1000);
  };

  const triggerHubToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Symmetrical Robot hold & drag states (moving navigation)
  const [isHoldingCenter, setIsHoldingCenter] = useState(false);
  const [dragOffsetCenter, setDragOffsetCenter] = useState({ x: 0, y: 0 });
  const startDragOffsetCenter = useRef({ x: 0, y: 0 });
  const clickPreventRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const accumulatedMovement = useRef(0);

  const handleMouseDownCenter = (e: React.MouseEvent) => {
    clickPreventRef.current = false;
    accumulatedMovement.current = 0;
    
    startDragOffsetCenter.current = {
      x: e.clientX - dragOffsetCenter.x,
      y: e.clientY - dragOffsetCenter.y
    };

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      setIsHoldingCenter(true);
      clickPreventRef.current = true;
    }, 180); // trigger whimper if held >= 180ms
  };

  const handleTouchStartCenter = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    clickPreventRef.current = false;
    accumulatedMovement.current = 0;
    
    startDragOffsetCenter.current = {
      x: e.touches[0].clientX - dragOffsetCenter.x,
      y: e.touches[0].clientY - dragOffsetCenter.y
    };

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      setIsHoldingCenter(true);
      clickPreventRef.current = true;
    }, 180);
  };

  React.useEffect(() => {
    if (!isHoldingCenter && !holdTimerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const offsetX = e.clientX - startDragOffsetCenter.current.x;
      const offsetY = e.clientY - startDragOffsetCenter.current.y;
      
      const deltaX = offsetX - dragOffsetCenter.x;
      const deltaY = offsetY - dragOffsetCenter.y;
      accumulatedMovement.current += Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (accumulatedMovement.current > 24 && !isHoldingCenter) {
        setIsHoldingCenter(true);
        clickPreventRef.current = true;
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }

      if (isHoldingCenter) {
        setDragOffsetCenter({
          x: Math.max(-110, Math.min(110, offsetX)),
          y: Math.max(-110, Math.min(110, offsetY))
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      const offsetX = t.clientX - startDragOffsetCenter.current.x;
      const offsetY = t.clientY - startDragOffsetCenter.current.y;
      
      const deltaX = offsetX - dragOffsetCenter.x;
      const deltaY = offsetY - dragOffsetCenter.y;
      accumulatedMovement.current += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (accumulatedMovement.current > 24 && !isHoldingCenter) {
        setIsHoldingCenter(true);
        clickPreventRef.current = true;
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }

      if (isHoldingCenter) {
        setDragOffsetCenter({
          x: Math.max(-110, Math.min(110, offsetX)),
          y: Math.max(-110, Math.min(110, offsetY))
        });
      }
    };

    const handleMouseUp = () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsHoldingCenter(false);
      setDragOffsetCenter({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isHoldingCenter]);

  // Springs animation class helper
  const getFeatureClass = (translatedPosition: string) => {
    return `absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-center z-10 ${
      showFeatures 
        ? `${translatedPosition} opacity-100 scale-100 pointer-events-auto` 
        : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-50 pointer-events-none'
    }`;
  };

  return (
    <div 
      id="exact-settings-hub-dial-screen" 
      className="w-full h-full max-h-[100%] overflow-hidden bg-transparent text-white p-4 pb-20 flex flex-col select-none relative justify-center items-center"
    >
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 border border-white/10 px-5 py-3 rounded-2xl shadow-2xl text-xs text-white font-sans font-medium flex items-center gap-3 animate-fade-in whitespace-nowrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0091FF] animate-pulse shadow-[0_0_8px_#0091FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Symmetrical Circle Dial Hub coordinates matching the mockup image exactly */}
      <div id="dial-interactive-wrapper" className="relative w-full max-w-[340px] h-[450px] my-auto">
        
        {/* CENTER COLUMN: Interactive Robot Portrait */}
        <button
          id="exact-btn-center-robot"
          onMouseDown={handleMouseDownCenter}
          onTouchStart={handleTouchStartCenter}
          onClick={() => {
            const dragDistance = Math.sqrt(dragOffsetCenter.x * dragOffsetCenter.x + dragOffsetCenter.y * dragOffsetCenter.y);
            if (dragDistance > 15 && clickPreventRef.current) {
              return;
            }
            setShowFeatures(prev => !prev);
          }}
          className={`absolute inset-0 m-auto w-28 h-36 flex items-center justify-center group active:scale-95 transition-all outline-none z-20 ${
            isHoldingCenter ? 'cursor-grabbing filter drop-shadow-[0_0_15px_rgba(245,44,104,0.75)]' : 'cursor-grab'
          }`}
          style={{
            transform: `translate(${dragOffsetCenter.x}px, ${dragOffsetCenter.y}px) scale(${isHoldingCenter ? 1.25 : 1})`,
            transition: isHoldingCenter ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.320, 1.275)'
          }}
          title="Toggle Hub Settings (Hold & Drag to Whimper)"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[144px] h-[144px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)] pointer-events-none transition-all duration-300 z-0" />
          <div className="relative z-10 flex items-center justify-center">
            <ExactRobotIcon isActive={showFeatures} />
          </div>
        </button>

        {/* 1. TOP CENTER: Settings (Gear icon) */}
        <button
          id="exact-btn-top-settings"
          onClick={onSettingsSelected}
          className={getFeatureClass('top-[3%] left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <Settings 
            className="w-11 h-11 text-white stroke-[2.2] mb-1.5 transition-transform duration-300 group-hover:rotate-45" 
          />
          <span className="text-[21px] font-semibold tracking-tight text-white font-sans">
            Settings
          </span>
        </button>

        {/* 2. MIDDLE LEFT / LEFT TOP: Stars (Star icon) */}
        <button
          id="exact-btn-left-stars"
          onClick={onStarsSelected}
          className={getFeatureClass('left-[4%] top-[24%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <Star 
            className="w-11 h-11 text-white stroke-[2.2] mb-1.5 transition-transform group-hover:scale-110" 
          />
          <span className="text-[21px] font-semibold tracking-tight text-white font-sans">
            Stars
          </span>
        </button>

        {/* 3. MIDDLE RIGHT / RIGHT TOP: Sales (Storefront icon) */}
        <button
          id="exact-btn-right-shopi"
          onClick={() => onPushRoute?.('sales-market')}
          className={getFeatureClass('right-[4%] top-[24%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <svg
            className="w-12 h-12 text-white mb-1.5 transition-transform group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path strokeWidth="1.4" d="M 4 11 V 21 M 20 11 V 21 M 2 21 H 22" />
            <text x="12" y="18.5" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="currentColor" stroke="none" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.5px' }}>SALE</text>
            <path strokeWidth="1.5" d="M 2.5 8 L 5 3 H 19 L 21.5 8 Z" fill="none" />
            <path strokeWidth="1.5" fill="none" d="M 2.5 8 V 9 A 1.9 1.9 0 0 0 6.3 9 A 1.9 1.9 0 0 0 10.1 9 A 1.9 1.9 0 0 0 13.9 9 A 1.9 1.9 0 0 0 17.7 9 A 1.9 1.9 0 0 0 21.5 9 V 8" />
            <path strokeWidth="1.4" d="M 6.3 9 L 7.8 3 M 10.1 9 L 10.6 3 M 13.9 9 L 13.4 3 M 17.7 9 L 16.2 3" />
          </svg>
          <span className="text-[21px] font-semibold tracking-tight text-white font-sans">
            Sales
          </span>
        </button>

        {/* 4. BOTTOM-LEFT INTERCARDINAL: Ads + */}
        <button
          id="exact-btn-bl-ad"
          onClick={onAdSelected}
          className={getFeatureClass('left-[4%] bottom-[22%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          {/* Exact Square outline with "Ad" inside */}
          <div className="w-[44px] h-[30px] border-[2.8px] border-white rounded-[4px] flex items-center justify-center font-bold text-[14px] bg-black text-white px-1 tracking-tight leading-none mb-2 hover:bg-neutral-900 transition-colors">
            Ad
          </div>
          <span className="text-[21px] font-semibold tracking-tight text-white font-sans">
            Ads +
          </span>
        </button>

        {/* 5. BOTTOM-RIGHT INTERCARDINAL: Privacy (Lock) */}
        <button
          id="exact-btn-br-privacy"
          onClick={onPrivacySelected}
          className={getFeatureClass('right-[4%] bottom-[22%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <div className="relative mb-2 transition-transform group-hover:scale-110 flex items-center justify-center">
            <svg className="w-12 h-12 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 17V19M12 17C10.8954 17 10 16.1046 10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15C14 16.1046 13.1046 17 12 17Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[21px] font-semibold tracking-tight text-white font-sans">
            Privacy
          </span>
        </button>

        {/* 6. BOTTOM CENTER: Add (Plus) */}
        <button
          id="exact-btn-bottom-add"
          onClick={() => {
            setShowLoginModal(true);
          }}
          className={getFeatureClass('bottom-[2%] left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <Plus 
            className="w-12 h-12 text-white stroke-2 mb-1.5 transition-transform duration-300 group-hover:scale-110" 
          />
          <span className="text-[21px] font-semibold tracking-tight text-white font-sans">
            Add
          </span>
        </button>

      </div>

      {/* Add Bottom Sheet Modal */}
      {showLoginModal && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex flex-col justify-end">
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setShowLoginModal(false)} />
          
          <div className="bg-[#121212] w-full rounded-t-3xl p-6 px-8 relative z-10 flex flex-col items-center pb-12 animate-slide-up border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-10 h-1 bg-neutral-700 rounded-full mb-8 opacity-60" />

            <div className="w-full max-w-[340px] flex flex-col gap-3.5">
              <button 
                onClick={() => {
                  setShowLoginModal(false);
                  onGoToLogin();
                }}
                className="w-full bg-white text-black font-semibold text-[15px] py-3.5 rounded-full active:scale-95 transition-transform"
              >
                Login
              </button>
              
              <button 
                onClick={() => {
                  setShowLoginModal(false);
                  onGoToRegister?.();
                }}
                className="w-full bg-[#121212] text-white font-semibold text-[15px] py-3.5 rounded-full border border-neutral-700 active:scale-95 transition-transform"
              >
                Create account
              </button>
            </div>

            <div className="w-full max-w-[340px] mt-8">
              <h3 className="text-white text-[16px] font-medium mb-5 tracking-wide px-1 uppercase text-[10px] text-zinc-500">Active Sessions (Limit 6)</h3>
              
              <div className="flex flex-col gap-4">
                {sessionsList.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                        <img src={s.avatar} alt={s.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-[15px] font-bold">@{s.username}</span>
                        {s.username === currentUsername && (
                           <span className="text-[9px] text-[#0091FF] font-black uppercase tracking-tighter">Active Node</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {s.username === currentUsername ? (
                        <Star className="w-5 h-5 text-[#0091FF] fill-[#0091FF] drop-shadow-[0_0_8px_#0091FF]" />
                      ) : (
                        <button 
                          onClick={() => handleSwitchAccount(s)}
                          className="bg-white text-black text-[11px] font-black px-4 py-1.5 rounded-full active:scale-95 transition-all uppercase tracking-wider"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sessionsList.length === 0 && (
                  <p className="text-neutral-500 text-xs font-mono text-center py-4 italic">No active session relay keys found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over interactive terminal overlay */}
      {showTerminal && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between">
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-neutral-950">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00a2ff]" />
              <span className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">Sentinel-V4 Node Online</span>
            </div>
            <button
              onClick={() => {
                setShowTerminal(false);
              }}
              className="px-3 py-1 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-[10px] text-white font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Exit Terminal
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BooranRobotTerminal />
          </div>
        </div>
      )}
    </div>
  );
}
