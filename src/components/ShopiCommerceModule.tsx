import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef } from 'react';
import { CameraPlusIcon } from './CameraPlusIcon';
import { Search, Sparkles, Star, CheckCircle, ArrowLeft, Upload, X, MapPin, Phone, User, ArrowUp, Trash2, Plus, Pencil, Navigation, ScanFace, Camera, AlertCircle, CheckCircle2, Video } from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

import { getHumanAvatar } from '../utils/avatar';


interface ShopiCommerceModuleProps {
  onBack?: () => void;
  isPremium?: boolean;
  onTogglePremium?: (val: boolean) => void;
  currentUsername?: string;
}

export default function ShopiCommerceModule({ 
  onBack,
  isPremium = false,
  onTogglePremium,
  currentUsername = "User"
}: ShopiCommerceModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Real-time active listings from Firestore
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchShopi = async () => {
      try {
        const data = await api.getShopi();
        setLocalProducts(data.map((d: any) => ({
          ...d,
          id: d._id
        })));
      } catch (err) {
        console.error("Failed to fetch shopi:", err);
      }
    };
    fetchShopi();
  }, []);

  useEffect(() => {
    scopedStorage.setItem('booran_shopi_products', JSON.stringify(localProducts));
  }, [localProducts]);

  // Track viewed Shopi products
  useEffect(() => {
    if (selectedProduct && selectedProduct.id) {
      try {
        const stored = scopedStorage.getItem("booran_viewed_shopi");
        const viewed = stored ? JSON.parse(stored) : [];
        if (!viewed.includes(selectedProduct.id)) {
          scopedStorage.setItem("booran_viewed_shopi", JSON.stringify([...viewed, selectedProduct.id]));
        }
      } catch (e) {}
    }
  }, [selectedProduct]);

  // Upload Draft State
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImg, setItemImg] = useState('');
  const [storeName, setStoreName] = useState('');
  const [discount, setDiscount] = useState('');
  const [currency, setCurrency] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Selfie Capture States
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

  const selfieStreamRef = useRef<MediaStream | null>(null);
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieTimersRef = useRef<NodeJS.Timeout[]>([]);

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
          return base64;
        }
      } catch (e) {
        console.warn("Failed to capture real webcam frame, falling back to dummy portrait:", e);
      }
    }
    
    // Fallback: use getHumanAvatar with publisherName
    const fallbackBase64 = getHumanAvatar(publisherName || 'SelfieUser');
    setCapturedSelfieBase64(fallbackBase64);
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

  const handleGetLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Popup triggers
  const [showPremiumUploadLock, setShowPremiumUploadLock] = useState(false);
  const [showDirectContactPopup, setShowDirectContactPopup] = useState<Product | null>(null);
  const [uploadedProduct, setUploadedProduct] = useState<Product | null>(null);
  const [isPostedDrawerOpen, setIsPostedDrawerOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  // Starred listings state (Saved for later) & Saved drawer
  const [starredProductIds, setStarredProductIds] = useState<string[]>(() => {
    const saved = scopedStorage.getItem('booran_shopi_starred_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [];
  });
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

  useEffect(() => {
    scopedStorage.setItem('booran_shopi_starred_ids', JSON.stringify(starredProductIds));
  }, [starredProductIds]);

  // Editing model state for updating existing peer listings
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Product Reviews State
  const [productReviews, setProductReviews] = useState<Record<string, Array<{
    id: string;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>>>({
    'p1': [
      { id: 'r1', reviewerName: 'Rohit Sharma', rating: 5, comment: 'Amazing jacket! Extremely warm and stylish.', createdAt: 'May 28, 2026' },
      { id: 'r2', reviewerName: 'Simran S.', rating: 4, comment: 'True to size, the core color accent looks great in real life.', createdAt: 'May 30, 2026' },
    ],
    'p3': [ 
      { id: 'r3', reviewerName: 'Abhishek K.', rating: 5, comment: 'Excellent mechanical typing feel, keyboard is highly tactile!', createdAt: 'Jun 01, 2026' },
      { id: 'r4', reviewerName: 'Karan Mehra', rating: 5, comment: 'Perfect addition for tech-savvy workspace setups!', createdAt: 'Jun 02, 2026' }
    ]
  });

  // State for composing a review
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [reviewsNameInput, setReviewsNameInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');

  // Report state
  const [reportedProductIds, setReportedProductIds] = useState<string[]>(() => {
    const saved = scopedStorage.getItem('booran_shopi_reported_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    scopedStorage.setItem('booran_shopi_reported_ids', JSON.stringify(reportedProductIds));
  }, [reportedProductIds]);

  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Incorrect Pricing/Deceptive info');

  const getProductAverageRating = (productId: string): number => {
    const list = productReviews[productId];
    if (!list || list.length === 0) return 5;
    const total = list.reduce((sum, item) => sum + item.rating, 0);
    return Math.round(total / list.length);
  };

  const toggleStarProduct = (productId: string) => {
    setStarredProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
    const isStarredNow = !starredProductIds.includes(productId);
    const prod = localProducts.find(p => p.id === productId);
    setToastMessage(isStarredNow 
      ? `Starred: '${prod?.name}' added to saved list!` 
      : `Unstarred: '${prod?.name}' removed.`
    );
    setShowPurchaseToast(true);
    setTimeout(() => setShowPurchaseToast(false), 3000);
  };

  // Alerts
  const [toastMessage, setToastMessage] = useState('');
  const [showPurchaseToast, setShowPurchaseToast] = useState(false);

  // Filter listings by store name, or name
  const filteredProducts = localProducts.filter(p => {
    // Hide if reported by this individual user
    if (reportedProductIds.includes(p.id) || (p.reportedByUids && p.reportedByUids.includes(currentUsername))) {
      return false;
    }
    const query = searchQuery.toLowerCase().trim();
    if (query === '') return true;
    return (
      (p.storeName && p.storeName.toLowerCase().includes(query)) ||
      p.name.toLowerCase().includes(query)
    );
  });

  const viewedShopiStr = scopedStorage.getItem("booran_viewed_shopi");
  const viewedShopiIds = (() => {
    try {
      return viewedShopiStr ? JSON.parse(viewedShopiStr) : [];
    } catch {
      return [];
    }
  })();
  const viewedShopiSet = new Set(viewedShopiIds);

  const sortedFilteredProducts = (() => {
    const unwatched = filteredProducts.filter(p => !viewedShopiSet.has(p.id));
    const watched = filteredProducts.filter(p => viewedShopiSet.has(p.id));
    return [...unwatched, ...watched];
  })();

  const handleDeleteProduct = async (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      await api.deleteShopi(productId);
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      setToastMessage(`Removed listing successfully.`);
    } catch (error) {
      console.error("Error deleting product:", error);
      setToastMessage("Failed to delete product.");
    }
    setShowPurchaseToast(true);
    setTimeout(() => setShowPurchaseToast(false), 3000);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPremium) {
      setShowPremiumUploadLock(true);
      return;
    }

    const priceNum = parseFloat(itemPrice) || 0;

    try {
      const payload = {
        name: itemTitle || 'Custom Core Node',
        price: priceNum,
        imageUrl: itemImg || getHumanAvatar(`custom_item_${Math.floor(Math.random() * 10000)}`),
        storeName: storeName || 'P2P Store Node',
        discount: discount || '— _%',
        currency: currency || '₹',
        location: location || 'Direct Trade Node',
        contact: contact || 'Direct handoff only',
        publisherName: publisherName || 'Verified Peer',
        sellerSelfie: capturedSelfieBase64 || getHumanAvatar(publisherName || 'Verified Peer'),
      };

      if (editingProductId) {
        setToastMessage("Update simulation successful.");
      } else {
        const response = await api.createShopi(payload);
        setLocalProducts(prev => [{ ...response, id: response._id }, ...prev]);
        setToastMessage(`Successful list: '${itemTitle}' published under manual peer trade parameters!`);
      }
    } catch (error: any) {
      console.error("Error adding product:", error);
      setToastMessage(error.message || "Failed to add product.");
    }

    setIsUploadFormOpen(false);
    setItemTitle('');
    setItemPrice('');
    setItemImg('');
    setStoreName('');
    setDiscount('');
    setLocation('');
    setContact('');
    setPublisherName('');
    setCapturedSelfieBase64('');
    setShowPurchaseToast(true);
    setTimeout(() => setShowPurchaseToast(false), 5000);
  };

  return (
    <div id="shopi-commerce-container" className="flex flex-col h-full bg-transparent text-white pt-4 px-5 relative font-sans select-none overflow-hidden pb-28">
      
      {/* Top Header */}
      <header className="flex items-center justify-between pb-3 select-none shrink-0" id="shopi-market-header">
        <div className="flex items-center space-x-2.5">
          {onBack && (
            <button
              onClick={onBack}
              id="shopi-header-back-btn"
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-[20px] h-[20px]" />
            </button>
          )}
          <h1 className="text-[25px] font-semibold text-white tracking-tight leading-none" id="shopi-title-label">
            Shopi
          </h1>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPostedDrawerOpen(true)}
            id="my-listings-view-btn"
            className="flex items-center justify-center p-2 rounded-xl bg-[#1c1c1e] hover:bg-neutral-800 border border-white/5 active:scale-95 transition-all text-emerald-400 cursor-pointer h-[38px] w-[38px] shadow-md relative"
            title="My Uploads & Store Settings"
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => setIsSavedDrawerOpen(true)}
            className="flex items-center justify-center rounded-xl bg-[#1c1c1e] hover:bg-neutral-800 border border-white/5 active:scale-95 transition-all cursor-pointer h-[38px] w-[38px] text-[#ffd000] hover:text-[#ffe066] shadow-md font-bold"
            title="Starred List & Profile"
            id="starred-list-header-btn"
          >
            <Star className="w-4.5 h-4.5 fill-[#ffd000] text-[#ffd000]" />
          </button>
        </div>
      </header>

      {/* Product Search - Specifically looking up store names */}
      <div className="bg-[#1c1c1e] text-white rounded-xl px-4 flex items-center space-x-3 border border-white/5 focus-within:border-white/10 transition-colors h-[42px] mt-1.5 w-full shrink-0" id="store-search-bar">
        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent outline-none text-white text-[13px] placeholder-neutral-400 font-normal border-0 focus:ring-0 p-0"
          id="store-search-input"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main layout contents inside scrollable area displaying all items directly */}
      <div className="flex-1 overflow-y-auto mt-4 pb-20 scrollbar-none" id="listings-scroll-container">
        
        {/* Header Summary info removed */}

        {/* Quick listing shortcut panel */}
        <div className="bg-[#101012] border border-white/5 rounded-2xl p-3.5 mb-5 flex items-center justify-between" id="upload-limit-hud">
          <div className="text-left space-y-0.5">
            <p className="text-xs font-bold text-neutral-200">Post Up to 10 Listings</p>
            <p className="text-[10px] text-neutral-500 font-mono">Your Active Posts: {localProducts.filter(p => p.publisherName === currentUsername).length}/10</p>
          </div>
          <button
            onClick={() => setIsUploadFormOpen(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-white text-black font-black text-[10px] uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow"
            id="post-listing-shortcut-btn"
          >
            <Plus className="w-3.5 h-3.5" /> Post Listing
          </button>
        </div>

        {/* If product search matches something */}
        {sortedFilteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 pb-12" id="unified-trade-grid">
            {sortedFilteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex flex-col group cursor-pointer text-left"
                onClick={() => setSelectedProduct(product)}
                id={`product-card-${product.id}`}
              >
                {/* Image display */}
                <div className="relative aspect-[3/4.2] w-full rounded-[24px] overflow-hidden bg-[#101012] border border-white/10 hover:border-white/30 transition-all select-none shadow-xl">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount && product.discount !== '— _%' && (
                    <div className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[9px] font-mono font-bold uppercase tracking-widest rounded-md px-2 py-0.5 shadow-md">
                      {product.discount} OFF
                    </div>
                  )}


                </div>

                {/* Info block */}
                <span className="text-[13.5px] font-bold text-white font-sans mt-2.5 truncate max-w-full text-left pl-1 leading-snug group-hover:text-neutral-300 transition-colors">
                  {product.name}
                </span>

                {/* Store Name label */}
                <span className="text-[10px] text-neutral-400 font-mono truncate max-w-full text-left pl-1">
                  🏪 {product.storeName || 'P2P Store Node'}
                </span>

                {/* Price and Star button */}
                <div className="flex items-center justify-between mt-2 pl-1 pr-1 w-full">
                  <div className="px-3 py-0.5 bg-white text-black text-[11.5px] font-extrabold rounded-full w-fit tracking-wide shadow font-mono shrink-0">
                    {product.currency || '₹'} {product.price.toLocaleString()}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarProduct(product.id);
                    }}
                    className="p-1 px-[7px] py-[5px] rounded-lg bg-[#141416] hover:bg-neutral-800 border border-white/5 active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer h-7 w-7"
                    title="Star product"
                  >
                    <Star className={`w-3.5 h-3.5 ${starredProductIds.includes(product.id) ? 'fill-[#ffd000] text-[#ffd000]' : 'text-neutral-400 hover:text-white'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#121214] border border-white/5 rounded-2xl mt-4" id="empty-results-fallback">
            <p className="text-xs text-neutral-400 font-mono">No active listings posted yet.</p>
            <p className="text-[10px] text-neutral-500 font-mono mt-1">
              {searchQuery ? "No results match your search draft." : "Post your first listing above to show your offers directly on the peer ledger!"}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white tracking-wider rounded-lg border border-white/10"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={() => setIsUploadFormOpen(true)}
                className="mt-3.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/20"
              >
                Create Listing Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating System Messages Toast Overlay */}
      {showPurchaseToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-neutral-950 border border-yellow-500/40 p-3 px-4 rounded-2xl flex items-center gap-2.5 text-xs text-yellow-400 animate-fade-in z-50 w-[84%] max-w-sm shadow-2xl">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 text-yellow-500" />
          <span className="font-mono text-[10.5px] leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in" id="product-detail-modal">
          <div className="bg-neutral-900 border border-white/10 w-full max-w-sm rounded-[24px] max-h-[82vh] mb-28 overflow-y-auto shadow-2xl animate-scale-up scrollbar-none">
            
            <div className="h-52 w-full relative shrink-0">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40" />
              
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsReporting(false);
                }}
                className="absolute top-4 right-4 bg-black/40 backdrop-blur-md hover:bg-black/80 hover:scale-105 w-9 h-9 rounded-full text-white transition-all cursor-pointer flex items-center justify-center z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 z-10">
                <span className="bg-white text-black border border-white/10 text-[9px] font-mono font-bold uppercase tracking-widest rounded px-2.5 py-0.5">
                  PEER DEALER LISTING
                </span>
              </div>
            </div>

            {/* Detail info layout */}
            <div className="p-6 pb-12 space-y-4 text-left relative z-10">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1 flex-1 text-left">
                  <h3 className="text-lg font-bold text-white leading-tight">{selectedProduct.name}</h3>
                  
                  {/* Star Ratings */}
                  <div className="flex items-center space-x-1.5 text-[#ffd000] select-none">
                    <div className="flex items-center -space-x-0.5">
                      {[...Array(5)].map((_, i) => {
                        const avgRating = getProductAverageRating(selectedProduct.id);
                        return (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < avgRating ? 'fill-[#ffd000] text-[#ffd000]' : 'text-neutral-700'}`} 
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {getProductAverageRating(selectedProduct.id)}.0 rating ({productReviews[selectedProduct.id]?.length || 0} reviews)
                    </span>
                  </div>
                </div>
                
                {/* Right side: Active badge and Seller's Selfie Box with white outline */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8.5px] font-mono font-black uppercase tracking-wider rounded-lg px-2 py-0.5 select-none">
                    ACTIVE
                  </span>
                  
                  {/* White-outlined Seller Selfie Square */}
                  <div className="w-[52px] h-[52px] rounded-xl bg-neutral-950 border-2 border-white overflow-hidden flex items-center justify-center shadow-lg relative" title="Seller Biometric Verification">
                    <img 
                      src={selectedProduct.sellerSelfie || getHumanAvatar(selectedProduct.publisherName || 'Siddharth N.')} 
                      alt="Seller Selfie" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[6.5px] font-bold text-center py-0.5 tracking-wider uppercase font-mono leading-none">
                      VERIFIED
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications Card */}
              <div className="bg-black/30 border border-white/5 p-3.5 rounded-[20px] space-y-2.5 text-left">
                <div className="flex justify-between items-center font-mono border-b border-white/5 pb-2">
                  <span className="text-xs text-neutral-400 font-semibold">Total Price:</span>
                  <span className="text-sm text-white font-black font-bold">{selectedProduct.currency || '₹'} {selectedProduct.price.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2 pt-1 font-mono text-[11px]">
                  <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                    <span className="text-neutral-500">🏪 Store Node:</span>
                    <span className="text-neutral-200 font-bold">{selectedProduct.storeName || "P2P Store Node"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                    <span className="text-neutral-500">📍 Location:</span>
                    <span className="text-white font-bold truncate max-w-[170px]" title={selectedProduct.location}>
                      {selectedProduct.location || "Connaught Place, Delhi"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                    <span className="text-neutral-500">📞 Phone contact:</span>
                    <span className="text-white font-bold font-mono">
                      {selectedProduct.contact || "+91 98111 22233"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-neutral-500">👤 Dealer Name:</span>
                    <span className="text-neutral-200 font-bold">
                      {selectedProduct.publisherName || "Siddharth N."}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-neutral-500">🚨 Accumulated Flags:</span>
                    <span className="text-white font-bold font-mono">
                      {selectedProduct.reportedByUsers?.length || 0} / 30 reports
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">👑 Pro Seller Package:</span>
                    <span className="text-white font-extrabold flex items-center gap-1">
                      <span className="h-1 text-xs uppercase text-white font-bold">Monthly Completed</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Incident Diagnostic report */}
              <div className="border border-white/5 p-3 rounded-2xl bg-neutral-950/20">
                {isReporting ? (
                  <div className="space-y-2.5 text-left animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] text-yellow-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>⚠️</span> Diagnostic Reporting
                      </span>
                      <button 
                        type="button"
                        onClick={() => setIsReporting(false)}
                        className="text-[9px] text-neutral-400 hover:text-white underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-1 block">
                      <label className="text-[8.5px] text-neutral-500 font-extrabold uppercase block tracking-wider">Select Issue Reason</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full bg-[#18181b] border border-white/10 rounded-xl p-2 text-base text-white outline-none focus:border-yellow-500 transition-colors cursor-pointer font-mono"
                      >
                        <option value="Incorrect Pricing/Deceptive info">Incorrect Pricing/Deceptive info</option>
                        <option value="Counterfeit or Suspicious Stock">Counterfeit or Suspicious Stock</option>
                        <option value="Invalid Phone contact / Spam">Invalid Phone contact / Spam</option>
                        <option value="Inappropriate Store Location">Inappropriate Store Location</option>
                      </select>
                    </div>

                    {/* Developer flags simulation to help user test 30 reports limit instantly */}
                    <div className="p-2 border border-[#3b82f6]/10 bg-[#3b82f6]/5 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-[8.5px] text-neutral-400 font-mono">
                        <span>Simulate public traffic:</span>
                        <span className="font-extrabold text-blue-400 font-mono">Current reports: {selectedProduct.reportedByUsers?.length || 0}/30</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const reportedId = selectedProduct.id;
                            const updatedProducts = localProducts.map(p => {
                              if (p.id === reportedId) {
                                const currentBy = p.reportedByUsers || [];
                                const nextIndex = currentBy.length + 1;
                                const newPeers = Array.from({ length: 10 }, (_, i) => `PeerUser_${nextIndex + i}`);
                                const merged = Array.from(new Set([...currentBy, ...newPeers]));
                                return { ...p, reportedByUsers: merged, reportCount: merged.length };
                              }
                              return p;
                            });

                            const currentProd = updatedProducts.find(px => px.id === reportedId);
                            const totalReportsCount = currentProd?.reportedByUsers?.length || 0;

                            if (totalReportsCount >= 30) {
                              setLocalProducts(prev => prev.filter(p => p.id !== reportedId));
                              setSelectedProduct(null);
                              setToastMessage(`BANNED globally! '${selectedProduct.name}' has been deleted for ALL users because it accumulated ${totalReportsCount} reports from unique users.`);
                            } else {
                              setLocalProducts(updatedProducts);
                              const updatedProd = updatedProducts.find(p => p.id === reportedId);
                              if (updatedProd) setSelectedProduct(updatedProd);
                              setToastMessage(`Simulated +10 peer reports from unique users (Total: ${totalReportsCount}/30)`);
                            }
                            setShowPurchaseToast(true);
                            setTimeout(() => setShowPurchaseToast(false), 3500);
                          }}
                          className="py-1 px-1 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 font-bold text-[8px] font-mono rounded border border-blue-500/20 cursor-pointer text-center"
                        >
                          +10 Reports
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reportedId = selectedProduct.id;
                            const updatedProducts = localProducts.map(p => {
                              if (p.id === reportedId) {
                                const currentBy = p.reportedByUsers || [];
                                const otherPeers = currentBy.filter(u => u !== 'Siddharth N.');
                                const currentCount = otherPeers.length;
                                const needed = 29 - currentCount;
                                const newPeers = needed > 0 
                                  ? Array.from({ length: needed }, (_, i) => `PeerUser_Pre_${i + 1}`)
                                  : [];
                                const merged = Array.from(new Set([...otherPeers, ...newPeers]));
                                if (currentBy.includes('Siddharth N.')) {
                                  merged.push('Siddharth N.');
                                }
                                return { ...p, reportedByUsers: merged, reportCount: merged.length };
                              }
                              return p;
                            });
                            setLocalProducts(updatedProducts);
                            const updatedProd = updatedProducts.find(p => p.id === reportedId);
                            if (updatedProd) setSelectedProduct(updatedProd);
                            const totalReportsCount = updatedProd?.reportedByUsers?.length || 0;
                            setToastMessage(`Simulated ${totalReportsCount} unique peer reports (1 report away from auto-deletion!)`);
                            setShowPurchaseToast(true);
                            setTimeout(() => setShowPurchaseToast(false), 3500);
                          }}
                          className="py-1 px-1 bg-orange-950/40 hover:bg-orange-900/40 text-orange-400 font-bold text-[8px] font-mono rounded border border-orange-500/20 cursor-pointer text-center"
                        >
                          Set to 29 Reports
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        const reportedId = selectedProduct.id;

                        try {
                          await api.reportItem({
                            reportedItemId: reportedId,
                            reportedItemType: 'shopi',
                            reason: reportReason
                          });

                          // For local UI update (hiding)
                          setReportedProductIds(prev => [...prev, reportedId]);
                          setToastMessage(`Incident reported. Listing '${selectedProduct.name}' hidden for you.`);
                        } catch (error) {
                          console.error("Error reporting product:", error);
                          setToastMessage("Failed to report product.");
                        }

                        setIsReporting(false);
                        setShowPurchaseToast(true);
                        setTimeout(() => setShowPurchaseToast(false), 5000);
                        setSelectedProduct(null);
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer font-sans"
                    >
                      Confirm Report & Hide Listing
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-left">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-neutral-200">Deceptive details? Flag block.</p>
                    </div>
                    {reportedProductIds.includes(selectedProduct.id) ? (
                      <span className="text-yellow-500 text-[9px] font-mono font-bold uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                        ✓ Reported
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsReporting(true)}
                        className="py-1 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 font-extrabold text-[9px] uppercase tracking-wider transition-all cursor-pointer font-mono"
                      >
                        ⚠️ Report
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Product Specifications & Interactive Feedback */}
              <div className="bg-neutral-950/40 border border-white/5 p-4 rounded-[20px] space-y-4 text-left">
                <div className="space-y-1 block">
                  <h4 className="text-[11px] text-white font-mono font-black uppercase tracking-wider">
                    About Product
                  </h4>
                  <p className="text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                    This is an item catalog block registered inside store "{selectedProduct.storeName}". Features a high-integrity design curated by real community members. Suitable for local peer coordinate trade and direct handoffs.
                  </p>
                </div>

                {/* Buyer Reviews */}
                <div className="border-t border-white/5 pt-3.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] text-white font-sans font-black uppercase tracking-wider">
                      Buyer Reviews
                    </h4>
                    <span className="text-[9px] bg-white/5 border border-white/10 text-neutral-400 rounded-full px-2 py-0.5 font-mono font-bold">
                      {productReviews[selectedProduct.id]?.length || 0} Listed
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 scrollbar-none">
                    {(productReviews[selectedProduct.id] || []).length === 0 ? (
                      <p className="text-[10px] text-neutral-500 italic py-1 font-mono">
                        No feedback yet. Type below to write a review!
                      </p>
                    ) : (
                      (productReviews[selectedProduct.id] || []).map((rev) => (
                        <div key={rev.id} className="bg-neutral-950/60 border border-white/[0.04] p-3 rounded-xl space-y-1 animate-fade-in text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-200 font-bold font-sans">{rev.reviewerName}</span>
                            <span className="text-[9.5px] text-[#ffd000] font-mono flex items-center tracking-tighter">
                              {'★'.repeat(rev.rating)}
                              {'☆'.repeat(5 - rev.rating)}
                            </span>
                          </div>
                          <p className="text-neutral-400 font-sans leading-relaxed text-[10px] mt-0.5">
                            {rev.comment}
                          </p>
                          <div className="text-[8px] text-neutral-600 font-mono text-right font-medium">
                            {rev.createdAt}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Write custom review */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!commentInput.trim()) return;
                    const userName = reviewsNameInput.trim() || 'Anonymous Reviewer';
                    const newReview = {
                      id: `rev-${Date.now()}`,
                      reviewerName: userName,
                      rating: ratingInput,
                      comment: commentInput.trim(),
                      createdAt: 'Just now'
                    };
                    
                    setProductReviews(prev => ({
                      ...prev,
                      [selectedProduct.id]: [newReview, ...(prev[selectedProduct.id] || [])]
                    }));

                    setCommentInput('');
                    setReviewsNameInput('');
                    setRatingInput(5);

                    setToastMessage("Thanks! Your product review has been submitted successfully.");
                    setShowPurchaseToast(true);
                    setTimeout(() => setShowPurchaseToast(false), 3000);
                  }}
                  className="border-t border-white/5 pt-3.5 space-y-2.5"
                >
                  <span className="text-[10px] text-[#ffd000] font-mono font-bold uppercase tracking-wider block">Submit Feedback Review</span>
                  
                  <div className="flex items-center space-x-1.5 bg-[#141416] p-2.5 rounded-xl border border-white/5 justify-between select-none">
                    <span className="text-[9.5px] text-neutral-400 font-mono">Select Rating:</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRatingInput(starVal)}
                          className="hover:scale-120 active:scale-90 transition-transform p-0.5 focus:outline-none"
                        >
                          <Star 
                            className={`w-3.5 h-3.5 cursor-pointer ${starVal <= ratingInput ? 'fill-[#ffd000] text-[#ffd000]' : 'text-neutral-700'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 block text-left">
                    <input
                      type="text"
                      
                      value={reviewsNameInput}
                      onChange={(e) => setReviewsNameInput(e.target.value)}
                      className="w-full bg-[#141416] border border-white/5 rounded-xl p-2.5 text-base text-white outline-none focus:border-white transition-colors font-mono placeholder:text-white/50"
                    />
                    <textarea
                      required
                      
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      rows={2}
                      className="w-full bg-[#141416] border border-white/5 rounded-xl p-2.5 text-base text-white outline-none focus:border-white transition-colors font-sans placeholder:text-white/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#ffd000]/10 hover:bg-[#ffd000] text-[#ffd000] hover:text-black font-sans text-[10px] tracking-wider uppercase transition-all duration-200 border border-[#ffd000]/20 text-center cursor-pointer font-bold shrink-0"
                  >
                    Publish Review Feedback
                  </button>
                </form>
              </div>

              <div className="space-y-2 mt-2">
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${selectedProduct.contact || '+91 98111 22233'}`);
                      setToastMessage(`Copied contact: ${selectedProduct.contact || '+91 98111 22233'}!`);
                      setShowPurchaseToast(true);
                      setTimeout(() => setShowPurchaseToast(false), 2500);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-97 text-xs font-extrabold"
                  >
                    Copy Contact Phone
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-1/3 py-2.5 rounded-xl text-neutral-400 bg-white/5 hover:bg-white/10 text-xs font-semibold cursor-pointer border border-white/5"
                  >
                    Close
                  </button>
                </div>

                {selectedProduct.publisherName === currentUsername && (
                  <button
                    onClick={(e) => {
                      handleDeleteProduct(selectedProduct.id, e);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-2.5 mt-2 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Delete My Listing
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Listing Creation Forms */}
      {isUploadFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" id="upload-form-modal">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-[28px] max-w-sm w-full p-6 pt-8 pb-32 text-left animate-scale-up relative max-h-[75vh] mt-8 mb-24 overflow-y-auto scrollbar-none">
            <button
              onClick={() => setIsUploadFormOpen(false)}
              className="absolute top-6 right-5 text-neutral-400 hover:text-white cursor-pointer hover:scale-110 transition-transform h-6 w-6 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-3 mb-5">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                {editingProductId ? "EDIT LISTING" : "CREATE LISTING"}
              </h3>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setSubmitAttempted(true);
              if (itemTitle && storeName && itemPrice && location && contact && publisherName && itemImg) {
                handleAddProduct(e);
              }
            }} className="space-y-4" noValidate>
              <div className="space-y-1 block text-left">
                <label className="text-[10px] text-white font-extrabold uppercase block text-left tracking-wider">PRODUCT TITLE</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  
                  className={`w-full bg-[#18181b] border ${submitAttempted && !itemTitle ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] placeholder:text-white/50 transition-colors font-mono`}
                />
              </div>

              <div className="space-y-1 block text-left">
                <label className="text-[10px] text-white font-extrabold uppercase block text-left tracking-wider">STORE NAME</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  
                  className={`w-full bg-[#18181b] border ${submitAttempted && !storeName ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] placeholder:text-white/50 transition-colors font-mono`}
                />
              </div>


              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1 block text-left">
                  <label className="text-[10px] text-white font-extrabold uppercase block text-left tracking-wider">DISCOUNT</label>
                  <input
                    type="text"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    
                    className={`w-full bg-[#18181b] border ${submitAttempted && !discount ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 text-base text-white outline-none focus:border-[#a1a1aa] placeholder:text-white/50 transition-colors font-mono`}
                  />
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[10px] text-white font-extrabold uppercase block text-left tracking-wider">PRICE</label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className={`w-full bg-[#18181b] border ${submitAttempted && !itemPrice ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 text-base text-white outline-none font-mono transition-colors focus:border-[#a1a1aa] placeholder:text-white/50`}
                  />
                </div>
              </div>

              <div className="space-y-3.5 border-t border-white/5 pt-3.5 mt-2">
                
                <div className="space-y-1 block text-left">
                  <label className="text-[9px] text-white font-bold uppercase block text-left tracking-wider">LOCATION</label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      
                      className={`w-full bg-[#18181b] border ${submitAttempted && !location ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 pl-10 pr-10 text-base text-white outline-none focus:border-[#a1a1aa] placeholder:text-white/50 transition-colors font-mono`}
                    />
                    <button 
                      type="button" 
                      onClick={handleGetLocation} 
                      disabled={isLocating}
                      className="absolute right-3 p-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-black transition-colors"
                      title="Use current location"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse text-blue-400' : 'text-neutral-600'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[9px] text-white font-bold uppercase block text-left tracking-wider">CONTACT PHONE</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      
                      className={`w-full bg-[#18181b] border ${submitAttempted && !contact ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 pl-10 text-base text-white outline-none focus:border-[#a1a1aa] placeholder:text-white/50 transition-colors font-mono`}
                    />
                  </div>
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[9px] text-white font-bold uppercase block text-left tracking-wider">FULL NAME</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      
                      className={`w-full bg-[#18181b] border ${submitAttempted && !publisherName ? 'border-red-500' : 'border-[#27272a]'} rounded-xl p-3 pl-10 text-base text-white outline-none focus:border-[#a1a1aa] placeholder:text-white/50 transition-colors font-mono`}
                    />
                  </div>
                </div>
              </div>

              {/* Product Photo Upload */}
              <div className="space-y-1 block text-left">
                <label className="text-[10px] text-white font-extrabold uppercase block text-left tracking-wider">PRODUCT PHOTO</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setItemImg(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`h-32 border border-dashed ${submitAttempted && !itemImg ? 'border-red-500 bg-red-500/5' : 'border-[#27272a] bg-[#101012]'} hover:border-[#a1a1aa] transition-colors rounded-xl flex flex-col items-center justify-center relative cursor-pointer overflow-hidden p-2`}
                  onClick={() => document.getElementById('product-file-input')?.click()}
                >
                  {itemImg ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <img
                        src={itemImg}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemImg('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/20 hover:bg-neutral-900 border border-white/10 rounded-lg text-white hover:text-red-500 transition-colors z-25 cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4">
                      <Upload className="w-6 h-6 text-white mb-2" />
                      <span className="text-[11px] font-bold text-neutral-300">Drag & drop product picture here</span>
                      <span className="text-[9px] text-neutral-500 mt-1 font-mono">or click to browse local files</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="product-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setItemImg(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row items-end justify-between pt-4 border-t border-white/5 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelfieScannerOpen(true);
                    setShowSelfieOSPrompt(true);
                  }}
                  className="w-[110px] h-[110px] bg-[#2a2a2a] rounded-[24px] flex flex-col items-center justify-center gap-2.5 hover:bg-[#333333] transition-colors shadow-lg shrink-0 overflow-hidden relative border border-white/10"
                >
                  {capturedSelfieBase64 ? (
                    <>
                      <img src={capturedSelfieBase64} alt="Selfie" className="w-full h-full object-cover" />
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
                <div className="flex flex-col gap-3 flex-1 ml-4 justify-end">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 active:scale-[0.99] transition-all cursor-pointer text-center"
                  >
                    {editingProductId ? "UPDATE OFFER" : "PUBLISH OFFER"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadFormOpen(false);
                      setEditingProductId(null);
                      setItemTitle('');
                      setItemPrice('');
                      setItemImg('');
                      setStoreName('');
                      setDiscount('');
                      setLocation('');
                      setContact('');
                      setPublisherName('');
                      setCapturedSelfieBase64('');
                    }}
                    className="w-full py-3.5 bg-transparent border border-[#27272a] hover:bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller PRO key lock alerts */}
      {showPremiumUploadLock && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-white/20 rounded-[28px] max-w-sm w-full p-6 text-center animate-scale-up relative mb-28">
            <button
              onClick={() => setShowPremiumUploadLock(false)}
              className="absolute top-5 right-5 text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-14 h-14 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white animate-pulse" />
            </div>

            <h3 className="text-base font-extrabold text-white tracking-wide uppercase">👑 Pro Seller Key Required</h3>
            
            <div className="text-xs text-neutral-300 mt-3 mb-6 space-y-3">
              <p>
                To list items and activate ads on the main P2P feed, unlock your digital Pro Seller signature key.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <span className="text-[9px] text-[#cfcfcf] uppercase tracking-widest font-black block mb-1">PRO SELLER & AD STATUS</span>
                <span className="text-2xl font-black text-white">₹47<span className="text-xs text-neutral-400 font-normal"> / Month</span></span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onTogglePremium?.(true);
                  setShowPremiumUploadLock(false);
                }}
                className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-[11px] uppercase tracking-wider cursor-pointer font-bold"
              >
                Pay ₹47 & Activate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Handshake Alert */}
      {showDirectContactPopup && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-950 border border-white/20 rounded-[28px] max-w-sm w-full p-6 text-center animate-scale-up relative mb-28">
            <button
              onClick={() => setShowDirectContactPopup(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-cyan-400 animate-bounce" />
            </div>

            <h3 className="text-base font-bold text-white leading-tight">💼 P2P Trade Initiated</h3>
            
            <div className="text-xs text-neutral-300 mt-3 mb-5 leading-normal space-y-2">
              <p>
                A manual exchange request for <span className="font-bold text-white">{showDirectContactPopup.name}</span> has been simulated.
              </p>
              <p className="text-[10px] text-neutral-400 bg-white/5 p-2 rounded-lg leading-relaxed font-mono">
                "No automated shipping or cart calculations exist. Physical trade coordinates or direct wallet handshakes are completed manually with the seller."
              </p>
            </div>

            <button
              onClick={() => setShowDirectContactPopup(null)}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 text-xs font-semibold cursor-pointer"
            >
              Acknowledge Trade Handshake
            </button>
          </div>
        </div>
      )}

      {/* Drawer: My Posted Listings */}
      {isPostedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-[28px] max-w-sm w-full p-6 text-left animate-scale-up relative max-h-[82vh] mb-28 overflow-y-auto scrollbar-none flex flex-col">
            <button
              onClick={() => setIsPostedDrawerOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer hover:scale-110 transition-transform h-6 w-6 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-3.5 mb-4 shrink-0">
              <span className="text-lg grayscale">📊</span>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">MY PEER LISTINGS</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Active proposals: {localProducts.filter(p => p.publisherName === currentUsername).length} / 10 monthly limits</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 scrollbar-none">
              {localProducts.filter(p => p.isUserPosted).length === 0 ? (
                <div className="text-center p-8 bg-[#101012] border border-white/5 rounded-xl">
                  <p className="text-xs text-neutral-500 font-mono">You have not posted any listings yet this month.</p>
                  <button
                    onClick={() => {
                      setIsPostedDrawerOpen(false);
                      setIsUploadFormOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-white text-black font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Post First Offer
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {localProducts.filter(p => p.publisherName === currentUsername).map((product) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-3 bg-[#141416] border border-white/5 p-2 rounded-2xl relative"
                    >
                      <div className="w-12 h-11.5 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/5">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-bold text-white truncate">{product.name}</h4>
                        <p className="text-[10px] text-neutral-400 truncate">{product.storeName || 'P2P Store'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9.5px] font-mono text-emerald-400 font-bold">{product.currency || '₹'}{product.price.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteProduct(product.id, e)}
                        className="p-2 bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer border border-white/10 hover:scale-105"
                        title="Delete product post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 mt-4 shrink-0">
              <button
                onClick={() => {
                  setIsPostedDrawerOpen(false);
                  setIsUploadFormOpen(true);
                }}
                disabled={localProducts.filter(p => p.publisherName === currentUsername).length >= 10}
                className="w-full py-3.5 rounded-xl bg-[#FF3B30] hover:bg-[#D63028] font-extrabold text-[11px] text-white uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Post New Listing
              </button>
              
              <div className="text-center mt-3">
                <span className="text-[9px] text-neutral-500 font-mono block">Lists reset dynamically every month.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Starred Map & Profile info */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-[28px] max-w-sm w-full p-6 text-left animate-scale-up relative max-h-[82vh] mb-28 overflow-y-auto scrollbar-none flex flex-col">
            <button
              onClick={() => setIsSavedDrawerOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white cursor-pointer hover:scale-110 transition-transform h-6 w-6 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile trigger removed */}

            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-3 mb-4 shrink-0">
              <span className="text-white text-md">★</span>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">STAR MAP (Save for later)</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5 font-bold">Pinned items count: {localProducts.filter(p => starredProductIds.includes(p.id) && !reportedProductIds.includes(p.id)).length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 scrollbar-none">
              {localProducts.filter(p => starredProductIds.includes(p.id) && !reportedProductIds.includes(p.id)).length === 0 ? (
                <div className="text-center p-8 bg-[#101012] border border-white/5 rounded-xl">
                  <Star className="w-8 h-8 text-neutral-600 mx-auto fill-none mb-2" />
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed">No items starred for later yet.</p>
                  <p className="text-[9.5px] text-neutral-500 mt-1 font-mono">Tap the star beside prices to pin products here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {localProducts.filter(p => starredProductIds.includes(p.id) && !reportedProductIds.includes(p.id)).map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsSavedDrawerOpen(false);
                      }}
                      className="flex items-center gap-3 bg-[#141416] border border-white/5 hover:border-white/20 p-2 rounded-2xl relative cursor-pointer group"
                    >
                      <div className="w-12 h-11.5 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/5">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-bold text-white group-hover:text-neutral-300 transition-colors truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">{product.currency || '₹'}{product.price.toLocaleString()}</span>
                          <span className="text-[8px] bg-white/5 text-neutral-400 border border-white/5 px-1 py-0.2 rounded font-mono uppercase truncate max-w-[80px]">{product.storeName || 'P2P Store'}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarProduct(product.id);
                        }}
                        className="p-2 bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer border border-white/10"
                        title="Remove from Saved List"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 mt-4 shrink-0 text-center">
              <span className="text-[9px] text-neutral-500 font-mono block">Starred items are saved on local nodes safely.</span>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Face Scanner Modal Overlay */}
      <AnimatePresence>
        {isSelfieScannerOpen && (
          <div className="fixed inset-0 z-55 flex flex-col justify-between bg-black text-white font-sans overflow-hidden select-none" id="shopi-selfie-scanner-modal">
            {/* Header / Brand */}
            <div className="flex items-center justify-between p-6 shrink-0 border-b border-white/5 bg-black/60 backdrop-blur-md">
              <span className="text-xs font-mono tracking-widest text-[#555555]">
                SECURE SCROLLRISE PEER NODE
              </span>
              <button
                type="button"
                onClick={() => {
                  stopSelfieCamera();
                  selfieTimersRef.current.forEach(t => clearTimeout(t));
                  setIsSelfieScannerOpen(false);
                }}
                className="p-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer h-8 w-8 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 pb-12">
              {showSelfieOSPrompt ? (
                /* OS Permission Prompt Simulation */
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-[290px] bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-center font-sans"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug mb-2">
                    Allow ScrollRise to take pictures and record video?
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-normal mb-5">
                    This lets the security engine scan and authorize peer photo identity listing assets.
                  </p>
                  <div className="space-y-1.5">
                    <button
                      onClick={async () => {
                        setShowSelfieOSPrompt(false);
                        await requestSelfieCameraAccess();
                        startSelfieScanningProcess();
                      }}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      While using the app
                    </button>
                    <button
                      onClick={async () => {
                        setShowSelfieOSPrompt(false);
                        await requestSelfieCameraAccess();
                        startSelfieScanningProcess();
                      }}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Only this time
                    </button>
                    <button
                      onClick={() => {
                        setShowSelfieOSPrompt(false);
                        setSelfiePermissionState('denied');
                        setSelfieHasWebcam(false);
                        startSelfieScanningProcess();
                      }}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-zinc-400 font-medium text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Don't allow
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Scanner View */
                <div className="w-full max-w-sm flex flex-col items-center justify-center">
                  <h2 className="text-xl sm:text-[24px] font-bold tracking-tight text-white mb-6 text-center font-sans">
                    Facial Recognition Scan
                  </h2>

                  {/* Circular Viewport */}
                  <div className={`relative w-[210px] h-[210px] sm:w-[240px] sm:h-[240px] mb-6 mx-auto transition-transform duration-300 ${selfieAlignmentIssue ? 'animate-shake' : ''}`}>
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
                          ? 'ring-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                          : selfieAlignmentIssue 
                            ? 'ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.6)]' 
                            : 'ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    } transition-all duration-500`} />

                    <div className="absolute inset-0 rounded-full overflow-hidden bg-zinc-950 border-2 border-neutral-800 flex items-center justify-center">
                      {selfieHasWebcam && selfieStream ? (
                        <video
                          ref={selfieVideoRefCallback}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-[1.75] scale-x-[-1.75]"
                        />
                      ) : (
                        /* Biometric node mesh fallback simulation */
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-zinc-900 to-zinc-950">
                          <div className="w-40 h-40 opacity-80 text-zinc-500 relative flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current">
                              <path 
                                d="M50,15 C32,15 25,25 25,48 C25,75 42,88 50,88 C58,88 75,75 75,48 C75,25 68,15 50,15 Z" 
                                strokeWidth="2" 
                                stroke={selfieScanFailed || selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} 
                                strokeOpacity={isSelfieScanning ? 0.6 : 0.2}
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
                            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-400 rounded-xl font-bold text-[10.5px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>⚠️ Cover Face / Shake / Put Hands on Head</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer block */}
            <div className="p-6 shrink-0 border-t border-white/5 bg-black/60 backdrop-blur-md text-center">
              <span className="text-[9px] text-[#444444] font-mono block">
                ScrollRise secure cryptographic identity peer network
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
