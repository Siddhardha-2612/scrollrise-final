import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect } from 'react';
import { Plus, Star } from 'lucide-react';

export default function SessionManagerModal({ currentUserAvatar, currentUsername, onClose, onLoginSuccess, onGoToLogin }: any) {
  const [modalTab, setModalTab] = useState<'existing' | 'create'>('existing');
  const [selectedUserToVerify, setSelectedUserToVerify] = useState<any | null>(null);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  useEffect(() => {
    const raw = scopedStorage.getItem('booran_sessions');
    let sessions = [];
    try {
      sessions = raw ? JSON.parse(raw) : [];
    } catch(e) { }
    setSessionsList(sessions.slice(0, 6));
  }, []);

  const handleSwitchAccount = (s: any) => {
    setSuccessToast(`Verified! Switching to @${s.username}...`);

    // Restore the digital key
    scopedStorage.setItem('booran_token', s.token);
    scopedStorage.setItem('booran_username', s.username);

    setTimeout(() => {
      onLoginSuccess(s.username);
      onClose();
    }, 1000);
  };

  return (
    <div className="absolute inset-0 bg-black/30 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 flex flex-col relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[92%] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-cyan-400 font-mono">🔐 Session Manager</h3>
            <p className="text-[9px] text-neutral-400 font-mono mt-0.5">Switch peers or register new credentials</p>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white px-2 py-1 text-[10px] font-mono border border-white/5 bg-neutral-950 rounded-md active:scale-95 transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        <div className="bg-neutral-950 border border-white/5 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden relative bg-neutral-900 flex-shrink-0">
            <img src={currentUserAvatar || undefined} alt="Active" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-neutral-950 rounded-full animate-pulse" />
          </div>
          <div>
            <span className="text-[8px] font-bold text-neutral-500 font-mono uppercase tracking-widest block">CURRENTLY ACTIVE</span>
            <span className="text-xs font-mono font-extrabold text-white">@{currentUsername}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 bg-neutral-950 p-1 rounded-xl border border-white/5 mb-4">
          <button 
            type="button"
            onClick={() => setModalTab('existing')}
            className={`py-1.5 text-[9px] font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer ${
              modalTab === 'existing' 
                ? 'bg-neutral-800 text-white font-extrabold border border-white/5 shadow-md' 
                : 'text-neutral-500 hover:text-neutral-350'
            }`}
          >
            Existing Ledger
          </button>
          <div />
        </div>

        {successToast && (
          <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-3 mb-4 text-center">
            <p className="text-white text-xs font-mono font-bold animate-pulse">⚡ {successToast}</p>
            <p className="text-[8px] text-neutral-400 font-mono mt-0.5">Updating secure local credential system...</p>
          </div>
        )}

        {modalTab === 'existing' && !successToast && (
          <div className="flex-1 flex flex-col">
            {userToDelete ? (
              <div className="bg-neutral-950 border border-white/10 rounded-2xl p-4 flex flex-col my-1 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                <p className="text-[9px] text-white font-mono mb-2.5 font-black uppercase tracking-wider flex items-center gap-1">⚠️ Remove Account</p>
                <p className="text-[10.5px] text-neutral-300 font-mono mb-4 leading-relaxed">
                  Are you sure you want to remove the session for <span className="text-white font-extrabold text-xs">@{userToDelete.username}</span>? You will need to log in again.
                </p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="py-1.5 text-[8.5px] font-mono tracking-widest font-black text-neutral-400 bg-neutral-900 border border-white/5 rounded-lg hover:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const usernameToErase = userToDelete.username;
                      const updated = sessionsList.filter((x: any) => x.username.toLowerCase() !== usernameToErase.toLowerCase());
                      scopedStorage.setItem('booran_sessions', JSON.stringify(updated));
                      setSessionsList(updated);
                      setSuccessToast(`Removed session for @${usernameToErase}!`);
                      
                      if (usernameToErase.toLowerCase() === currentUsername.toLowerCase()) {
                        onClose();
                        onLoginSuccess("User");
                      }

                      setUserToDelete(null);
                      setTimeout(() => {
                        setSuccessToast('');
                      }, 1200);
                    }}
                    className="py-1.5 text-[8.5px] font-mono tracking-widest font-black text-red-500 bg-red-950/30 border border-red-500/20 rounded-lg hover:bg-red-900/50 hover:text-red-400 cursor-pointer active:scale-[0.97] transition-all"
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                <p className="text-[8px] text-neutral-500 font-mono uppercase tracking-wider mb-1">Active Session Key Rack (Limit 6):</p>
                
                <div 
                  onClick={() => {
                    onClose();
                    if (onGoToLogin) {
                      onGoToLogin();
                    }
                  }}
                  className="p-2.5 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer justify-center transition-all text-white hover:text-neutral-300 font-mono text-[9px] uppercase tracking-widest font-black mb-1 hover:scale-[1.01] active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Login / Create Peer Account</span>
                </div>

                {sessionsList.map((s: any) => {
                  const isActive = s.username.toLowerCase() === currentUsername.toLowerCase();
                  return (
                    <div 
                      key={s.username}
                      onClick={() => {
                        if (isActive) return;
                        handleSwitchAccount(s);
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-[#0091FF]/10 border-[#0091FF]/30'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-white/5 hover:border-white/10 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={s.avatar} alt={s.username} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1">
                            @{s.username}
                            {isActive && <Star className="w-3 h-3 text-[#0091FF] fill-[#0091FF] drop-shadow-[0_0_5px_#0091FF]" />}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSwitchAccount(s)}
                            className="text-[8px] font-mono font-bold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 p-1 px-1.5 rounded cursor-pointer transition-colors"
                          >
                            Switch
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setUserToDelete(s);
                          }}
                          className="text-[8px] font-mono font-bold text-red-500/80 hover:text-red-400 p-1 hover:bg-red-950/20 rounded cursor-pointer transition-colors"
                          title="Remove account from device"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
