import React, { useState, useEffect } from 'react';
import { X, Share2, Download, CheckCircle } from 'lucide-react';
import { scopedStorage } from '../utils/storage';
import { getHumanAvatar } from '../utils/avatar';
import { api } from '../services/api';

interface ShareSheetModalProps {
  onClose: () => void;
  connections?: string[];
  activePostSrc?: string;
  activePostMediaType?: 'image' | 'video';
}

export function ShareSheetModal({ onClose, connections, activePostSrc, activePostMediaType = 'video' }: ShareSheetModalProps) {
  const [realConnections, setRealConnections] = useState<string[]>(connections || []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (connections && connections.length > 0) {
      setRealConnections(connections);
      return;
    }
    let combined: string[] = [];

    try {
      const storedConnections = scopedStorage.getItem("booran_connections_v2");
      if (storedConnections) {
        const parsed = JSON.parse(storedConnections);
        if (Array.isArray(parsed) && parsed.length > 0) {
          combined = [...combined, ...parsed];
        } else {
          combined = [...combined, "@lofi_shutter", "@hardware_junkie"];
        }
      } else {
        combined = [...combined, "@lofi_shutter", "@hardware_junkie"];
      }
    } catch (e) {
      console.error("Failed to parse connections", e);
      combined = [...combined, "@lofi_shutter", "@hardware_junkie"];
    }

    try {
      const storedConnects = scopedStorage.getItem("booran_pending_connections");
      if (storedConnects) {
        const parsed = JSON.parse(storedConnects);
        if (Array.isArray(parsed)) {
          const connectNames = parsed.map((c: any) => c.name).filter(Boolean);
          combined = [...combined, ...connectNames];
        }
      }
    } catch (e) {
      console.error("Failed to parse connects", e);
    }

    const unique = Array.from(new Set(combined));
    setRealConnections(unique);
  }, [connections]);

  const getAvatar = (username: string): string => {
    return getHumanAvatar(username);
  };

  const handleNativeShare = async () => {
    if (!activePostSrc) {
      if (navigator.share) {
        navigator.share({ title: 'Check out this post', url: window.location.href });
      }
      onClose();
      return;
    }
    
    try {
      const response = await fetch(activePostSrc);
      const blob = await response.blob();
      const ext = activePostSrc.includes('.mp4') ? '.mp4' : '.jpg';
      const file = new File([blob], 'scrollrise_media' + ext, { type: blob.type });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shared from Scrollrise'
        });
      } else {
        // Fallback if browser doesn't support file sharing
        navigator.share({ url: activePostSrc }); 
      }
    } catch (err) {
      console.error('Error sharing file:', err);
    }
    onClose();
  };

  const handleDownload = async () => {
    if (!activePostSrc) {
      alert("No media available to download.");
      return;
    }
    try {
      setToastMessage("Downloading...");
      const response = await fetch(activePostSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Scrollrise_Media_${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setToastMessage("Downloaded to gallery!");
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1500);
    } catch (e) {
      console.error("Download failed", e);
      setToastMessage("Failed to download media.");
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const toggleUser = (username: string) => {
    setSelectedUsers(prev => 
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const handleBulkSend = async () => {
    if (!activePostSrc || selectedUsers.length === 0) return;

    const currentUsername = scopedStorage.getItem('booran_username') || 'User';

    try {
      for (const targetUser of selectedUsers) {
        await api.sendMessage({
          receiverUsername: targetUser,
          type: 'media',
          mediaType: activePostSrc.includes('.mp4') ? 'video' : 'image',
          mediaUrl: activePostSrc,
          text: shareMessage,
        });
      }
      
      setToastMessage(`Sent to ${selectedUsers.length} connection${selectedUsers.length > 1 ? 's' : ''}`);
      setSelectedUsers([]);
      setShareMessage('');
      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to send bulk messages", error);
      setToastMessage("Failed to share.");
    }
  };

  return (
    <>
      <div 
        className="absolute inset-0 z-[200] bg-black/50 backdrop-blur-sm animate-in fade-in pointer-events-auto"
        onClick={onClose}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[85%] max-w-[320px] bg-neutral-950 rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-200 pointer-events-auto"
      >
        {toastMessage && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[220] bg-white text-black px-3 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap">
            {toastMessage}
          </div>
        )}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-white font-semibold text-base absolute left-1/2 -translate-x-1/2">Share</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {realConnections.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-sm">
              No connections yet. Add connections to share.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {realConnections.map((username) => {
                const isSelected = selectedUsers.includes(username);
                return (
                  <button 
                    key={username} 
                    className="flex flex-col items-center group cursor-pointer" 
                    onClick={() => toggleUser(username)}
                  >
                    <div className="relative mb-1">
                      <div className={`w-12 h-12 rounded-full overflow-hidden border transition-all shrink-0 ${isSelected ? 'border-blue-500 border-2 opacity-90 scale-105' : 'border-white/10 group-hover:scale-105'}`}>
                        <img 
                          src={getAvatar(username)} 
                          alt={username} 
                          className="w-full h-full object-cover bg-neutral-800" 
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full text-blue-500">
                          <CheckCircle className="w-5 h-5 fill-blue-500 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-white text-[10px] leading-tight text-center truncate whitespace-nowrap w-16 px-1">
                      {username}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Write a message..." 
              value={shareMessage} 
              onChange={(e) => setShareMessage(e.target.value)}
              className="w-full bg-white/10 text-white text-sm rounded-full px-4 py-2.5 outline-none placeholder:text-neutral-500 focus:bg-white/20 transition-colors"
            />
          </div>
          <button
            onClick={handleBulkSend}
            disabled={selectedUsers.length === 0}
            className={`w-full py-2.5 rounded-full font-semibold text-sm transition-colors ${
              selectedUsers.length > 0 
                ? 'bg-[#0091FF] text-white hover:bg-blue-600' 
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            Send
          </button>

          <div className="flex items-center justify-around pt-2 mt-2 border-t border-white/5">
            <button 
              className="flex flex-col items-center group cursor-pointer" 
              onClick={handleDownload}
            >
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-[10px] text-center">Download</span>
            </button>

            <button 
              className="flex flex-col items-center group cursor-pointer" 
              onClick={handleNativeShare}
            >
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-[10px] text-center">Share via...</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
