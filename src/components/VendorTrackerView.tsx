import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, MapPin, Navigation, Clock, AlertTriangle, ShieldCheck, CreditCard, ChevronRight, CheckCircle2, User as UserIcon, Search, ScanFace, Camera, X, Pencil } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from "../services/api";
import { socket } from "../utils/socket";
import { API_BASE_URL } from '../config';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Custom Icons
const customVendorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type AppUser = { name: string; email: string; type: 'Customer' | 'Vendor' };
type PinData = { id: string; vendorName: string; desc: string; openTime: string; closeTime: string; lat: number; lng: number; expiresAt?: number; reports?: number; reportedBy?: string[] };

const MapUpdater = () => {
  const map = useMap();
  useEffect(() => {
    // Force refresh map sizing to handle container size changes perfectly
    const t = setTimeout(() => {
      try {
        if (map && (map as any)._container) {
          map.invalidateSize();
        }
      } catch (err) {}
    }, 250);
    const onResize = () => {
      try {
        if (map && (map as any)._container) {
          map.invalidateSize();
        }
      } catch (err) {}
    };
    window.addEventListener('resize', onResize);
    return () => {
       clearTimeout(t);
       window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
};

const LocationPicker = ({ onLocationSelect, isActive }: { onLocationSelect: (lat: number, lng: number) => void, isActive: boolean }) => {
  useMapEvents({
    click(e) {
      if (isActive) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export default function VendorTrackerView({ onBack, currentUsername }: { onBack: () => void, currentUserAvatar?: string, currentUsername: string }) {
  const [screen, setScreen] = useState<'choice' | 'profile' | 'customerHome' | 'vendorHome' | 'createPin' | 'checkout' | 'reportForm'>('choice');
  
  // App State
  const [user, setUser] = useState<AppUser | null>(null);
  const [myLocation, setMyLocation] = useState<{lat: number, lng: number}>(() => {
    try {
      const saved = scopedStorage.getItem('lastLocationCache');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Use cached location if less than 3 hours old
        if (Date.now() - parsed.timestamp < 3 * 60 * 60 * 1000) {
          return parsed.loc;
        }
      }
    } catch(e) {}
    return { lat: 12.9716, lng: 77.5946 };
  });

  const [locationGranted, setLocationGranted] = useState(false);
  const [pendingMode, setPendingMode] = useState<'Customer' | 'Vendor' | null>(null);

  useEffect(() => {
    let watchId: number;
    if (locationGranted && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(loc);
          scopedStorage.setItem('lastLocationCache', JSON.stringify({ loc, timestamp: Date.now() }));
        },
        (err) => console.warn('Location error', err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [locationGranted]);

  

  const [vendorPin, setVendorPin] = useState<PinData | null>(() => {
    try {
      const saved = scopedStorage.getItem('myVendorPin');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.expiresAt || parsed.expiresAt > Date.now()) {
          return parsed;
        } else {
          scopedStorage.removeItem('myVendorPin');
        }
      }
    } catch (e) {}
    return null;
  });

  // Persist pin and auto-delete interval
  useEffect(() => {
    if (vendorPin) {
      scopedStorage.setItem('myVendorPin', JSON.stringify(vendorPin));
    } else {
      scopedStorage.removeItem('myVendorPin');
    }
  }, [vendorPin]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (vendorPin && vendorPin.expiresAt && Date.now() > vendorPin.expiresAt) {
        handleRemovePin();
      }
    }, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [vendorPin]);
  
  // Real-time Data from MongoDB
  const [allPins, setAllPins] = useState<PinData[]>([]);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pins?lat=${myLocation.lat}&lng=${myLocation.lng}`, {
          headers: {
            'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`,
            'x-username': currentUsername
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAllPins(data);
        }
      } catch (err) {
        console.warn("Failed to fetch pins:", err);
      }
    };

    fetchPins();
    const interval = setInterval(fetchPins, 10000); // Poll every 10s for real-time-ish feel
    return () => clearInterval(interval);
  }, [myLocation.lat, myLocation.lng, currentUsername]);

  const handleReport = async (pinId: string) => {
    try {
      const response = await fetch(API_BASE_URL + `/api/pins/${pinId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`,
          'x-username': currentUsername
        }
      });
      if (response.ok) {
        alert('Report recorded! Thank you for keeping the community safe.');
        // Refresh pins
        setAllPins(prev => prev.map(p => p.id === pinId ? { ...p, reports: (p.reports || 0) + 1 } : p));
      }
    } catch (err) {
      console.warn("Error reporting pin:", err);
    }
  };

  const handleRemovePin = useCallback(async () => {
    if (vendorPin) {
      try {
        await fetch(API_BASE_URL + `/api/pins/${vendorPin.id}/deactivate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`,
            'x-username': currentUsername
          }
        });
      } catch (err) {
        console.warn("Failed to deactivate pin on server:", err);
      }
    }
    setVendorPin(null);
    scopedStorage.removeItem('myVendorPin');
  }, [vendorPin, currentUsername]);

  // Geofence states
  const [showGeofenceAlert, setShowGeofenceAlert] = useState(false);
  const [geofenceCountdown, setGeofenceCountdown] = useState(300);

  // Vendor Geofence simulation effect
  useEffect(() => {
    if (user?.type === 'Vendor' && vendorPin && screen === 'vendorHome') {
      const dist = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, vendorPin.lat, vendorPin.lng);
      // Disappear after 500 meters of movement (0.5 km)
      if (dist > 0.5 && !showGeofenceAlert) {
        setShowGeofenceAlert(true);
        setGeofenceCountdown(10); // 10 seconds per requirements
      } else if (dist <= 0.5 && showGeofenceAlert) {
        setShowGeofenceAlert(false);
      }
    }
  }, [myLocation, vendorPin, user, screen]);

  useEffect(() => {
    if (showGeofenceAlert && geofenceCountdown > 0) {
      const t = setTimeout(() => setGeofenceCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (showGeofenceAlert && geofenceCountdown === 0) {
      // Timeout reached, auto-delete pin from server and local state
      handleRemovePin();
      setShowGeofenceAlert(false);
    }
  }, [showGeofenceAlert, geofenceCountdown, handleRemovePin]);

  // Helper
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  }

  const getSortedPins = () => {
    return [...allPins].sort((a, b) => {
      const distA = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, a.lat, a.lng);
      const distB = getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, b.lat, b.lng);
      return distA - distB;
    });
  };

  // Common Header
  const Header = ({ title, showBack = true, onBackClick = onBack }: { title: string, showBack?: boolean, onBackClick?: () => void }) => (
    <div className="h-14 shrink-0 flex items-center px-4 bg-white border-b border-neutral-200">
      {showBack && (
        <button onClick={onBackClick} className="p-2 -ml-2 text-neutral-600 hover:bg-neutral-100 rounded-full active:scale-95">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-neutral-900 font-semibold text-lg ml-2">{title}</h1>
    </div>
  );

  // --- Screens ---

  const ChoiceScreen = () => {
    const handleSelectMode = (mode: 'Customer' | 'Vendor') => {
      const proceed = () => {
        setUser({ name: currentUsername || 'User', email: '', type: mode });
        setScreen(mode === 'Customer' ? 'customerHome' : 'vendorHome');
      };

      if (locationGranted) {
        proceed();
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setMyLocation(loc);
              scopedStorage.setItem('lastLocationCache', JSON.stringify({ loc, timestamp: Date.now() }));
              setLocationGranted(true);
              proceed();
            },
            (err) => {
              console.warn("Location permission denied, using default/cached location", err);
              // Always proceed so the app works and doesn't lock the user out!
              setLocationGranted(true);
              proceed();
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
          );
        } else {
          console.warn("Geolocation not supported");
          setLocationGranted(true);
          proceed();
        }
      }
    };

    return (
      <div className="h-full flex flex-col bg-transparent text-white">
        <div className="flex items-center px-4 pt-10 pb-2 h-[80px] safe-area-top">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-white -ml-2 rounded-full hover:bg-neutral-800 active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-normal text-[22px] ml-1 tracking-wide">Pin My Stall</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-6 px-6 pb-20">
          <button
            onClick={() => handleSelectMode('Customer')}
            className="w-[140px] h-[140px] bg-black/20 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center gap-5 border border-white/10 hover:bg-black/20 active:scale-95 transition-all group"
          >
            <div className="text-white group-hover:scale-105 transition-transform duration-300">
              <Search className="w-12 h-12 stroke-[1.5]" />
            </div>
            <span className="text-[20px] font-normal tracking-wide">Search</span>
          </button>

          <button
            onClick={() => handleSelectMode('Vendor')}
            className="w-[140px] h-[140px] bg-black/20 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center gap-5 border border-white/10 hover:bg-black/20 active:scale-95 transition-all group"
          >
            <div className="text-white group-hover:scale-105 transition-transform duration-300">
              <MapPin className="w-12 h-12 stroke-[1.5]" />
            </div>
            <span className="text-[20px] font-normal tracking-wide">Pin</span>
          </button>
        </div>
      </div>
    );
  };

  const ProfileScreen = () => {
    const [name, setName] = useState(currentUsername || '');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [type, setType] = useState<'Customer' | 'Vendor'>('Customer');

    return (
      <div className="h-full flex flex-col bg-transparent text-neutral-900">
        <Header title="Create Profile" onBackClick={onBack} />
        <div className="flex-1 p-6 space-y-6 bg-white/10 backdrop-blur-md rounded-t-3xl mt-4">
          <div className="flex justify-center py-6">
            <div className="w-24 h-24 bg-neutral-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-neutral-400">
              <UserIcon className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">First Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Enter full name" />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Enter email" />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Password</label>
              <input value={pass} onChange={e => setPass(e.target.value)} type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Create password" />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Account Type</label>
              <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer text-neutral-900">
                <option value="Customer">Normal Customer</option>
                <option value="Vendor">Food Vendor / Handcart</option>
              </select>
            </div>
          </div>
          <button 
            onClick={() => {
              const profileData = { name: name || currentUsername || 'User', email, type };
              setUser(profileData);
              scopedStorage.setItem('booran_stall_user', JSON.stringify(profileData));
              setScreen(type === 'Vendor' ? 'vendorHome' : 'customerHome');
            }}
            className="w-full mt-4 py-4 bg-[#142A4A] text-white font-semibold rounded-xl hover:bg-[#0f2038] active:scale-95 transition-all shadow-md"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  };

  const CustomerHomeMap = () => {
    const mapRef = useRef<L.Map>(null);
    const [selectedPin, setSelectedPin] = useState<PinData | null>(null);

    return (
      <div className="h-full flex flex-col bg-transparent text-white">
        <div className="flex items-center px-2 pt-10 pb-3 shrink-0 bg-transparent text-white safe-area-top">
          <button onClick={() => { setScreen('choice'); setLocationGranted(false); }} className="w-10 h-10 flex items-center justify-center text-white mr-1 rounded-full hover:bg-neutral-800 active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
             <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
             <circle cx="12" cy="10" r="3"></circle>
             <path d="M7 23h10" strokeLinecap="round" />
          </svg>
          <span className="font-normal text-[26px] tracking-wide mt-1">Find Stalls</span>
        </div>

        <div className="flex-1 relative bg-slate-100 z-0">
          {(new Date().getHours() < 4 || new Date().getHours() >= 24) && (
            <div className="absolute top-4 left-4 right-4 bg-amber-500 text-neutral-900 px-4 py-2.5 rounded-2xl text-center text-xs font-bold shadow-md z-[500] flex items-center justify-center gap-1.5 border border-amber-600">
              <span>⚠️ Service hours: 4:00 AM - 12:00 AM. Stalls are currently hidden.</span>
            </div>
          )}
          <MapContainer key="customer-home-map-container" center={[myLocation.lat, myLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef} zoomControl={false} attributionControl={false}>
            <MapUpdater />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Custom Leaflet Attribution Overlay */}
            <div className="absolute right-4 top-20 bg-white/80 backdrop-blur-md border border-neutral-200/50 px-2 py-1 z-[1000] text-[10px] text-neutral-800 rounded-md pointer-events-none shadow-sm">
              <span className="text-blue-600 font-medium">Leaflet</span> & <span className="font-medium">OpenStreetMap</span>
            </div>

            {/* Custom Zoom Controls (Top Left) */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col bg-white rounded-md shadow-md overflow-hidden text-black border border-neutral-200">
                <button className="w-[34px] h-[34px] flex items-center justify-center font-bold text-lg border-b border-neutral-200 hover:bg-neutral-50" onClick={() => mapRef.current?.zoomIn()}>+</button>
                <button className="w-[34px] h-[34px] flex items-center justify-center font-bold text-xl hover:bg-neutral-50" onClick={() => mapRef.current?.zoomOut()}>−</button>
            </div>

            {/* Locate Me FAB */}
            <button 
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo([myLocation.lat, myLocation.lng], 14, { animate: true });
                }
              }}
              className="absolute top-4 right-4 p-3 rounded-2xl shadow-md z-[400] text-blue-600 hover:bg-slate-50 cursor-pointer transition-all bg-white"
              title="Locate me"
            >
              <Navigation className="w-[22px] h-[22px]" />
            </button>

            {/* Vendor Pins & My Location... omitted here for brevity, let's keep them functional */}
            <Circle center={[myLocation.lat, myLocation.lng]} radius={15000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }} />
            <Marker position={[myLocation.lat, myLocation.lng]} icon={customUserIcon}>
               <Popup>You are here</Popup>
            </Marker>

            {getSortedPins().map(pin => (
              <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={customVendorIcon} eventHandlers={{ click: () => setSelectedPin(pin) }}>
                <Popup>
                  <strong>{pin.vendorName}</strong>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Vendor Card when a pin is selected */}
          {selectedPin && (
            <div className="absolute bottom-[104px] left-4 right-4 bg-white text-black rounded-2xl shadow-2xl border border-neutral-100 p-4 z-[400] animate-fade-in">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-neutral-900 font-bold text-lg">{selectedPin.vendorName}</h3>
                  <p className="text-neutral-500 text-sm">{selectedPin.desc}</p>
                </div>
                <button onClick={() => setSelectedPin(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">✕</button>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => {
                    handleReport(selectedPin.id);
                    setSelectedPin(null);
                  }} 
                  className="flex-1 py-2.5 bg-slate-100 text-orange-600 font-medium rounded-xl hover:bg-slate-200 text-sm"
                >
                  Report Pin ({selectedPin.reports || 0})
                </button>
                <button className="flex-[2] py-2.5 bg-[#142A4A] text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-md">
                  <Navigation className="w-4 h-4" /> Get Directions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Drawer */}
        <div className="h-[240px] bg-black/20 backdrop-blur-md rounded-t-[28px] pt-4 px-6 -mt-5 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col shrink-0 flex-1">
          <h2 className="text-[24px] font-normal mb-4 tracking-wide text-white mt-1 shrink-0">Available Stalls Nearby</h2>
          <div className="flex-1 overflow-y-auto pb-4 space-y-3">
            {getSortedPins().length > 0 ? (
               getSortedPins().map((pin, idx) => (
                <div key={pin.id || idx} className="flex items-start justify-between bg-[#1a1c1d] p-3 rounded-2xl cursor-pointer hover:bg-[#2a2c2d] transition-colors" onClick={() => {
                  setSelectedPin(pin);
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-[50px] h-[50px] bg-neutral-800 rounded-xl flex shrink-0 items-center justify-center text-white font-bold text-lg">
                      {pin.vendorName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[18px] font-medium leading-tight tracking-wide mb-1 text-white">{pin.vendorName}</span>
                      <div className="flex items-center gap-3 text-[14px] font-medium tracking-wide text-neutral-400">
                        <span>{pin.openTime} <span className="text-neutral-600 border-x border-neutral-600 px-2 mx-1">to</span> {pin.closeTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end pt-1 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-1">
                       <path d="M12 2v14" stroke="#ff4500" strokeWidth="2" strokeLinecap="round" />
                       <path d="M12 2l6 4-6 3" fill="#ff4500" stroke="#ff4500" strokeWidth="1" strokeLinejoin="round" />
                       <path d="M7 18 C 7 16.5, 17 16.5, 17 18 C 17 19.5, 7 19.5, 7 18 Z" stroke="#ff4500" strokeWidth="2" fill="none" />
                    </svg>
                    <div className="text-xs font-semibold text-neutral-500 whitespace-nowrap">{getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, pin.lat, pin.lng).toFixed(1)}km</div>
                  </div>
                </div>
               ))
            ) : (
               <div className="text-neutral-500 text-center mt-6">No stalls within 15km</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const VendorHomeMap = () => {
    const mapRef = React.useRef<L.Map>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Form States
    const [inputOpen, setInputOpen] = useState('08:00');
    const [inputOpenAmPm, setInputOpenAmPm] = useState('AM');
    const [inputClose, setInputClose] = useState('08:00');
    const [inputCloseAmPm, setInputCloseAmPm] = useState('PM');
    const [inputDesc, setInputDesc] = useState('');
    
    // Modal State
    const [showPinnedList, setShowPinnedList] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const triggerToast = (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
      setValidationError(null);
    }, [inputOpen, inputClose, inputDesc, inputOpenAmPm, inputCloseAmPm]);

    const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const result = data[0];
          setMyLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        } else {
          alert('Location not found');
        }
      } catch (err) {
        console.error(err);
      }
      setIsSearching(false);
    };

    const handlePin = async () => {
      const nowTime = new Date();
      const currentHr = nowTime.getHours();
      if (currentHr < 4 || currentHr >= 24) {
        setValidationError("Service hours are 4:00 AM to 12:00 AM. You cannot pin stalls at this time.");
        return;
      }
      if (!inputDesc.trim()) {
        setValidationError("Please enter what you sell!");
        return;
      }

      setValidationError(null);
      setIsDrawerOpen(false);

      const applyPin = async (lat: number, lng: number) => {
        let expiresAt: number | undefined;
        try {
          const [hoursStr, minutesStr] = inputClose.split(':');
          let hours = parseInt(hoursStr) || 0;
          const minutes = parseInt(minutesStr) || 0;
          if (inputCloseAmPm === 'PM' && hours < 12) hours += 12;
          if (inputCloseAmPm === 'AM' && hours === 12) hours = 0;

          const now = new Date();
          const expiresDate = new Date();
          expiresDate.setHours(hours, minutes, 0, 0);

          if (expiresDate.getTime() <= now.getTime()) {
            expiresDate.setDate(expiresDate.getDate() + 1);
          }
          expiresAt = expiresDate.getTime();
        } catch (e) {}

        try {
          const response = await fetch(API_BASE_URL + '/api/pins', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${scopedStorage.getItem('booran_token')}`,
              'x-username': currentUsername
            },
            body: JSON.stringify({
              vendorId: currentUsername,
              vendorName: currentUsername,
              description: inputDesc,
              lat,
              lng,
              openTime: `${inputOpen} ${inputOpenAmPm}`,
              closeTime: `${inputClose} ${inputCloseAmPm}`,
              expiresAt
            })
          });

          if (response.ok) {
            const data = await response.json();
            setVendorPin(data.pin);
            setIsDrawerOpen(true);
          } else {
            const err = await response.json();
            setValidationError(err.error || "Failed to pin stall.");
            setIsDrawerOpen(true);
          }
        } catch (err) {
          console.error("Error pinning stall:", err);
          setValidationError("Failed to pin stall. Please check your connection.");
          setIsDrawerOpen(true);
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => applyPin(pos.coords.latitude, pos.coords.longitude),
          (err) => {
             console.warn("Could not fetch exact location", err);
             applyPin(myLocation.lat, myLocation.lng);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      } else {
        applyPin(myLocation.lat, myLocation.lng);
      }
    };

    return (
      <div className="h-full flex flex-col bg-transparent text-white relative overflow-hidden">
        {/* Top Header Floating */}
        <div className="absolute top-0 left-0 right-0 z-[600] flex items-center justify-between px-4 pt-10 pb-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent w-full pointer-events-none safe-area-top">
          <div className="flex items-center gap-3">
            <button onClick={() => { setScreen('choice'); setLocationGranted(false); }} className="pointer-events-auto flex items-center justify-center p-1 -ml-1 rounded-full active:scale-95 transition-all text-white drop-shadow-md">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <div className="flex items-center gap-2 drop-shadow-md">
                 <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[#ff4500]">
                    <path d="M12 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="7" r="4" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 18 C 6 16.5, 18 16.5, 18 18 C 18 19.5, 6 19.5, 6 18 Z" stroke="currentColor" strokeWidth="2" fill="none" />
                 </svg>
                 <span className="font-medium text-[22px] tracking-wide mt-0.5">Pin A Stall</span>
            </div>
          </div>
          <button onClick={() => setShowPinnedList(true)} className="pointer-events-auto p-2 active:scale-95 transition-all drop-shadow-md">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="square">
               <path d="M21 15v4H3v-4" />
               <polyline points="16 8 12 3 8 8" />
               <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
        </div>

        {toast && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[700] bg-[#007AFF] text-white px-6 py-2.5 rounded-2xl shadow-2xl animate-fade-in font-bold text-xs uppercase tracking-wider">
            {toast}
          </div>
        )}

        <div className="flex-1 relative bg-slate-900 z-0">
          {(new Date().getHours() < 4 || new Date().getHours() >= 24) && (
            <div className="absolute top-4 left-4 right-4 bg-amber-500 text-neutral-900 px-4 py-2.5 rounded-2xl text-center text-xs font-bold shadow-md z-[500] flex items-center justify-center gap-1.5 border border-amber-600">
              <span>⚠️ Service hours: 4:00 AM - 12:00 AM. Stalls are currently hidden.</span>
            </div>
          )}
          <MapContainer key="vendor-home-map-container" center={[myLocation.lat, myLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef} zoomControl={false} attributionControl={false}>
            <MapUpdater />
            <LocationPicker
              isActive={!vendorPin && isDrawerOpen}
              onLocationSelect={(lat, lng) => {
                setMyLocation({ lat, lng });
                triggerToast("Pin location set! Tap 'Pin' to confirm.");
              }}
            />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Custom Leaflet Attribution Overlay */}
            <div className="absolute right-4 top-20 bg-white/80 backdrop-blur-md border border-neutral-200/50 px-2 py-1 z-[1000] text-[10px] text-neutral-800 rounded-md pointer-events-none shadow-sm">
              <span className="text-blue-600 font-medium">Leaflet</span> & <span className="font-medium">OpenStreetMap</span>
            </div>

            {/* Custom Zoom Controls (Top Left) */}
            <div className="absolute top-24 left-4 z-[400] flex flex-col bg-white rounded-md shadow-md overflow-hidden text-black border border-neutral-200">
                <button className="w-[34px] h-[34px] flex items-center justify-center font-bold text-lg border-b border-neutral-200 hover:bg-neutral-50 animate-none active:scale-95" onClick={() => mapRef.current?.zoomIn()}>+</button>
                <button className="w-[34px] h-[34px] flex items-center justify-center font-bold text-xl hover:bg-neutral-50 animate-none active:scale-95" onClick={() => mapRef.current?.zoomOut()}>−</button>
            </div>

            {/* Locate Me FAB */}
            <button 
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo([myLocation.lat, myLocation.lng], 14, { animate: true });
                }
              }}
              className="absolute top-24 right-4 p-3 rounded-2xl shadow-md z-[400] text-blue-600 hover:bg-slate-50 cursor-pointer transition-all bg-white"
              title="Locate me"
            >
              <Navigation className="w-[22px] h-[22px]" />
            </button>

            <Circle center={[myLocation.lat, myLocation.lng]} radius={15000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }} />
            <Marker position={[myLocation.lat, myLocation.lng]} icon={customUserIcon}>
               <Popup>You are here</Popup>
            </Marker>

            {getSortedPins().map(pin => (
              <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={customVendorIcon}>
                <Popup>
                  <strong>{pin.vendorName}</strong>
                  <p className="text-xs text-neutral-600 mt-1">{pin.desc}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Geofence Modal */}
          {showGeofenceAlert && (
            <div className="absolute inset-0 bg-black/20 z-[500] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4 ring-8 ring-red-50">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Geofence Alert!</h3>
                <p className="text-neutral-600 text-sm mb-4">You have moved more than 500 meters from your pinned location. Please update your pin or it will be removed automatically.</p>
                <div className="bg-neutral-100 px-4 py-2 rounded-xl mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-neutral-500" />
                  <span className="font-mono text-lg font-semibold tabular-nums text-neutral-800">
                    {Math.floor(geofenceCountdown / 60)}:{(geofenceCountdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => { handleRemovePin(); setShowGeofenceAlert(false); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl active:scale-95">Cancel Pin</button>
                  <button onClick={() => { setShowGeofenceAlert(false); }} className="flex-1 py-3 bg-[#142A4A] text-white font-semibold rounded-xl active:scale-95">Continue</button>
                </div>
              </div>
            </div>
          )}

          {/* Active Vendor Pin Action Area */}
          {vendorPin && (
            <div className="absolute bottom-[104px] left-4 right-4 flex flex-col gap-3 z-[400] animate-fade-in">
               <div className="bg-black/20 backdrop-blur-md text-white p-4 rounded-[28px] shadow-2xl border border-neutral-800 w-full flex flex-col">
                  <div className="flex justify-between items-center mb-4 px-2 mt-1">
                    <span className="text-sm font-semibold text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-5 h-5"/> Pin Active</span>
                    <span className="text-xs text-neutral-400 tabular-nums">Dist: {getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, vendorPin.lat, vendorPin.lng).toFixed(2)}km</span>
                  </div>
                  <button onClick={handleRemovePin} className="w-full py-4 bg-[#222222] hover:bg-[#333333] text-white font-medium text-[20px] rounded-[20px] tracking-wide active:scale-95 transition-all shadow-md">
                    Remove Pin
                  </button>
               </div>
            </div>
          )}

          {/* Bottom Drawer (Animated) - Add details */}
          {!vendorPin && (
            <div 
               className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md rounded-t-[32px] pt-4 px-5 pb-[110px] z-[500] shadow-[0_-15px_40px_rgba(0,0,0,0.6)] flex flex-col border-t border-[#1a1a1a] transition-transform duration-500 ease-in-out will-change-transform"
               style={{ transform: isDrawerOpen ? 'translateY(0)' : 'translateY(110%)' }}
            >
               <div className="flex items-start justify-between mb-4">
                  <h2 className="text-[24px] font-normal tracking-wide text-white leading-none mt-1">Add details</h2>
                  <button 
                    onClick={handlePin}
                    className="bg-[#007BFF] text-white px-6 py-1.5 rounded-[12px] font-semibold text-[18px] active:scale-95 transition-all shadow-md"
                  >
                     Pin
                  </button>
               </div>

               {validationError && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-[14px] rounded-xl p-3 mb-4 animate-fade-in flex items-center justify-between">
                     <span>{validationError}</span>
                     <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-300 font-bold ml-2">✕</button>
                  </div>
               )}

               <div className="flex gap-3 mb-3">
                  <div className="flex-1 flex flex-col gap-1">
                     <label className="text-[15px] font-normal text-white ml-0.5 tracking-wide">Open</label>
                     <div className="flex items-center h-[42px]">
                        <input type="text" value={inputOpen} onChange={e => setInputOpen(e.target.value)} className="w-full h-full bg-[#1c1c1c] text-white rounded-l-xl px-3 outline-none border-none text-[15px] placeholder-neutral-500 focus:bg-[#222222] transition-colors" placeholder="08:00" />
                        <div className="bg-[#1c1c1c] h-full flex flex-col justify-center px-2 rounded-r-xl border-l border-[#2e2e2e] text-[12px] select-none">
                           <span onClick={() => setInputOpenAmPm('AM')} className={`leading-tight cursor-pointer pb-0.5 ${inputOpenAmPm === 'AM' ? 'font-medium text-white' : 'text-white/50 hover:text-white'}`}>AM</span>
                           <span onClick={() => setInputOpenAmPm('PM')} className={`leading-tight cursor-pointer mt-0.5 ${inputOpenAmPm === 'PM' ? 'font-medium text-white' : 'text-white/50 hover:text-white'}`}>PM</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                     <label className="text-[15px] font-normal text-white ml-0.5 tracking-wide">Close</label>
                     <div className="flex items-center h-[42px]">
                        <input type="text" value={inputClose} onChange={e => setInputClose(e.target.value)} className="w-full h-full bg-[#1c1c1c] text-white rounded-l-xl px-3 outline-none border-none text-[15px] placeholder-neutral-500 focus:bg-[#222222] transition-colors" placeholder="10:00" />
                        <div className="bg-[#1c1c1c] h-full flex flex-col justify-center px-2 rounded-r-xl border-l border-[#2e2e2e] text-[12px] select-none">
                           <span onClick={() => setInputCloseAmPm('AM')} className={`leading-tight cursor-pointer pb-0.5 ${inputCloseAmPm === 'AM' ? 'font-medium text-white' : 'text-white/50 hover:text-white'}`}>AM</span>
                           <span onClick={() => setInputCloseAmPm('PM')} className={`leading-tight cursor-pointer mt-0.5 ${inputCloseAmPm === 'PM' ? 'font-medium text-white' : 'text-white/50 hover:text-white'}`}>PM</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-1 mb-1">
                   <label className="text-[15px] font-normal text-white ml-0.5 tracking-wide">What do you Sell ?</label>
                   <textarea 
                      value={inputDesc}
                      onChange={e => setInputDesc(e.target.value)}
                      className="w-full bg-[#1c1c1c] text-white rounded-xl p-3 outline-none border-none text-[15px] resize-none h-[64px] placeholder-neutral-500 focus:bg-[#222222] transition-colors"
                      placeholder="E.g., Fresh vegetables..."
                   ></textarea>
               </div>
            </div>
          )}

          {/* Custom Leaflet Attribution Overlay */}
          <div className="absolute right-4 top-20 bg-black/20 border border-white/10 backdrop-blur-md px-2 py-1 z-[1000] text-[10px] text-white/90 rounded-md pointer-events-none">
            <span className="text-blue-400 font-medium">Leaflet</span> & <span className="font-medium">OpenStreetMap</span>
          </div>
        </div>
          
        {/* Pinned Stall List Modal */}
        {showPinnedList && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md z-[700] flex flex-col pt-10 px-4 pb-6 animate-fade-in">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-white text-2xl font-bold">Pinned Stalls</h2>
               <button onClick={() => setShowPinnedList(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95">✕</button>
             </div>
             
             <div className="flex-1 overflow-y-auto">
               {getSortedPins().length > 0 ? (
                 <div className="flex flex-col gap-4">
                    {getSortedPins().map((pin, i) => (
                      <div key={pin.id || i} className="bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-white text-xl font-semibold">{pin.vendorName}</h3>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleReport(pin.id)} className="text-orange-500 text-sm font-medium hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                              Report ({pin.reports || 0})
                            </button>
                            {pin === vendorPin && (
                              <button onClick={() => { setVendorPin(null); setShowPinnedList(false); }} className="text-red-500 text-sm font-medium hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-neutral-400 mb-4">{pin.desc}</p>
                        <div className="flex items-center gap-4 text-sm text-neutral-300">
                           <div className="flex items-center gap-1.5 bg-[#2a2a2a] px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4"/> {pin.openTime}</div>
                           <span className="text-neutral-500">to</span>
                           <div className="flex items-center gap-1.5 bg-[#2a2a2a] px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4"/> {pin.closeTime}</div>
                        </div>
                        <div className="mt-3 text-xs text-neutral-500 tabular-nums">Distance: {getDistanceFromLatLonInKm(myLocation.lat, myLocation.lng, pin.lat, pin.lng).toFixed(2)}km</div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-neutral-500 mt-20">
                   <MapPin className="w-16 h-16 mb-4 opacity-20" />
                   <p className="text-lg">No pinned stalls nearby (15km).</p>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    );
  };

  const CreatePinScreen = () => {
    const [stallName, setStallName] = useState('My Stall');
    const [desc, setDesc] = useState('');
    const [open, setOpen] = useState('09:00');
    const [close, setClose] = useState('22:00');

    return (
      <div className="h-full flex flex-col bg-transparent text-neutral-900">
        <Header title="Create Pin Detail" onBackClick={() => setScreen('vendorHome')} />
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white/10 backdrop-blur-md rounded-t-3xl mt-4">
           <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Stall Name</label>
              <input value={stallName} onChange={e => setStallName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What do you sell here?" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Opening Time</label>
                <input value={open} onChange={e => setOpen(e.target.value)} type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Closing Time</label>
                <input value={close} onChange={e => setClose(e.target.value)} type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <button 
              onClick={() => {
                // Pass intermediate state if needed, here just jumping to checkout
                setScreen('checkout');
              }}
              className="w-full mt-8 py-4 bg-[#142A4A] text-white font-semibold rounded-xl hover:bg-[#0f2038] active:scale-95 transition-all shadow-md"
            >
              Configure Map Placement
            </button>
        </div>
      </div>
    );
  };

  const CheckoutScreen = () => {
    return (
      <div className="h-full flex flex-col bg-transparent text-neutral-900">
        <Header title="Checkout" onBackClick={() => setScreen('createPin')} />
        <div className="flex-1 p-6 flex flex-col bg-white/10 backdrop-blur-md rounded-t-3xl mt-4">
          <div className="bg-white rounded-3xl p-8 mb-6 text-center shadow-sm border border-neutral-100 flex flex-col items-center">
             <CreditCard className="w-12 h-12 text-blue-500 mb-3" />
             <p className="text-neutral-500 font-medium mb-1 uppercase tracking-widest text-xs">Payment Gateway</p>
             <h2 className="text-4xl font-black text-neutral-900 tabular-nums">₹99</h2>
          </div>
          
          <h3 className="text-sm font-bold text-neutral-800 mb-3 px-2">Payment Options</h3>
          <div className="space-y-3 mb-8">
            <button className="w-full p-4 bg-white border border-blue-500 ring-1 ring-blue-500 rounded-2xl flex items-center justify-between text-left shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-blue-700">UPI</div>
                <span className="font-semibold">UPI Apps (GPay, PhonePe)</span>
              </div>
              <div className="w-5 h-5 rounded-full border-[6px] border-blue-500 bg-white" />
            </button>
            <button className="w-full p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between text-left opacity-70 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">CC</div>
                <span className="font-semibold text-slate-600">Credit / Debit Card</span>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
            </button>
          </div>

          <button 
            onClick={() => {
              const finalize = async (lat: number, lng: number) => {
                const pinId = "my-pin-" + Date.now();
                setVendorPin({
                  id: pinId,
                  vendorName: 'My Active Stall',
                  desc: 'Freshly pinned',
                  lat,
                  lng,
                  openTime: '09:00 AM',
                  closeTime: '10:00 PM'
                });
                setScreen('vendorHome');

                // Persist to server db
                try {
                  const token = scopedStorage.getItem('booran_token');
                  const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                  };
                  if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                  } else {
                    headers['x-username'] = currentUsername;
                  }

                  await fetch(API_BASE_URL + '/api/pins', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                      vendorId: currentUsername,
                      vendorName: 'My Active Stall',
                      description: 'Freshly pinned',
                      lat,
                      lng,
                      openTime: '09:00 AM',
                      closeTime: '10:00 PM'
                    })
                  });
                } catch (err) {
                  console.warn("Failed to persist pin to server:", err);
                }
              };
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => finalize(pos.coords.latitude, pos.coords.longitude),
                  () => finalize(myLocation.lat, myLocation.lng),
                  { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
                );
              } else {
                finalize(myLocation.lat, myLocation.lng);
              }
            }}
            className="w-full mt-auto py-4 bg-[#142A4A] text-white font-semibold rounded-xl hover:bg-[#0f2038] active:scale-95 transition-all shadow-[0_10px_40px_rgba(20,42,74,0.3)] text-lg"
          >
            Pay Now
          </button>
        </div>
      </div>
    );
  };

  const ReportFormScreen = () => {
    const [reason, setReason] = useState('');
    return (
      <div className="h-full flex flex-col bg-transparent text-neutral-900">
        <Header title="Report Pin Form" onBackClick={() => setScreen('customerHome')} />
        <div className="flex-1 p-6 space-y-6 bg-white/10 backdrop-blur-md rounded-t-3xl mt-4">
           <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Reason for Report</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
                <option>Vendor is not physically here</option>
                <option>Information is incorrect</option>
                <option>Offensive content</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Detailed Message</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide additional details..." rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>

            <button 
              onClick={() => {
                alert('Report submitted successfully! Community moderators will review.');
                setScreen('customerHome');
              }}
              className="w-full mt-4 py-4 bg-[#142A4A] text-white font-semibold rounded-xl hover:bg-[#0f2038] active:scale-95 transition-all shadow-md"
            >
              Submit Report
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[100] w-full h-full relative overflow-hidden bg-transparent text-black">
      {screen === 'choice' && <ChoiceScreen />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'customerHome' && <CustomerHomeMap />}
      {screen === 'vendorHome' && <VendorHomeMap />}
      {screen === 'createPin' && <CreatePinScreen />}
      {screen === 'checkout' && <CheckoutScreen />}
      {screen === 'reportForm' && <ReportFormScreen />}
    </div>
  );
}
