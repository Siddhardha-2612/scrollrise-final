import React, { useState } from 'react';
import { X, Image as ImageIcon, Film, UserMinus, ShieldAlert, Check } from 'lucide-react';

interface SharedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatName: string;
  isGroup?: boolean;
}

export default function SharedMediaModal({ isOpen, onClose, chatName, isGroup = false }: SharedMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  if (!isOpen) return null;

  // Mock high quality shared photos
  const mockPhotos = [
    { id: 'p1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', caption: 'Network Coordinate map' },
    { id: 'p2', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80', caption: 'P2P Signal visualizer' },
    { id: 'p3', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80', caption: 'Encrypted telemetry grid' },
    { id: 'p4', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80', caption: 'Hardware nodes' }
  ];

  // Mock high quality shared videos
  const mockVideos = [
    { id: 'v1', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', caption: 'Quantum Orbit broadcast.mp4', poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80' },
    { id: 'v2', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', caption: 'Laser telemetry stream.mov', poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/55 backdrop-blur-md z-[2000] flex flex-col justify-center items-center p-4 animate-fade-in text-white select-none"
      onClick={onClose}
    >
      <div 
        className="relative max-w-sm w-full bg-[#16161a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header containing name and close */}
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-sm font-bold tracking-wide text-white uppercase font-mono">Shared Media</h3>
            <p className="text-[10px] text-zinc-400 capitalize truncate max-w-[200px]">
              {isGroup ? `group chat: ${chatName}` : `chat with ${chatName}`}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab switchers: Photos vs Videos */}
        <div className="flex border-b border-white/5 bg-neutral-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase font-sans flex items-center justify-center space-x-1.5 transition-all text-center ${
              activeTab === 'photos' 
                ? 'border-b-2 border-[#F52C68] text-[#F52C68]' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase font-sans flex items-center justify-center space-x-1.5 transition-all text-center ${
              activeTab === 'videos' 
                ? 'border-b-2 border-[#F52C68] text-[#F52C68]' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
        </div>

        {/* Media content scrolling feed */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'photos' ? (
            <div className="grid grid-cols-2 gap-2.5">
              {mockPhotos.map((photo) => (
                <div 
                  key={photo.id}
                  onClick={() => setSelectedMedia(photo.url)}
                  className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-[#F52C68]/50 transition-all transform hover:scale-[1.02] active:scale-95 shadow-md bg-neutral-900"
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 p-1 px-1.5 text-center text-[7.5px] text-neutral-300 font-mono truncate">
                    {photo.caption}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mockVideos.map((video) => (
                <div 
                  key={video.id}
                  onClick={() => setSelectedMedia(video.url)}
                  className="group cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-[#F52C68]/50 transition-all bg-[#0a0a0c] flex flex-col p-1 active:scale-98 shadow"
                >
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-950">
                    <img 
                      src={video.poster} 
                      alt={video.caption} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-black/20 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Film className="w-4.5 h-4.5 text-white fill-white ml-[1px]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5 text-left">
                    <span className="text-[9.5px] font-bold font-mono text-neutral-200 block truncate lowercase">
                      {video.caption}
                    </span>
                    <span className="text-[7.5px] text-neutral-500 font-mono">
                      Verified local media log
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Block control feedback footer area */}
        {!isGroup && (
          <footer className="p-3 bg-neutral-900/60 border-t border-white/10 flex items-center justify-between text-left">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-neutral-400" />
              <span className="text-[9px] font-mono text-neutral-400">Communication with target user secure</span>
            </div>
          </footer>
        )}
      </div>

      {/* Media Detail Full Screen Magnifier overlay */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-[2100] bg-black/98 flex flex-col justify-center items-center p-4 animate-fade-in"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="absolute top-4 right-4 flex items-center space-x-3 z-[2200]">
            <button 
              onClick={() => setSelectedMedia(null)}
              className="p-1 px-1.5 rounded-full bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white cursor-pointer hover:scale-105 active:scale-95 font-sans"
            >
              Close Viewer
            </button>
          </div>
          
          <div className="max-w-md w-full max-h-[80vh] flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 bg-black p-1 shadow-2xl">
            {selectedMedia.endsWith('.mp4') ? (
              <video 
                src={selectedMedia} 
                controls 
                autoPlay 
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
              <img 
                src={selectedMedia} 
                alt="Enlarged display" 
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
          
          <p className="text-[9.5px] font-mono text-neutral-400 mt-4 leading-normal text-center max-w-[280px]">
            Node address peer resource accessed successfully. Handshake secure.
          </p>
        </div>
      )}
    </div>
  );
}
