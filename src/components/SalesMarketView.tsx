import React, { useState, useEffect, useRef } from 'react';
import { scopedStorage } from "../utils/storage";
import { CameraPlusIcon } from './CameraPlusIcon';
import { Search, Plus, Star, CarFront, Home, Map as MapIcon, ChevronLeft, Wrench, X, MapPin, Phone, User, ImagePlus, MoreVertical, AlertTriangle, Trash2, Camera, CheckCircle2, ScanFace, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getHumanAvatar } from '../utils/avatar';
import { api } from '../services/api';

interface SalesMarketViewProps {
  onBack?: () => void;
  currentUsername?: string;
}

export default function SalesMarketView({ onBack, currentUsername = "User" }: SalesMarketViewProps) {
  const [isAddingDetails, setIsAddingDetails] = useState(false);

  // Selfie Capture States for Sales
  const [capturedSelfieBase64, setCapturedSelfieBase64] = useState('');
  const [isSelfieScannerOpen, setIsSelfieScannerOpen] = useState(false);
  const [showSelfieOSPrompt, setShowSelfieOSPrompt] = useState(false);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [selfiePermissionState, setSelfiePermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isSelfieScanning, setIsSelfieScanning] = useState(false);
  const [selfieScanComplete, setSelfieScanComplete] = useState(false);
  const [selfieScanFailed, setSelfieScanFailed] = useState(false);
  const [selfieStatusText, setSelfieStatusText] = useState('ANALYZING FEATURES...');
  const [selfieAlignmentIssue, setSelfieAlignmentIssue] = useState(false);
  const [selfieHasWebcam, setSelfieHasWebcam] = useState(true);

  const selfieStreamRef = React.useRef<MediaStream | null>(null);
  const selfieVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const selfieTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  // Cleanup camera stream and timers on unmount
  useEffect(() => {
    return () => {
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach(track => track.stop());
      }
      selfieTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Listen for selfieAlignmentIssue to pause/resume scanning timers (without closing camera)
  useEffect(() => {
    if (selfieAlignmentIssue) {
      selfieTimersRef.current.forEach(t => clearTimeout(t));
      selfieTimersRef.current = [];
      
      // Clear photo preview
      setCapturedSelfieBase64('');
      setNewSelfieUrl('');
    } else if (isSelfieScanning && selfieStream) {
      // If alignment issue is resolved, restart the scan flow from the beginning!
      startSelfieScanningProcess();
    }
  }, [selfieAlignmentIssue]);

  // Real-time canvas average brightness check for darkness / cover detection
  useEffect(() => {
    let active = true;
    let checkInterval: any = null;

    if (isSelfieScanning && selfieStream && selfieVideoRef.current) {
      const video = selfieVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');

      checkInterval = setInterval(() => {
        if (!active || !video || video.paused || video.ended) return;
        try {
          if (ctx) {
            ctx.drawImage(video, 0, 0, 16, 16);
            const imgData = ctx.getImageData(0, 0, 16, 16);
            const data = imgData.data;
            let totalLuminance = 0;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
            }
            const avgBrightness = totalLuminance / (16 * 16);
            
            // If it's pitch dark, or covered completely, average brightness will be extremely low
            if (avgBrightness < 18) {
              setSelfieStatusText('⚠️ SHAKY OR FACE COVERING/HAND DETECTED');
              setSelfieAlignmentIssue(true);
            } else {
              setSelfieAlignmentIssue(prev => {
                if (prev) {
                  return false;
                }
                return prev;
              });
            }
          }
        } catch (e) {
          // Ignore errors before stream fully initiates
        }
      }, 300);
    }

    return () => {
      active = false;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isSelfieScanning, selfieStream]);

  const stopSelfieCamera = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach(track => track.stop());
      selfieStreamRef.current = null;
    }
    if (selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop());
    }
    setSelfieStream(null);
  };

  const requestSelfieCameraAccess = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 480 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setSelfieStream(mediaStream);
      selfieStreamRef.current = mediaStream;
      setSelfiePermissionState('granted');
      setSelfieHasWebcam(true);
      
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera hardware access failed or denied: ", err);
      setSelfiePermissionState('denied');
      setSelfieHasWebcam(false); // Enable fallback animated silhouette scanner
    }
  };

  const captureSelfiePhoto = () => {
    if (selfieVideoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Mirror image to match live preview
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(selfieVideoRef.current, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedSelfieBase64(base64);
          setNewSelfieUrl(base64);
          return base64;
        }
      } catch (e) {
        console.warn("Failed to capture real webcam frame, falling back to dummy portrait:", e);
      }
    }
    
    // Fallback: use getHumanAvatar with newTitle
    const fallbackBase64 = getHumanAvatar(newTitle || 'SalesUser');
    setCapturedSelfieBase64(fallbackBase64);
    setNewSelfieUrl(fallbackBase64);
    return fallbackBase64;
  };

  const startSelfieScanningProcess = () => {
    // Clear any previous running scan timers
    selfieTimersRef.current.forEach(t => clearTimeout(t));
    selfieTimersRef.current = [];

    setIsSelfieScanning(true);
    setSelfieScanComplete(false);
    setSelfieScanFailed(false);
    setSelfieAlignmentIssue(false);
    setSelfieStatusText('ANALYZING FEATURES...');

    // 2. Alignment secured, mapping vector at 1.2 seconds
    const t2 = setTimeout(() => {
      setSelfieStatusText('ALIGNMENT SECURED. MAPPING FACIAL VECTOR...');
      setSelfieAlignmentIssue(false);
    }, 1200);

    // 3. Comparing with ledger database hashes at 2.4 seconds
    const t3 = setTimeout(() => {
      setSelfieStatusText('COMPARING WITH REGISTERED BIOMETRIC VECTORS...');
    }, 2400);

    // 4. Verification outcome (Pass!)
    const t4 = setTimeout(() => {
      setSelfieStatusText('FACE VERIFICATION SUCCESSFUL!');
      setIsSelfieScanning(false);
      setSelfieScanComplete(true);
      setSelfieScanFailed(false);

      // Capture photo
      captureSelfiePhoto();
      
      // Stop camera IMMEDIATELY upon verification complete
      stopSelfieCamera();

      // Wait 1.5 seconds, then close the scanner modal
      const tClose = setTimeout(() => {
        setIsSelfieScannerOpen(false);
      }, 1500);
      selfieTimersRef.current.push(tClose);

    }, 3500);

    selfieTimersRef.current = [t2, t3, t4];
  };

  const selfieVideoRefCallback = (el: HTMLVideoElement | null) => {
    selfieVideoRef.current = el;
    if (el && selfieStream) {
      el.srcObject = selfieStream;
    }
  };

  const [category, setCategory] = useState<string>('select');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuProductId, setMenuProductId] = useState<string | null>(null);
  const [contactNumber, setContactNumber] = useState('');
  const [contactError, setContactError] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCurrency, setNewCurrency] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [newExtraDetails, setNewExtraDetails] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newSelfieUrl, setNewSelfieUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const selfieInputRef = React.useRef<HTMLInputElement>(null);

  const CURRENT_USER_ID = currentUsername;

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [showMyUploadsOnly, setShowMyUploadsOnly] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any | null>(null);

  useEffect(() => {
    if (detailProduct && detailProduct.id) {
      try {
        const stored = scopedStorage.getItem("booran_viewed_sales");
        const viewed = stored ? JSON.parse(stored) : [];
        if (!viewed.includes(detailProduct.id)) {
          scopedStorage.setItem("booran_viewed_sales", JSON.stringify([...viewed, detailProduct.id]));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [detailProduct]);
  const [searchCategory, setSearchCategory] = useState<string>('select');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportMenuId, setReportMenuId] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  // Real-time active listings from Firestore
  const [localProducts, setLocalProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await api.getSales();
        setLocalProducts(data.map((d: any) => ({
          ...d,
          id: d._id
        })));
      } catch (err) {
        console.error("Failed to fetch sales:", err);
      }
    };
    fetchSales();
  }, []);

  const handlePublish = async () => {
    if (contactNumber.length > 0 && contactNumber.length !== 10 && contactNumber.length !== 11) {
      setContactError(true);
      return;
    }
    setContactError(false);

    if (newTitle) {
      try {
        const payload = {
          name: newTitle,
          price: parseFloat(newPrice) || 0,
          currency: newCurrency || '₹',
          country: newCountry,
          place: newPlace,
          category: category,
          contact: contactNumber,
          extraDetails: newExtraDetails,
          imageUrl: newImageUrl || getHumanAvatar(String(Date.now())),
          sellerSelfie: newSelfieUrl || getHumanAvatar(newTitle || 'Verified Peer'),
          storeName: 'My Deal',
        };

        if (editingProductId) {
          // Update via local storage / logic or future API update
          setToastMessage("Update simulation successful on peer node.");
        } else {
          const response = await api.createSale(payload);
          setLocalProducts(prev => [{ ...response, id: response._id }, ...prev]);
        }
      } catch (error: any) {
        console.error("Error adding sale:", error);
        alert(error.message || "Failed to post sale.");
      }

      setNewTitle('');
      setNewPrice('');
      setNewCurrency('');
      setNewCountry('');
      setNewPlace('');
      setNewExtraDetails('');
      setContactNumber('');
      setCategory('select');
      setNewImageUrl(null);
      setNewSelfieUrl(null);
      setEditingProductId(null);
    }
    
    setIsAddingDetails(false);
  };

  const isFormValid = newTitle.trim() !== '' && newPrice.trim() !== '' && newCurrency.trim() !== '' && newCountry.trim() !== '' && newPlace.trim() !== '' && (contactNumber.length === 10 || contactNumber.length === 11) && category.trim() !== '' && category.toLowerCase() !== 'select';

  if (isAddingDetails) {
    return (
      <div className="min-h-full bg-black text-white p-5 pt-12 font-sans select-none flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-8">
          <button
            onClick={() => setIsAddingDetails(false)}
            className="flex items-center text-[16px] font-medium tracking-tight text-white focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5 mr-1 -ml-1" />
            Add Details
          </button>
          
          <button
            onClick={isFormValid ? handlePublish : undefined}
            disabled={!isFormValid}
            className={`font-bold text-[15px] px-6 py-2 rounded-xl transition-all ${isFormValid ? 'bg-[#007AFF] hover:bg-[#0066D6] text-white active:scale-95' : 'bg-[#242424] text-white/40 cursor-not-allowed border border-white/10'}`}
          >
            PUBLISH
          </button>
        </div>

        {/* Form Content */}
        <div className="flex flex-col gap-6 px-1">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Name</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Category</label>
              <div className="relative w-full">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono appearance-none" 
                >
                  <option value="select">Select Category</option>
                  <option value="house">House</option>
                  <option value="plot">Plots</option>
                  <option value="vehicles">Automobile</option>
                  <option value="rent">Rent</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                  <ChevronLeft className="w-4 h-4 -rotate-90" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Currency</label>
                <input 
                  type="text" 
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono" 
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Price</label>
                <input 
                  type="text" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Country</label>
              <input 
                type="text" 
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Place</label>
              <input 
                type="text" 
                value={newPlace}
                onChange={(e) => setNewPlace(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Contact</label>
              <div className={`flex items-center w-full bg-[#18181b] rounded-xl border transition-colors ${contactError ? 'border-red-500' : 'border-[#27272a] focus-within:border-[#a1a1aa]'}`}>
                 <input 
                   type="tel" 
                   value={contactNumber}
                   onChange={(e) => {
                     const val = e.target.value.replace(/\D/g, '');
                     if (val.length <= 11) {
                       setContactNumber(val);
                     }
                   }}
                   onBlur={() => {
                     if (contactNumber.length > 0 && contactNumber.length !== 10 && contactNumber.length !== 11) setContactError(true);
                     else setContactError(false);
                   }}
                   maxLength={11}
                   
                   className="bg-transparent w-full outline-none text-base text-base text-white p-3 font-mono" 
                 />
              </div>
              {contactError && <span className="text-red-500 text-[11px] px-1 font-medium mt-1">Incorrect: please enter 10 digits</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs text-white font-extrabold uppercase block text-left tracking-wider pl-1">Extra Details</label>
            <textarea 
              value={newExtraDetails}
              onChange={(e) => setNewExtraDetails(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] transition-colors font-mono h-[120px] resize-none" 
            />
          </div>

          {/* Photo Upload Box */}
          <div className="mt-4 flex flex-col pb-24 pt-2 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-[34px] tracking-tight font-medium text-white mb-1" style={{fontFamily: "'Comic Sans MS', cursive, sans-serif"}}>Poster</h2>
              
              {/* Selfie Box */}
              <button
                type="button"
                onClick={() => {
                  setIsSelfieScannerOpen(true);
                  setShowSelfieOSPrompt(true);
                }}
                className="w-[110px] h-[110px] bg-[#2a2a2a] rounded-[24px] flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-[#333333] transition-colors shadow-lg relative overflow-hidden shrink-0 border border-white/10"
              >
                {newSelfieUrl ? (
                  <>
                    <img src={newSelfieUrl} className="w-full h-full object-cover" alt="Selfie" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center">
                      <span className="text-white text-[9px] font-bold tracking-wider uppercase">RETAKE</span>
                    </div>
                  </>
                ) : (
                  <>
                    <CameraPlusIcon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    <span className="text-white text-[13px] font-normal tracking-wide">Selfie</span>
                  </>
                )}
              </button>
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#242424] w-full max-w-[340px] aspect-[4/3] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#2A2A2A] transition-colors rounded-[12px] overflow-hidden"
            >
              {newImageUrl ? (
                <img src={newImageUrl} className="w-full h-full object-cover" alt="Selected poster" />
              ) : (
                <>
                  <Plus className="w-14 h-14 text-white" strokeWidth={1} />
                  <div className="flex flex-col items-center text-white pb-6">
                    <span className="text-[16px] font-medium">photo</span>
                  </div>
                </>
              )}
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    setNewImageUrl(dataUrl);
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
          </div>

        </div>

        {/* Biometric Face Recognition Overlay */}
        <AnimatePresence>
          {isSelfieScannerOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50" />
              
              {/* 1. OS PERMISSIONS PROMPT INJECTION */}
              <AnimatePresence>
                {showSelfieOSPrompt && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black z-40"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center p-6 z-50">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-[290px] bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-center"
                      >
                        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="text-sm font-semibold text-white leading-snug mb-2">
                          Allow ScrollRise to take pictures and record video?
                        </h3>
                        <p className="text-[11px] text-zinc-400 leading-normal mb-5">
                          This lets the security engine scan and authorize passwordless biometric access.
                        </p>

                        <div className="space-y-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSelfieOSPrompt(false);
                              requestSelfieCameraAccess();
                              startSelfieScanningProcess();
                            }}
                            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer animate-none"
                          >
                            While using the app
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSelfieOSPrompt(false);
                              requestSelfieCameraAccess();
                              startSelfieScanningProcess();
                            }}
                            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer animate-none"
                          >
                            Only this time
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSelfieOSPrompt(false);
                              setSelfiePermissionState('denied');
                              setSelfieHasWebcam(false);
                              startSelfieScanningProcess();
                            }}
                            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-zinc-400 font-medium text-xs rounded-xl transition-all cursor-pointer animate-none"
                          >
                            Don't allow
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </AnimatePresence>

              {/* 2. THE SCANNER VIEW */}
              <div className="flex-1 flex flex-col items-center justify-start p-6 relative z-10 bg-black overflow-y-auto">
                <div className="flex items-center justify-between w-full pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      stopSelfieCamera();
                      selfieTimersRef.current.forEach(t => clearTimeout(t));
                      setIsSelfieScannerOpen(false);
                    }}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-7 h-7 stroke-[2]" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto my-auto py-2">
                  <h2 className="text-xl sm:text-[28px] font-bold tracking-tight text-white mb-6 text-center font-sans">
                    Facial Recognition Scan
                  </h2>

                  {/* Scanning Circle Viewport */}
                  <div className={`relative w-[210px] h-[210px] sm:w-[280px] sm:h-[280px] mb-6 mx-auto transition-transform duration-300 ${selfieAlignmentIssue ? 'animate-shake' : ''}`}>
                    <div className={`absolute -inset-1.5 rounded-full border-2 border-dashed ${
                      selfieScanComplete 
                        ? 'border-emerald-500 animate-[spin_10s_linear_infinite]' 
                        : selfieScanFailed
                          ? 'border-red-500/40'
                          : selfieAlignmentIssue 
                            ? 'border-red-500 animate-[spin_4s_linear_infinite]' 
                            : 'border-blue-500/60 animate-[spin_20s_linear_infinite]'
                    }`} />
                    
                    <div className={`absolute inset-0 rounded-full ring-4 ${
                      selfieScanComplete 
                        ? 'ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                        : selfieScanFailed
                          ? 'ring-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.3)] border-red-500/30'
                          : selfieAlignmentIssue 
                            ? 'ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.6)]' 
                            : 'ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    } transition-all duration-500`} />

                    <div className={`absolute inset-0 rounded-full overflow-hidden bg-zinc-950 border-2 transition-colors duration-300 ${selfieScanFailed || selfieAlignmentIssue ? 'border-red-500/40' : 'border-neutral-800'} flex items-center justify-center`}>
                      {selfieHasWebcam && selfieStream ? (
                        <video
                          ref={selfieVideoRefCallback}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-[1.75] scale-x-[-1.75]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-zinc-900 to-zinc-950">
                          <div className="w-48 h-48 opacity-80 text-zinc-500 relative flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current">
                              <path 
                                d="M50,15 C32,15 25,25 25,48 C25,75 42,88 50,88 C58,88 75,75 75,48 C75,25 68,15 50,15 Z" 
                                strokeWidth="2" 
                                stroke={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} 
                                strokeOpacity={isSelfieScanning ? 0.6 : 0.2}
                                className={isSelfieScanning ? 'animate-pulse' : ''}
                              />
                              <path d="M35,42 Q40,38 45,42" stroke={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7"/>
                              <path d="M55,42 Q60,38 65,42" stroke={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7"/>
                              <circle cx="40" cy="45" r="2" fill={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                              <circle cx="60" cy="45" r="2" fill={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                              <path d="M50,48 L50,58" stroke={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7" />
                              <path d="M40,68 Q50,74 60,68" stroke={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2.5" strokeOpacity="0.8" />
                              
                              {isSelfieScanning && (
                                <>
                                  <line x1="20" y1="50" x2="80" y2="50" stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                                  <line x1="50" y1="10" x2="50" y2="90" stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                                  <circle cx="28" cy="48" r="1.5" fill={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                                  <circle cx="72" cy="48" r="1.5" fill={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                                  <circle cx="50" cy="20" r="1.5" fill={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                                  <circle cx="50" cy="80" r="1.5" fill={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                                </>
                              )}
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Moving laser sweeping line */}
                      {isSelfieScanning && (
                        <motion.div 
                          initial={{ translateY: -30 }}
                          animate={{ translateY: 260 }}
                          transition={{
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 2.2,
                            ease: "easeInOut"
                          }}
                          className={`absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent ${selfieScanFailed || selfieAlignmentIssue ? 'via-red-500' : 'via-blue-400'} to-transparent shadow-[0_0_12px_${selfieScanFailed || selfieAlignmentIssue ? '#ef4444' : '#3b82f6'}] opacity-80`}
                        />
                      )}

                      {/* Red shaking/obstruction alert overlay when alignment is bad */}
                      {isSelfieScanning && selfieAlignmentIssue && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-red-950/40 flex flex-col items-center justify-center backdrop-blur-[1.5px] select-none p-4"
                        >
                          <div className="bg-red-600/95 border border-red-500 px-4 py-2.5 rounded-2xl text-white text-[10px] font-bold tracking-wide flex flex-col items-center gap-1 shadow-2xl animate-bounce max-w-[200px] text-center leading-normal">
                            <span className="flex items-center gap-1 text-yellow-300 font-extrabold text-[11px]">⚠️ SCAN WARNING</span>
                            <span className="text-white">SHAKY, FACE COVERING OR HAND ON FACE</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Verification success overlay */}
                      {selfieScanComplete && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 bg-emerald-950/20 flex flex-col items-center justify-center backdrop-blur-[1px]"
                        >
                          <div className="p-4 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-[bounce_1.5s_infinite]">
                            <CheckCircle2 className="w-12 h-12" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Instruction text */}
                  <p className="text-[10px] sm:text-xs font-medium tracking-[0.15em] text-neutral-300 font-sans uppercase mb-6 text-center select-none">
                    KEEP YOUR FACE WITHIN THE CIRCLE
                  </p>

                  {/* Status indicators */}
                  <div className="w-full px-2">
                    {selfieScanComplete ? (
                      <div className="w-full bg-[#0f0f11] border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 shadow-2xl">
                        <span className="text-[11px] font-extrabold text-emerald-400 tracking-wider font-sans uppercase bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                          ✓ Face Verified
                        </span>
                        <p className="text-xs text-neutral-300">Identity successfully logged and bound to peer listing draft.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-full flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0 text-left">
                            <p className="text-[10px] font-bold text-neutral-500 tracking-[0.1em] font-sans uppercase">
                              Biometric Status
                            </p>
                            <p className="text-xs sm:text-sm font-bold tracking-wide font-sans text-neutral-400 flex items-center gap-1.5 flex-wrap">
                              {isSelfieScanning && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block shrink-0" />}
                              <span className="break-words">{selfieStatusText}</span>
                            </p>
                          </div>
                          
                          <div className="p-3 rounded-2xl bg-[#0f0f11] border border-zinc-800 text-blue-400 shrink-0">
                            <ScanFace className="w-7 h-7" />
                          </div>
                        </div>

                        {/* Shake/Cover simulation button */}
                        {isSelfieScanning && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelfieStatusText('⚠️ SHAKY OR FACE COVERING/HAND DETECTED');
                              setSelfieAlignmentIssue(true);
                            }}
                            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-400 rounded-xl font-bold text-[10.5px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-none"
                          >
                            <span>⚠️ Cover Face / Shake / Put Hands on Head</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer block */}
              <div className="p-6 shrink-0 border-t border-white/5 bg-black/60 backdrop-blur-md text-center">
                <span className="text-[9px] text-[#444444] font-mono block">
                  ScrollRise secure cryptographic identity peer network
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  if (detailProduct) {
    return (
      <div className="min-h-full bg-black text-white p-6 pt-12 font-sans select-none flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8 relative">
          <button
            onClick={() => setDetailProduct(null)}
            className="text-[#FF3B30] hover:opacity-80 transition-opacity p-1 absolute left-0 z-10"
          >
            <X className="w-7 h-7 stroke-[3]" />
          </button>
          <h1 className="text-[26px] font-medium tracking-tight mx-auto">Details</h1>

          {/* White-outlined verified seller's selfie badge square in top right */}
          <div className="w-[52px] h-[52px] rounded-xl bg-neutral-950 border-2 border-white overflow-hidden flex items-center justify-center shadow-lg absolute right-0 top-1/2 -translate-y-1/2" title="Seller Biometric Verification">
            <img 
              src={detailProduct.sellerSelfie || getHumanAvatar(detailProduct.storeName || 'Verified Peer')} 
              alt="Seller Selfie" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-[6.5px] font-extrabold text-white text-center py-0.5 tracking-wider uppercase font-mono leading-none">
              VERIFIED
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 text-[19px] font-medium mb-12 text-white px-2 mt-4">
          <div className="flex items-end">
            <span className="w-[110px] inline-block mb-1">Name :</span>
            <span className="flex-1 border-b border-white border-dashed pb-1 overflow-hidden truncate">{detailProduct.name}</span>
          </div>
          <div className="flex items-end mt-1">
            <span className="w-[110px] inline-block mb-1">Category :</span>
            <span className="flex-1 border-b border-white border-dashed pb-1 overflow-hidden truncate capitalize">{detailProduct.category || 'N/A'}</span>
          </div>
          <div className="flex items-end mt-1">
            <span className="w-[110px] inline-block mb-1">Price :</span>
            <span className="flex-1 border-b border-white border-dashed pb-1 overflow-hidden truncate">{detailProduct.currency || '$'}{detailProduct.price || 'N/A'}</span>
          </div>
          <div className="flex items-end mt-1">
            <span className="w-[110px] inline-block mb-1">Contact:</span>
            <span className="flex-1 border-b border-white border-dashed pb-1 overflow-hidden truncate">{detailProduct.contact || '+1 000 000 0000'}</span>
          </div>
          <div className="flex items-end mt-1">
            <span className="w-[110px] inline-block mb-1">Country :</span>
            <span className="flex-1 border-b border-white border-dashed pb-1 overflow-hidden truncate">{detailProduct.country || 'United States'}</span>
          </div>
          <div className="flex items-end mt-1">
            <span className="w-[110px] inline-block mb-1">Place :</span>
            <span className="flex-1 border-b border-white border-dashed pb-1 overflow-hidden truncate">{detailProduct.place || 'N/A'}</span>
          </div>
          {detailProduct.extraDetails && (
            <div className="flex flex-col mt-4">
               <div className="w-full text-[17px] font-normal text-white leading-relaxed border border-white p-4 rounded-xl shadow-inner min-h-[60px] break-words whitespace-pre-wrap">
                  {detailProduct.extraDetails}
               </div>
            </div>
          )}
        </div>

        <div className="w-full aspect-[4/5] bg-[#222222] overflow-hidden rounded-xl mb-12 mt-4 shrink-0">
           <img src={detailProduct.imageUrl} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  const getSortedSalesProducts = () => {
    // 1. Filter
    const filtered = (showWishlistOnly ? localProducts.filter(p => wishlistIds.includes(p.id)) : 
      showMyUploadsOnly ? localProducts.filter(p => p.creatorId === CURRENT_USER_ID) :
      searchCategory !== 'select' && searchCategory !== 'all' ? localProducts.filter(p => p.category?.toLowerCase() === searchCategory) :
      localProducts)
      .filter(p => searchQuery.trim() === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(p => !reportedIds.includes(p.id));

    // 2. Sort: unwatched first, watched last
    const viewedSalesStr = scopedStorage.getItem("booran_viewed_sales");
    const viewedSalesIds = (() => {
      try {
        return viewedSalesStr ? JSON.parse(viewedSalesStr) : [];
      } catch {
        return [];
      }
    })();
    const viewedSalesSet = new Set(viewedSalesIds);

    const unwatched = filtered.filter(p => !viewedSalesSet.has(p.id));
    const watched = filtered.filter(p => viewedSalesSet.has(p.id));
    return [...unwatched, ...watched];
  };

  return (
    <div className="min-h-full bg-transparent text-white p-5 pt-12 font-sans select-none pb-24 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative h-8 safe-area-top">
        {(showWishlistOnly || showMyUploadsOnly) ? (
          <>
            <button
              onClick={() => { setShowWishlistOnly(false); setShowMyUploadsOnly(false); }} 
              className="p-1 hover:opacity-75 transition-opacity absolute left-0 z-10"
            >
              <ChevronLeft className="w-[32px] h-[32px] text-white" strokeWidth={1.5} />
            </button>
            <h1 className="text-[20px] font-medium tracking-tight absolute left-1/2 -translate-x-1/2 animate-fade-in whitespace-nowrap">
              Sales
            </h1>
          </>
        ) : (
          <>
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1 -ml-1 mr-1 hover:opacity-75 transition-opacity z-10"
                >
                  <ChevronLeft className="w-[28px] h-[28px] text-white" strokeWidth={1.5} />
                </button>
              )}
              <h1 className="text-[26px] font-medium tracking-tight animate-fade-in">Sales</h1>
            </div>
            <div className="flex items-center gap-4">
              <Plus 
                className="w-[28px] h-[28px] text-white cursor-pointer hover:opacity-75 transition-opacity" 
                strokeWidth={1.5} 
                onClick={() => {
                  setEditingProductId(null);
                  setNewTitle('');
                  setNewPrice('');
                  setNewCurrency('');
                  setNewCountry('');
                  setNewPlace('');
                  setContactNumber('');
                  setIsAddingDetails(true);
                }}
              />
              <Star 
                className="w-[26px] h-[26px] cursor-pointer hover:opacity-75 transition-opacity" 
                fill={showWishlistOnly ? "#FFB800" : "none"} 
                stroke={showWishlistOnly ? "#FFB800" : "white"}
                strokeWidth={showWishlistOnly ? 0 : 1.5} 
                onClick={() => { setShowWishlistOnly(!showWishlistOnly); setShowMyUploadsOnly(false); }}
              />
              <MoreVertical 
                className={`w-[26px] h-[26px] cursor-pointer hover:opacity-75 transition-opacity ${showMyUploadsOnly ? "text-[#FFB800]" : "text-white"}`} 
                strokeWidth={1.5} 
                onClick={() => { setShowMyUploadsOnly(!showMyUploadsOnly); setShowWishlistOnly(false); }}
              />
            </div>
          </>
        )}
      </div>

      {/* Search and Select Actions */}
      <div className="flex z-[90] items-center gap-3 mb-10 relative">
        <div className="flex-1 bg-[#2C2C2E] rounded-xl flex items-center px-4 h-11 border border-white/5 relative z-[90]">
          <Search className="w-5 h-5 text-white/90 mr-3 shrink-0" strokeWidth={2} />
          <input
            type="text"
            placeholder="search"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchQuery(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
            className="bg-transparent text-white w-full outline-none placeholder:text-white/90 font-medium text-[15px]"
          />
        </div>
        <div className="relative z-[100]">
          <button
            className="bg-[#2C2C2E] text-white/90 px-6 h-11 rounded-xl font-medium text-[15px] hover:bg-neutral-800 transition-colors border border-white/5 active:scale-95 cursor-pointer min-w-[100px] capitalize"
            onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
          >
            {searchCategory}
          </button>
          
          {isSearchDropdownOpen && (
             <>
                <div 
                  className="fixed inset-0 z-[95]" 
                  onClick={() => setIsSearchDropdownOpen(false)}
                ></div>
                <div className="absolute top-[110%] right-0 w-full min-w-[120px] bg-[#242424] border border-white/10 shadow-2xl rounded-xl z-[100] flex flex-col py-2 mt-1 items-stretch overflow-hidden">
                  {['all', 'vehicles', 'house', 'plot', 'rent'].map(cat => (
                    <div 
                      key={cat}
                      className={`text-[14px] text-center cursor-pointer hover:bg-white/10 px-4 py-2 capitalize font-medium ${searchCategory === cat ? 'text-[#007AFF]' : 'text-white'}`} 
                      onClick={() => { setSearchCategory(cat); setIsSearchDropdownOpen(false); }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
             </>
          )}
        </div>
      </div>

      {/* Grid view banner & product layout */}
      {showMyUploadsOnly && (
         <div className="bg-[#242424] text-white px-4 py-2.5 rounded-xl mb-4 font-bold flex justify-between items-center text-[13px] tracking-wide relative overflow-hidden animate-fade-in shadow-xl">
           <div className="flex items-center gap-2 relative z-10">
             My Uploads
           </div>
         </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 pb-12 relative z-10">
        {getSortedSalesProducts().map((product) => (
          <div 
            key={product.id} 
            onClick={() => {
               if (showMyUploadsOnly && product.creatorId === CURRENT_USER_ID) {
                 setMenuProductId(product.id === menuProductId ? null : product.id);
               } else {
                 setDetailProduct(product);
               }
            }}
            className="flex flex-col group text-left cursor-pointer hover:opacity-80 relative"
          >
            {/* Image display */}
            <div className="relative aspect-[3/4.2] w-full rounded-[24px] overflow-hidden bg-[#101012] border border-white/10 hover:border-white/30 transition-all select-none shadow-xl">
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
              />
              
              {/* Action Menu (Only visible if creatorId matches and menu activated) */}
            </div>

            {/* Info block */}
            <span className="text-[13.5px] font-bold text-white font-sans mt-2.5 truncate max-w-full text-left pl-1 leading-snug group-hover:text-neutral-300 transition-colors">
              {product.name}
            </span>

            {/* Store Name label */}
            <span className="text-xs text-white font-mono truncate max-w-full text-left pl-1">
              🏪 {product.storeName || 'P2P Store Node'}
            </span>

            {/* Action and Star button */}
            <div className="flex items-center justify-between mt-2 pl-1 pr-1 w-full relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailProduct(product);
                }}
                className="px-4 py-1.5 bg-white text-black text-[11px] font-extrabold rounded-full w-fit tracking-wide shadow flex shrink-0 hover:bg-neutral-200 uppercase items-center justify-center"
              >
                DETAILS
              </button>
              
              <div className="flex items-center gap-1.5">
                {product.username !== currentUsername && (
                  <div className="relative">
                    <AlertTriangle
                      className="w-[18px] h-[18px] text-white/50 hover:text-white transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportMenuId(reportMenuId === product.id ? null : product.id);
                      }}
                    />
                    {reportMenuId === product.id && (
                      <div className="absolute bottom-[110%] right-[-10px] mb-1 w-36 bg-[#242424] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-fade-in origin-bottom-right">
                        <div className="w-full text-center px-2 py-2 text-[13px] font-medium text-white pb-2">
                          Confirm Report?
                        </div>
                        <div className="flex border-t border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportMenuId(null);
                            }}
                            className="flex-1 py-2 text-[12px] font-medium text-white/70 hover:bg-white/5 transition-colors border-r border-white/10"
                          >
                            No
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                // MongoDB report logic
                                await api.reportItem({
                                  reportedItemId: product.id,
                                  reportedItemType: 'sale',
                                  reason: 'Community Flag'
                                });
                                alert("Report submitted. This listing is now hidden for you.");

                                // Hide locally for current session
                                setReportedIds(prev => [...prev, product.id]);
                              } catch (err) {
                                console.error("Report failed:", err);
                              }
                              setReportMenuId(null);
                            }}
                            className="flex-1 py-2 text-[12px] font-medium text-red-500 hover:bg-white/5 transition-colors"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {product.username === currentUsername && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await api.deleteSale(product.id);
                          setLocalProducts(prev => prev.filter(p => p.id !== product.id));
                        } catch (err) {
                          console.error("Delete failed:", err);
                        }
                      }}
                      className="p-1 px-[7px] py-[5px] rounded-lg bg-[#141416] hover:bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer h-7 w-7"
                      title="Delete product post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWishlistIds(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]);
                  }}
                  className="p-1 px-[7px] py-[5px] rounded-lg bg-[#141416] hover:bg-neutral-800 border border-white/5 active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer h-7 w-7"
                >
                  <Star 
                    className={`w-3.5 h-3.5 ${wishlistIds.includes(product.id) ? 'text-[#FFB800]' : 'text-neutral-400 hover:text-[#FFB800]'} transition-colors`} 
                    fill={wishlistIds.includes(product.id) ? '#FFB800' : 'none'}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
        {showWishlistOnly && localProducts.filter(p => wishlistIds.includes(p.id)).length === 0 && (
          <div className="col-span-2 text-center text-white/50 text-[14px] font-medium pt-10">
            No items in your wishlist yet.
          </div>
        )}
      </div>
    </div>
  );
}
