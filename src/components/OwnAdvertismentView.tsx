import { scopedStorage, getAds, saveAds } from "../utils/storage";
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, ArrowUp, Trash2, Volume2, VolumeX } from 'lucide-react';

interface OwnAdvertismentViewProps {
  onBack: () => void;
  onPostAd?: (adName: string, adMediaUrl: string, mediaType: 'photo' | 'video' | null, adLink?: string, adContact?: string) => void;
  isPremium?: boolean;
  onTogglePremium?: (val: boolean) => void;
  currentUsername?: string;
}

export default function OwnAdvertismentView({ 
  onBack, 
  onPostAd,
  currentUsername = '@advertisement'
}: OwnAdvertismentViewProps) {
  const [link, setLink] = useState('');
  const [contact, setContact] = useState('');
  const [mediaData, setMediaData] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPosts, setHistoryPosts] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState('APPLY');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  const loadHistory = () => {
    try {
      const allAds = getAds();
      // Show ALL ads regardless of ownerID
      const ads = allAds;
      setHistoryPosts(ads);
    } catch (e) {
      console.warn("Error loading history:", e);
    }
  };

  const deleteAd = (id: string) => {
    try {
      let allAds = getAds();
      allAds = allAds.filter((ad: any) => ad.id !== id);
      saveAds(allAds);
      // Dispatch event to notify feed to update
      window.dispatchEvent(new Event('booran_posts_updated'));
      window.dispatchEvent(new Event('adsUpdated'));
      loadHistory();
      alert("Advertisement removed.");
    } catch (e) {
      console.warn("Error deleting ad:", e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');

    if (isVideo) {
      // Due to local storage limits, for development prototypes we might hit quota 
      // with large video files. We will try ObjectURL if it's too large, but Data URL is preferred.
      if (file.size > 2.5 * 1024 * 1024) {
          // Fallback to object URL if large
          setMediaData(URL.createObjectURL(file));
          setIsProcessing(false);
      } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setMediaData(event.target.result as string);
            }
            setIsProcessing(false);
          };
          reader.onerror = () => setIsProcessing(false);
          reader.readAsDataURL(file);
      }
    } else {
      // Compress image to prevent quota issues
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) {
          setIsProcessing(false);
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
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
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            try {
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
              setMediaData(compressedBase64);
            } catch (err) {
              setMediaData(result);
            }
          } else {
            setMediaData(result);
          }
          setIsProcessing(false);
        };
        img.onerror = () => setIsProcessing(false);
        img.src = result;
      };
      reader.onerror = () => setIsProcessing(false);
      reader.readAsDataURL(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const setPickerTypeAndOpen = (type: 'image/*' | 'video/*') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type;
      fileInputRef.current.click();
    }
  };

  const handlePost = () => {
    const trimmedLink = link.trim();
    const trimmedContact = contact.trim();

    // Require either link or contact
    if (trimmedLink === '' && trimmedContact === '') {
      setShowValidationErrors(true);
      return;
    }

    // Validate contact digits length if entered
    if (trimmedContact !== '' && trimmedContact.length !== 10 && trimmedContact.length !== 11) {
      setShowValidationErrors(true);
      return;
    }

    if (!mediaData || !mediaType) {
      setShowValidationErrors(true);
      return;
    }

    // Save to scopedStorage as an object
    try {
      const allAds = getAds();
      
      const newAd = {
        id: Date.now().toString(),
        type: 'ad',
        mediaType: mediaType === 'photo' ? 'image' : 'video',
        src: mediaData,
        link: link,
        contact: contact,
        action: selectedAction,
        ownerId: currentUsername,
        createdAt: Date.now()
      };

      console.log('Saving to booran_ads_v3:', newAd);
      allAds.unshift(newAd);
      saveAds(allAds);
      
      setShowValidationErrors(false);

      // Dispatch event to notify feed to update
      window.dispatchEvent(new Event('booran_posts_updated'));
      window.dispatchEvent(new Event('adsUpdated'));
    } catch (error) {
      console.warn("Storage quota exceeded or error saving ad:", error);
      alert("Notice: File may be too large to save fully in local browser storage.");
    }

    if (onPostAd) {
      onPostAd('Ad Post', mediaData, mediaType, link, contact);
    }
    
    // Go back
    onBack();
  };

  if (showHistory) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-black text-white p-4 relative overflow-y-auto w-full max-w-md mx-auto">
        <header className="flex items-center space-x-3 mb-6 pt-2">
          <button onClick={() => setShowHistory(false)} className="p-1 hover:opacity-75 transition-opacity">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-[17px] font-medium tracking-wide">My Advertisements</h1>
        </header>

        <div className="space-y-4">
          {historyPosts.length === 0 ? (
            <div className="text-zinc-500 text-center py-10 text-sm">No advertisements posted yet.</div>
          ) : (
            historyPosts.map(post => (
              <div key={post.id} className="flex gap-4 items-center bg-[#1C1C1E] p-3 rounded-[14px]">
                <div className="w-16 h-16 bg-zinc-800 rounded flex-shrink-0 overflow-hidden">
                  {post.mediaType === 'video' ? (
                    <video src={post.src || undefined} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={post.src || undefined} className="w-full h-full object-cover" alt="ad preview" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-white">Contact: {post.contact || 'N/A'} | Link: {post.link || 'N/A'}</div>
                  <div className="text-xs text-zinc-500 capitalize">{post.mediaType} ad</div>
                </div>
                <button onClick={() => deleteAd(post.id)} className="p-2 text-red-500 hover:bg-black rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-black text-white p-4 relative overflow-y-auto w-full max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-2">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-1 hover:opacity-75 transition-opacity flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center space-x-2">
            <h1 className="text-[19px] font-semibold tracking-wide text-white uppercase" style={{ textTransform: 'uppercase' }}>OWN ADVERTISEMENT</h1>
            <button 
              onClick={() => setShowHistory(true)} 
              className="p-1 hover:opacity-75 transition-opacity flex items-center justify-center text-white"
              title="MY ADVERTISEMENTS"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button 
          onClick={handlePost}
          disabled={isProcessing}
          className={`px-5 py-1.5 rounded-full font-bold text-[15px] transition-colors uppercase ${
            isProcessing 
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" 
              : "bg-[#007AFF] text-white hover:bg-blue-600"
          }`}
          style={{ textTransform: 'uppercase' }}
        >
          {isProcessing ? "LOADING..." : "POST"}
        </button>
      </header>

      <div className="text-2xl font-bold mb-3 tracking-tight text-white uppercase" style={{ textTransform: 'uppercase' }}>DETAILS</div>
      
      {/* Link Field */}
      <div className="mb-3">
        <label className="text-[13px] font-extrabold tracking-wider uppercase text-zinc-100 block mb-2" style={{ textTransform: 'uppercase' }}>
          1. LINK
        </label>
        <input 
          type="text" 
          value={link}
          onChange={e => {
            setLink(e.target.value);
            if (showValidationErrors) setShowValidationErrors(false);
          }}
          className={`w-full bg-[#1C1C1E] text-white p-3 rounded-[12px] outline-none border transition-all uppercase ${
            showValidationErrors && link.trim() === '' && contact.trim() === ''
              ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
              : 'border-transparent focus:border-zinc-700'
          }`}
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {/* Styled (OR) Separator */}
      <div className="flex items-center justify-center my-2">
        <span className="text-[11px] font-black text-zinc-400 tracking-widest uppercase">(OR)</span>
      </div>

      {/* Contact Field */}
      <div className="mb-5">
        <label className="text-[13px] font-extrabold tracking-wider uppercase text-zinc-100 block mb-2" style={{ textTransform: 'uppercase' }}>
          CONTACT <span className="text-zinc-400 text-xs font-normal">(10 OR 11 DIGITS)</span>
        </label>
        <input 
          type="text" 
          value={contact}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
            setContact(val);
            if (showValidationErrors) setShowValidationErrors(false);
          }}
          maxLength={11}
          placeholder="E.G. 9876543210 (OR) 98765432101"
          className={`w-full bg-[#1C1C1E] text-white p-3 rounded-[12px] outline-none border transition-all uppercase ${
            (showValidationErrors && link.trim() === '' && contact.trim() === '') ||
            (showValidationErrors && contact.trim() !== '' && contact.trim().length !== 10 && contact.trim().length !== 11)
              ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
              : 'border-transparent focus:border-zinc-700'
          }`}
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {/* Media Select */}
      <div className="mb-5">
        <label className="text-[13px] font-extrabold tracking-wider uppercase text-zinc-100 block mb-3" style={{ textTransform: 'uppercase' }}>
          2. IMAGE (OR) VIDEO
        </label>
        <div className="flex gap-3 w-full">
          <button 
            type="button"
            onClick={() => {
              setPickerTypeAndOpen('image/*');
              if (showValidationErrors) setShowValidationErrors(false);
            }}
            className={`flex-1 py-3 px-4 rounded-[12px] font-bold text-[13px] tracking-wider uppercase text-center transition-all ${
              mediaType === 'photo' 
                ? 'bg-[#007AFF] text-white shadow-md' 
                : `text-zinc-300 hover:text-white ${
                    showValidationErrors && (!mediaData || !mediaType)
                      ? 'bg-[#1C1C1E] border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : 'bg-[#1C1C1E] border border-transparent hover:bg-zinc-800'
                  }`
            }`}
            style={{ textTransform: 'uppercase' }}
          >
            IMAGE
          </button>
          <button 
            type="button"
            onClick={() => {
              setPickerTypeAndOpen('video/*');
              if (showValidationErrors) setShowValidationErrors(false);
            }}
            className={`flex-1 py-3 px-4 rounded-[12px] font-bold text-[13px] tracking-wider uppercase text-center transition-all ${
              mediaType === 'video' 
                ? 'bg-[#007AFF] text-white shadow-md' 
                : `text-zinc-300 hover:text-white ${
                    showValidationErrors && (!mediaData || !mediaType)
                      ? 'bg-[#1C1C1E] border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : 'bg-[#1C1C1E] border border-transparent hover:bg-zinc-800'
                  }`
            }`}
            style={{ textTransform: 'uppercase' }}
          >
            VIDEO
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*,video/*" 
          className="hidden" 
          onChange={handleFileSelect} 
        />
      </div>

      {/* Preview & Interaction Row */}
      <div className="flex items-start gap-6 mt-4">
        {/* Media Preview Box */}
        <div 
          onClick={isProcessing ? undefined : openFilePicker}
          className={`w-32 h-32 bg-[#2C2C2E] flex items-center justify-center cursor-pointer overflow-hidden rounded-[14px] relative shadow-sm flex-shrink-0 transition-all ${
            showValidationErrors && (!mediaData || !mediaType)
              ? 'border-2 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'border border-zinc-700'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-1.5 p-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider" style={{ textTransform: 'uppercase' }}>PROCESSING...</span>
            </div>
          ) : mediaData ? (
            mediaType === 'video' ? (
              <div className="w-full h-full relative group">
                <video 
                  src={mediaData} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  loop 
                  muted={isPreviewMuted} 
                  playsInline 
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPreviewMuted(!isPreviewMuted);
                  }}
                  className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-full text-white z-10 hover:bg-black/85 transition-all flex items-center justify-center border border-white/10"
                >
                  {isPreviewMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#007AFF] stroke-[2.5]" />
                  )}
                </button>
              </div>
            ) : (
              <img src={mediaData} className="w-full h-full object-cover" alt="Selected media preview" />
            )
          ) : (
            <Plus className="w-8 h-8 text-zinc-300" strokeWidth={2.5} />
          )}
        </div>

        {/* Right-side list - Interactive single-select action group */}
        <div className="flex flex-col flex-1">
          <div className="text-[13px] font-extrabold tracking-wider uppercase text-zinc-100 block mb-3" style={{ textTransform: 'uppercase' }}>
            3. SELECT ACTION
          </div>
          <div className="flex flex-col space-y-4 text-[13px] font-bold tracking-widest uppercase text-white justify-center py-1" style={{ textTransform: 'uppercase' }}>
            
            <button 
              type="button" 
              onClick={() => setSelectedAction('APPLY')} 
              className={`flex items-center justify-between w-full text-left font-bold transition-all ${
                selectedAction === 'APPLY' ? 'text-[#007AFF]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>APPLY</span>
              {selectedAction === 'APPLY' && (
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => setSelectedAction('LINK')} 
              className={`flex items-center justify-between w-full text-left font-bold transition-all ${
                selectedAction === 'LINK' ? 'text-[#007AFF]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>LINK</span>
              {selectedAction === 'LINK' && (
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
   
            <button 
              type="button" 
              onClick={() => setSelectedAction('CONTACT')} 
              className={`flex items-center justify-between w-full text-left font-bold transition-all ${
                selectedAction === 'CONTACT' ? 'text-[#007AFF]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>CONTACT</span>
              {selectedAction === 'CONTACT' && (
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
   
            <button 
              type="button" 
              onClick={() => setSelectedAction('SHOP')} 
              className={`flex items-center justify-between w-full text-left font-bold transition-all ${
                selectedAction === 'SHOP' ? 'text-[#007AFF]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>SHOP</span>
              {selectedAction === 'SHOP' && (
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => setSelectedAction('SUBSCRIBE')} 
              className={`flex items-center justify-between w-full text-left font-bold transition-all ${
                selectedAction === 'SUBSCRIBE' ? 'text-[#007AFF]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>SUBSCRIBE</span>
              {selectedAction === 'SUBSCRIBE' && (
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => setSelectedAction('NONE')} 
              className={`flex items-center justify-between w-full text-left font-bold transition-all ${
                selectedAction === 'NONE' ? 'text-[#007AFF]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>NONE</span>
              {selectedAction === 'NONE' && (
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
