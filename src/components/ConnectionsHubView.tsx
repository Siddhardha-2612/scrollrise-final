import { scopedStorage } from "../utils/storage";
import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Check, Sparkles, Link, Eye, EyeOff } from 'lucide-react';
import { getHumanAvatar as getUserAvatar } from '../utils/avatar';

interface ConnectionsHubViewProps {
  onBack: () => void;
  currentUserAvatar?: string;
  onAddConnection?: (username: string) => void;
  connectionList?: string[];
  onToggleConnection?: (username: string) => void;
  username?: string;
  isCurrentUserProfile?: boolean;
  onOpenQRProfile?: () => void;
}

export default function ConnectionsHubView({
  onBack,
  currentUserAvatar,
  onAddConnection,
  connectionList = [],
  onToggleConnection,
  username = "You",
  isCurrentUserProfile = true,
  onOpenQRProfile
}: ConnectionsHubViewProps) {
  // Current active sub-segment tab: 'suggests' | 'Connects' | 'Connections' | 'Details'
  const [activeTab, setActiveTab] = useState<'suggests' | 'Connects' | 'Connections' | 'Details'>(() => {
    return (scopedStorage.getItem('booran_connections_hub_tab_v2') as any) || 'Details';
  });

  React.useEffect(() => {
    scopedStorage.setItem('booran_connections_hub_tab_v2', activeTab);
  }, [activeTab]);
  const [toast, setToast] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [personalMobile, setPersonalMobile] = useState(() => scopedStorage.getItem('booran_mobile_no') || '');
  const [homeAddress, setHomeAddress] = useState(() => scopedStorage.getItem('booran_home_address') || '');
  const [dateOfBirth, setDateOfBirth] = useState(() => scopedStorage.getItem('booran_date_of_birth') || '');
  const [profession, setProfession] = useState(() => scopedStorage.getItem('booran_profession') || '');
  const [hideDetails, setHideDetails] = useState(() => scopedStorage.getItem('booran_hide_details') === 'true');

  React.useEffect(() => {
    scopedStorage.setItem('booran_hide_details', JSON.stringify(hideDetails));
    
    // Also update the users array if it's the current user profile
    if (isCurrentUserProfile) {
      try {
        const usersStr = scopedStorage.getItem('booran_users');
        if (usersStr) {
          const users = JSON.parse(usersStr);
          const currentUsername = scopedStorage.getItem('booran_username') || "User";
          const userIdx = users.findIndex((u: any) => u.username.toLowerCase() === currentUsername.toLowerCase());
          if (userIdx !== -1) {
            users[userIdx].hideDetails = hideDetails;
            scopedStorage.setItem('booran_users', JSON.stringify(users));
          }
        }
      } catch (e) {}
    }
  }, [hideDetails, isCurrentUserProfile]);


  React.useEffect(() => {
    scopedStorage.setItem('booran_mobile_no', personalMobile);
    scopedStorage.setItem('booran_home_address', homeAddress);
    scopedStorage.setItem('booran_date_of_birth', dateOfBirth);
    scopedStorage.setItem('booran_profession', profession);
  }, [personalMobile, homeAddress, dateOfBirth, profession]);


  // Custom user lists matching the layout of the 2nd image exactly
  const [suggestsList, setSuggestsList] = useState(() => {
    const list = [
      { id: 'sg_1', name: 'Zack Holmes', info: 'Linked with your ScrollRise ID interest' },
      { id: 'sg_2', name: 'Diana Prince', info: 'Recommended based on AI Resolution settings' },
      { id: 'sg_3', name: 'Vikram Sen', info: 'Member of Ambient Beat community' },
      { id: 'sg_4', name: 'Lars Ulrich', info: 'Synced secure invite code creator' },
      { id: 'sg_5', name: 'Sarah Connor', info: 'Joined via official developer channel' }
    ];

    try {
      const dbString = scopedStorage.getItem('booran_users');
      if (dbString) {
        const parsed = JSON.parse(dbString);
        parsed.forEach((ru: any) => {
          if (!list.some(item => item.name.toLowerCase() === ru.username.toLowerCase()) && ru.username.toLowerCase() !== username.toLowerCase()) {
            list.push({
              id: `sg_reg_${ru.username}`,
              name: ru.username,
              info: 'Active local applet peer'
            });
          }
        });
      }
    } catch {}
    
    return list;
  });

  const [connectsList, setConnectsList] = useState<any[]>(() => {
    try {
      const stored = scopedStorage.getItem('booran_pending_connections');
      if (stored) {
         const parsed = JSON.parse(stored);
         if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    
    return [];
  });

  React.useEffect(() => {
    scopedStorage.setItem('booran_pending_connections', JSON.stringify(connectsList));
  }, [connectsList]);

  const [activeConnections, setActiveConnections] = useState<any[]>([]);

  const [sentRequests, setSentRequests] = useState<string[]>(() => {
    try {
      return JSON.parse(scopedStorage.getItem('booran_sent_requests_v2') || '[]');
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    scopedStorage.setItem('booran_sent_requests_v2', JSON.stringify(sentRequests));
  }, [sentRequests]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleShareProfile = (name: string) => {
    const cleanUsername = name.toLowerCase().replace(/\s+/g, '_');
    const profileLink = `https://scrollrise.app/user/${cleanUsername}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${name} on Scrollrise`,
        text: `Check out ${name}'s secure profile and digital channel connections on Scrollrise!`,
        url: profileLink,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(profileLink).then(() => {
        triggerToast(`Copied profile link for ${name}!`);
      }).catch(() => {
        triggerToast(`Failed to copy link`);
      });
    }
  };

  const handleAction = (item: any) => {
    if (activeTab === 'suggests') {
      if (sentRequests.includes(item.id)) return; // Already sent

      if (onAddConnection) {
        onAddConnection(item.name);
      }
      setSentRequests(prev => [...prev, item.id]);
      triggerToast(`Connection request sent to ${item.name}!`);
    } else if (activeTab === 'Connects') {
      setConnectsList(prev => prev.map(c => 
        c.id === item.id ? { ...c, requested: false } : c
      ));
      if (onAddConnection) {
        onAddConnection(item.name);
      }
      triggerToast(`Accepted connection from ${item.name}!`);
    } else if (activeTab === 'Connections') {
      if (onToggleConnection) {
        onToggleConnection(item.name);
        triggerToast(`Unconnected from ${item.name}`);
      }
    }
  };

  const [otherUserMockData] = useState(() => {
    if (isCurrentUserProfile) return null;
    
    let isHidden = false;
    let actualMobile = '';
    let actualDob = '';
    let actualAddress = '';
    let actualProfession = '';
    
    try {
      const usersStr = scopedStorage.getItem('booran_users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const match = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase().replace(/^@/, ''));
        if (match) {
          isHidden = !!match.hideDetails;
          actualMobile = match.mobileNumber || '';
          actualDob = match.dateOfBirth || '';
          actualAddress = match.homeAddress || '';
          actualProfession = match.profession || '';
          }
      }
    } catch (e) {}

    let hash = 0;
    const cleanUser = username.toLowerCase().replace(/\s+/g, '_').replace(/^@/, '');
    for (let i = 0; i < cleanUser.length; i++) {
      hash = cleanUser.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // mock mobile
    const defaultMobile = Math.abs(hash * 12345).toString().padStart(10, '0').slice(0, 10);
    const num = actualMobile || defaultMobile;
    
    
    const day = (Math.abs(hash) % 28) + 1;
    const month = (Math.abs(hash * 7) % 12) + 1;
    const year = 1980 + (Math.abs(hash * 13) % 25);
    // mock connections
    const numConnections = (Math.abs(hash) % 5) + 3;
    const mockConns = [];
    const names = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Sam', 'Riley', 'Jamie', 'Morgan'];
    for(let i=0; i<numConnections; i++) {
      mockConns.push(`@${names[(Math.abs(hash) + i) % names.length].toLowerCase()}_${(i+1)*Math.abs(hash)%99}`);
    }

    const myName = scopedStorage.getItem('booran_username') || "User";
    if (connectionList.includes(username) || connectionList.includes(`@${username}`)) {
       if (!mockConns.some(c => c.replace(/^@/,'').toLowerCase() === myName.replace(/^@/,'').toLowerCase())) {
          mockConns.unshift(`@${myName.replace(/^@/,'')}`);
       }
    }

    // mock connects (pending)
    const numConnects = (Math.abs(hash) % 3) + 1;
    const mockConnects = [];
    for(let i=0; i<numConnects; i++) {
      mockConnects.push({
        id: `mock_c_${i}`,
        name: `@${names[(Math.abs(hash*2) + i) % names.length].toLowerCase()}_fan`,
        requested: (i % 2 === 0)
      });
    }
    
    return { mobile: num, dob: actualDob, address: actualAddress, profession: actualProfession, mockConns, mockConnects, isHidden };
  });

  const baseConnections = isCurrentUserProfile 
    ? connectionList 
    : (otherUserMockData?.mockConns || []);

  const actualSuggestsList = isCurrentUserProfile 
    ? suggestsList.filter(s => !connectionList.some(c => c.toLowerCase() === s.name.toLowerCase()))
    : [];

  const actualConnections = baseConnections.map((c, i) => ({ id: `con_${i}`, name: c }));
  
  const displayConnectsList = isCurrentUserProfile ? connectsList : (otherUserMockData?.mockConnects || []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-6 pb-6 pt-12 font-sans relative select-none overflow-hidden">
      
      {/* Header bar with Back trigger and centered DETAILS title */}
      <div className="flex items-center justify-between mb-6 relative z-10 safe-area-top">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 text-white transition-all cursor-pointer bg-white/10 hover:bg-white/20 rounded-full -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-3xl font-normal tracking-wide text-white uppercase font-sans">
          DETAILS
        </span>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      {/* Top Banner containing the circular avatar + Hello title */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowAvatarModal(true)}
            className="w-20 h-20 rounded-[24px] bg-[#222] flex items-center justify-center overflow-hidden border border-white/10 shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            {currentUserAvatar ? (
              <img 
                src={currentUserAvatar} 
                alt="You avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-[#222]" />
            )}
          </button>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-serif font-medium text-white tracking-wide leading-none">
                  {isCurrentUserProfile ? "Hello" : "Profile"}
                </span>
                {isCurrentUserProfile && scopedStorage.getItem("booran_is_premium") === "true" && (
                  <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg border border-white/20 uppercase tracking-widest mt-1">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-neutral-400 mt-1">
                @{username.toLowerCase().replace(/\s/g, '')}
              </span>
            </div>
        </div>

        {isCurrentUserProfile && (
          <button
            onClick={onOpenQRProfile}
            className="text-blue-500 hover:text-blue-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 mr-5"
            title="View Digital QR Profile"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 2h7v2H4v5H2V2z" />
              <rect x="6" y="6" width="5" height="5" />
              <path d="M22 2h-7v2h5v5h2V2z" />
              <rect x="13" y="6" width="5" height="5" />
              <path d="M2 22h7v-2H4v-5H2v7z" />
              <rect x="6" y="13" width="5" height="5" />
              <path d="M22 22h-7v-2h5v-5h2v7z" />
              <rect x="13" y="13" width="1.5" height="1.5" />
              <rect x="16.5" y="13" width="1.5" height="1.5" />
              <rect x="14.75" y="14.75" width="1.5" height="1.5" />
              <rect x="13" y="16.5" width="1.5" height="1.5" />
              <rect x="16.5" y="16.5" width="1.5" height="1.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Spacing layout tabs row: suggests Connects Connections More exactly as depicted in mockup */}
      <div className="flex items-center space-x-5 mb-7 px-0.5 select-none text-[14px] relative z-10">
        <button
          onClick={() => setActiveTab('suggests')}
          className={`transition-all ${
            activeTab === 'suggests' 
              ? 'text-white font-medium' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          suggests
        </button>

        <button
          onClick={() => setActiveTab('Connects')}
          className={`transition-all ${
            activeTab === 'Connects' 
              ? 'text-white font-medium' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Connects
        </button>

        <button
          onClick={() => setActiveTab('Connections')}
          className={`transition-all ${
            activeTab === 'Connections' 
              ? 'text-white font-medium' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Connections
        </button>

        <button
          onClick={() => setActiveTab('Details')}
          className={`transition-all ${
            activeTab === 'Details' 
              ? 'text-white font-medium' 
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Details
        </button>
      </div>

      {/* Optional Toast alerts feedback banner */}
      {toast && (
        <div className="mb-4 bg-neutral-900 border border-white/10 px-3 py-2 rounded-xl text-[10px] font-mono text-center text-[#00b0ff] animate-fade-in relative z-10">
          {toast}
        </div>
      )}

      {/* User listing or details view matching the screenshot precisely */}
      <div className="space-y-4 px-0.5 relative z-10 flex-1">
        {activeTab === 'suggests' && actualSuggestsList.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 group transition-opacity"
          >
            <div className="flex items-center space-x-4">
              <img src={getUserAvatar(item.name)} alt={item.name} className="w-[32px] h-[32px] rounded-lg object-cover bg-[#ccc] group-hover:bg-white transition-colors shrink-0" />
              
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-white tracking-wide">
                  {item.name}
                </span>
              </div>
            </div>

            <button 
              onClick={() => handleAction(item)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              sentRequests.includes(item.id) 
                ? 'bg-[#00b0ff]/20 text-[#00b0ff]' 
                : 'bg-white/10 border border-white/20 hover:bg-[#00b0ff]/20 text-white hover:text-[#00b0ff]'
            }`}>
              {sentRequests.includes(item.id) ? (
                <Check className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}

        {activeTab === 'Connects' && displayConnectsList.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 group transition-opacity"
          >
            <div className="flex items-center space-x-4">
              <img src={getUserAvatar(item.name)} alt={item.name} className="w-[32px] h-[32px] rounded-lg object-cover bg-[#b1b1b1] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-white tracking-wide">
                  {item.name}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isCurrentUserProfile && item.requested && (
                <button 
                  onClick={() => handleAction(item)}
                  className="text-[9px] font-mono bg-[#00b0ff] text-black px-2 py-1 rounded-md font-bold hover:bg-white cursor-pointer transition-colors"
                  >
                  Accept
                </button>
              )}
              {isCurrentUserProfile && !item.requested && (
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">Accepted</span>
              )}
              {!isCurrentUserProfile && (
                <span className="text-[10px] text-white/50 font-mono">Pending</span>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'Connections' && actualConnections.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 group cursor-pointer active:opacity-75 transition-opacity"
          >
            <div className="flex items-center space-x-4">
              <img src={getUserAvatar(item.name)} alt={item.name} className="w-[32px] h-[32px] rounded-lg object-cover bg-[#a6a6a6] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-white tracking-wide">
                  {item.name}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isCurrentUserProfile && (
                <button 
                  onClick={() => handleAction(item)}
                  className="text-[9px] font-mono border border-red-500/30 text-red-400 px-2 py-1 rounded-md font-bold hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              )}
              {!isCurrentUserProfile && (
                <span className="text-[10px] text-white/50 font-mono">Connected</span>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'Details' && (
          <div className="py-2 flex flex-col space-y-4 animate-fade-in relative z-10">
            {/* Username Row */}
            <div className="bg-white/5 backdrop-blur-md glass-glow border border-white/5 px-5 py-4 rounded-[18px] flex justify-between items-center shadow-xl">
              <span className="text-sm font-sans font-medium text-neutral-400">Username</span>
              <span className="text-sm font-mono font-bold text-white tracking-tight">@{username.toLowerCase().replace(/\s/g, '')}</span>
            </div>

            {/* Personal Details Card */}
            <div className="bg-white/5 backdrop-blur-md glass-glow border border-white/5 p-6 rounded-[22px] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-sans font-extrabold text-white tracking-wider uppercase mb-0">PERSONAL DETAILS</h3>
                {isCurrentUserProfile && (
                  <button 
                    onClick={() => setHideDetails(!hideDetails)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-black/40 hover:bg-white/5 active:scale-95 transition-all text-[11px] font-bold text-neutral-200 tracking-wider"
                  >
                    {hideDetails ? <EyeOff className="w-3.5 h-3.5 text-neutral-300" /> : <Eye className="w-3.5 h-3.5 text-neutral-300" />}
                    <span>{hideDetails ? 'UNHIDE' : 'HIDE'}</span>
                  </button>
                )}
              </div>
               
              <div className="flex flex-col space-y-4">
                {/* Mobile No Field */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[13px] text-neutral-400 font-sans font-medium">Mobile no</label>
                  <input 
                    type={(isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden) ? "password" : "text"} 
                    value={isCurrentUserProfile ? (personalMobile || "9876543210") : otherUserMockData?.mobile || "9876543210"}
                    onChange={(e) => isCurrentUserProfile && setPersonalMobile(e.target.value)}
                    disabled={!isCurrentUserProfile}
                    placeholder="••••••••••" 
                    className="w-full bg-[#18181a]/60 border border-white/5 rounded-[14px] h-12 px-4 text-sm text-neutral-200 outline-none focus:border-blue-500/50 disabled:opacity-90 font-mono"
                    style={{
                      letterSpacing: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '8px' : 'normal',
                      fontSize: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '1.25rem' : '0.875rem'
                    }}
                  />
                </div>
                
                {/* Home Address Field (Conditional) */}
                {(isCurrentUserProfile ? homeAddress : otherUserMockData?.address) ? (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[13px] text-neutral-400 font-sans font-medium">Home Address</label>
                    <input 
                      type={(isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden) ? "password" : "text"} 
                      value={isCurrentUserProfile ? homeAddress : otherUserMockData?.address}
                      onChange={(e) => isCurrentUserProfile && setHomeAddress(e.target.value)}
                      disabled={!isCurrentUserProfile}
                      placeholder="••••••••••" 
                      className="w-full bg-[#18181a]/60 border border-white/5 rounded-[14px] h-12 px-4 text-sm text-neutral-200 outline-none focus:border-blue-500/50 disabled:opacity-90 font-mono"
                      style={{
                        letterSpacing: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '8px' : 'normal',
                        fontSize: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '1.25rem' : '0.875rem'
                      }}
                    />
                  </div>
                ) : null}

                {/* Date of Birth Field (Conditional) */}
                {(isCurrentUserProfile ? dateOfBirth : otherUserMockData?.dob) ? (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[13px] text-neutral-400 font-sans font-medium">Date of Birth</label>
                    <input 
                      type={(isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden) ? "password" : "text"} 
                      value={isCurrentUserProfile ? dateOfBirth : otherUserMockData?.dob}
                      onChange={(e) => isCurrentUserProfile && setDateOfBirth(e.target.value)}
                      disabled={!isCurrentUserProfile}
                      placeholder="••••••••••" 
                      className="w-full bg-[#18181a]/60 border border-white/5 rounded-[14px] h-12 px-4 text-sm text-neutral-200 outline-none focus:border-blue-500/50 disabled:opacity-90 font-mono"
                      style={{
                        letterSpacing: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '8px' : 'normal',
                        fontSize: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '1.25rem' : '0.875rem'
                      }}
                    />
                  </div>
                ) : null}

                {/* Profession Field (Conditional) */}
                {(isCurrentUserProfile ? profession : otherUserMockData?.profession) ? (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[13px] text-neutral-400 font-sans font-medium">Profession</label>
                    <input 
                      type={(isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden) ? "password" : "text"} 
                      value={isCurrentUserProfile ? profession : otherUserMockData?.profession}
                      onChange={(e) => isCurrentUserProfile && setProfession(e.target.value)}
                      disabled={!isCurrentUserProfile}
                      placeholder="••••••••••" 
                      className="w-full bg-[#18181a]/60 border border-white/5 rounded-[14px] h-12 px-4 text-sm text-neutral-200 outline-none focus:border-blue-500/50 disabled:opacity-90 font-mono"
                      style={{
                        letterSpacing: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '8px' : 'normal',
                        fontSize: ((isCurrentUserProfile && hideDetails) || (!isCurrentUserProfile && otherUserMockData?.isHidden)) ? '1.25rem' : '0.875rem'
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'suggests' && actualSuggestsList.length === 0 && (
          <p className="text-center py-8 text-xs text-neutral-400">All suggestions processed!</p>
        )}
      </div>

      {/* Expanded Profile Dialog */}
      {showAvatarModal && (
        <div 
          className="absolute inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setShowAvatarModal(false)}
        >
          <div 
            className="w-full max-w-[280px] bg-[#1c1c1e] rounded-3xl p-2 pb-5 shadow-2xl flex flex-col items-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="w-full aspect-square rounded-[1.5rem] bg-[#ccc] overflow-hidden mb-4">
              {currentUserAvatar ? (
                <img 
                  src={currentUserAvatar} 
                  alt="You avatar expanded" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-[#ccc]" />
              )}
             </div>
             <div className="text-center px-4 w-full">
               <h3 className="text-xl font-semibold tracking-wide text-white mb-1">
                 {isCurrentUserProfile ? "Your Profile" : "Profile Info"}
               </h3>
               <p className="text-sm font-mono text-[#00b0ff]">
                 @{username.toLowerCase().replace(/\s/g, '')}
               </p>
             </div>
             <button 
                onClick={() => setShowAvatarModal(false)}
                className="mt-6 w-[80%] py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors cursor-pointer"
             >
                Close
             </button>
          </div>
        </div>
      )}

    </div>
  );
}
