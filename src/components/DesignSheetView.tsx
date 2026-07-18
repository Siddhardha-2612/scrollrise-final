import { useState } from 'react';
import { getHumanAvatar } from '../utils/avatar';
import { 
  ArrowLeft, Eye, EyeOff, Sparkles, Home, MessageSquare, Camera, LayoutGrid, CheckCircle2, Trash2, 
  UserX, Smartphone, Monitor, Globe, Mail, Lock, Plus, Music, Star, ArrowRight, ShieldAlert,
  Sliders, Settings, Bell, RefreshCw, Layers, Check, ShoppingBag, Shield, Heart, FileText, Send, X, AlertTriangle
} from 'lucide-react';

export default function DesignSheetView() {
  // Navigation switch inside our preview sheet (optional highlight)
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  // States to make the Design Sheet interactive!
  const [splashLoading, setSplashLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [loginFormUser, setLoginFormUser] = useState('admin');
  const [loginFormPass, setLoginFormPass] = useState('password');
  const [loginFormInvite, setLoginFormInvite] = useState('352e');
  const [loginError, setLoginError] = useState('Incorrect security key mismatch. Please check invite token.');

  // Settings & Privacy Toggles inside Sheet
  const [swipeQuality, setSwipeQuality] = useState<'high' | 'eco'>('high');
  const [dataSaver, setDataSaver] = useState(true);
  const [aiResolution, setAiResolution] = useState(true);
  const [originalAiResolution, setOriginalAiResolution] = useState(false);

  // Privacy Hub Custom States
  const [userNameHide, setUserNameHide] = useState(true);
  const [fingersAndEyeBlur, setFingersAndEyeBlur] = useState(false);
  const [screenshotRecLock, setScreenshotRecLock] = useState(true);
  const [personalMobile, setPersonalMobile] = useState('+91 98480 22338');
  const [personalBirthdate, setPersonalBirthdate] = useState('2000-06-15');

  // Blocked list inside Sheet
  const [blockedItems, setBlockedItems] = useState([
    { id: 'b1', handle: '@spammer_core', reason: 'Repeated API Handshake spam' },
    { id: 'b2', handle: '@bot_alpha9', reason: 'Unverified packet signature' },
    { id: 'b3', handle: '@noise_injector', reason: 'Fingers blur bypass attempts' }
  ]);
  const [selectedBlockedIds, setSelectedBlockedIds] = useState<string[]>(['b1']);

  // Music clips list
  const [selectedMusicId, setSelectedMusicId] = useState('m1');
  const musicClips = [
    { id: 'm1', title: 'Booran Drift Wave', author: 'Booran Core Audio', duration: '0:15' },
    { id: 'm2', title: 'Cyberwave Handshake v5.1', author: 'Zack Holmes', duration: '0:30' },
    { id: 'm3', title: 'Pulse Echo (120 BPM)', author: 'Sofia Chen', duration: '0:12' }
  ];

  // Ad banner input state inside sheet
  const [adAmount, setAdAmount] = useState('64,500');
  const [adGridActive, setAdGridActive] = useState(true);

  // Stars Specialty count
  const [ratingStars, setRatingStars] = useState(4.8);

  // Shopi Hub Cart Simulation
  const [cartCount, setCartCount] = useState(2);
  const shopProducts = [
    { id: '1', title: 'Secure Crypt-USB Dongle', price: '₹4,500', isHot: true, label: 'Secured Hardware Key' },
    { id: '2', title: 'Tactile Handshake Ring', price: '₹8,350', isHot: false, label: 'NFC Pass Token' },
    { id: '3', title: 'Anti-Record Screen Filter', price: '₹1,200', isHot: true, label: 'Matte Eye Shield' },
    { id: '4', title: 'Booran Premium Core Node', price: '₹18,990', isHot: false, label: 'Pro Host Server' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#070709] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] font-sans text-neutral-100 p-4 sm:p-8 md:p-12 overflow-x-hidden">
      
      {/* Design Poster Header Bar */}
      <div className="max-w-7xl mx-auto mb-10 border-b border-white/5 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-[#F52C68] to-[#9c27b0] text-white font-mono text-[10px] font-bold uppercase rounded-full tracking-widest leading-none shadow-[0_0_15px_rgba(245,44,104,0.3)]">
                SPEC-SHEET V2.0
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">Figma-Grade UI Ecosystem Map</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white flex items-center gap-3">
              Booran <span className="font-sans font-light text-neutral-500 text-2xl">| Visual Blueprint Sheet</span>
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              This high-resolution, production-quality design document organizes the entire 16-view social media ecosystem 
              of <span className="text-white font-semibold">Booran</span> in customized device outlines. Every element conforms 
              to our strict dark mode aesthetic with hot pink accents and sharp white typography.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-neutral-900/60 border border-white/5 p-3 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className="text-left font-mono">
                <span className="text-[9px] text-neutral-500 uppercase block leading-none font-bold">Total Framed Ecosystem</span>
                <span className="text-xl font-black text-[#F52C68] tracking-tight">16 Live Views</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="text-left font-mono">
                <span className="text-[9px] text-neutral-500 uppercase block leading-none font-bold">Accent Palette</span>
                <span className="text-[10px] text-white uppercase font-bold flex items-center gap-1.5 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F52C68] inline-block shadow-[0_0_8px_rgba(245,44,104,0.5)]" />
                  #F52C68 Hot Pink
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Canvas Arrangement */}
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* ROW SECTION 1: ONBOARDING & ACCOUNT HANDSHAKE */}
        <section className="space-y-6">
          <div className="border-l-2 border-[#F52C68] pl-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">Section 1: Onboarding & Handshake Entry</h2>
            <p className="text-xs text-neutral-500">Pristine layouts for Splash screen, Authentication portals, and Account Credential setups.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* SCREEN 1: SPLASH VIEW */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>01. Splash Boot</span>
                <span className="text-neutral-600">Active Animation</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-5 overflow-hidden flex flex-col justify-between">
                {/* Device outline status mock */}
                <div className="flex justify-between items-center text-[8.5px] font-mono text-neutral-500">
                  <span>05:39 UTC</span>
                  <div className="w-16 h-4 bg-neutral-900 rounded-b-lg flex items-center justify-center border-x border-b border-white/5" />
                  <span className="flex items-center gap-1">LTE <span className="w-2.5 h-1.5 bg-neutral-500 rounded-sm inline-block" /></span>
                </div>

                <div className="my-auto flex flex-col items-center text-center">
                  {/* Hexagon App Logo placeholder */}
                  <div className="w-16 h-16 relative bg-gradient-to-tr from-[#F52C68] to-[#9c27b0] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(245,44,104,0.4)]">
                    <span className="text-white font-display font-bold text-2xl italic tracking-wider">B</span>
                  </div>
                  <h3 className="mt-5 text-4xl font-cursive text-white text-center tracking-wide [text-shadow:0_0_15px_rgba(255,255,255,0.15)] leading-tight">
                    Booran
                  </h3>
                  <div className="mt-8 flex space-x-1 justify-center items-center">
                    <div className="h-1.5 w-1.5 bg-[#F52C68] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 bg-[#F52C68] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 bg-[#F52C68] rounded-full animate-bounce"></div>
                  </div>
                </div>

                <div className="text-center font-mono text-[8px] text-neutral-600">
                  SYSTEM INITIALIZING SECURE PACKETS
                </div>
              </div>
            </div>

            {/* SCREEN 2: AUTH WELCOME GATEWAY */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>02. Auth Welcome</span>
                <span className="text-[#F52C68]">Handshake Link</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-5 overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center text-[8.5px] font-mono text-neutral-500">
                  <span>05:39 UTC</span>
                  <div className="w-16 h-4 bg-neutral-900 rounded-b-lg" />
                  <span className="flex items-center gap-1">LTE <span className="w-2.5 h-1.5 bg-neutral-500 rounded-sm inline-block" /></span>
                </div>

                <div className="space-y-6 my-auto text-center px-2">
                  <div className="w-12 h-12 mx-auto bg-neutral-900 border border-white/10 rounded-xl flex items-center justify-center">
                    <span className="text-xs text-brand-pink font-bold font-mono">B_R</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black tracking-tight text-white uppercase">BOORAN CORE</h3>
                    <p className="text-[10px] text-neutral-400 leading-normal mt-1 max-w-[200px] mx-auto">
                      Establish a node link or authorize credentials to join the unified mesh.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-4">
                    <button className="w-full py-2.5 bg-gradient-to-r from-[#F52C68] to-[#a32cc4] text-white text-[10px] font-bold tracking-widest font-mono rounded-full uppercase cursor-pointer hover:opacity-90 shadow-md">
                      SECURE HANDSHAKE LOGIN
                    </button>
                    <button className="w-full py-2.5 bg-neutral-900/85 border border-white/15 text-neutral-200 text-[10px] font-bold tracking-widest font-mono rounded-full uppercase cursor-pointer hover:bg-neutral-800">
                      CREATE IDENTITY PACKET
                    </button>
                  </div>
                </div>

                <div className="text-center font-mono text-[8px] text-neutral-600 uppercase">
                  UNAUTHORIZED IP HOVER RESTRICTED
                </div>
              </div>
            </div>

            {/* SCREEN 3: LOGIN FORM FIELD */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>03. Credential Login</span>
                <span className="text-red-500">Password Fail State</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-5 overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center text-[8.5px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Back</span>
                  <div className="w-16 h-4 bg-neutral-900 rounded-b-lg" />
                  <span className="flex items-center gap-1">LTE <span className="w-2.5 h-1.5 bg-neutral-500 rounded-sm inline-block" /></span>
                </div>

                <div className="space-y-3.5 my-auto text-left">
                  <h4 className="text-md font-display font-black text-white leading-tight uppercase">Authorize Node</h4>
                  
                  {/* Fail Warning Box */}
                  <div className="p-2 border border-red-500/30 bg-red-950/20 rounded-xl space-y-1">
                    <div className="text-[8px] text-red-400 uppercase font-mono font-bold leading-none flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" /> Authorization Error
                    </div>
                    <p className="text-[7.5px] text-red-300 leading-tight">
                      Incorrect security code passcode matching invite.
                    </p>
                  </div>

                  {/* Username Field */}
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">Username / Identity Code</label>
                    <div className="h-8.5 bg-white rounded-full flex items-center px-3 border border-transparent">
                      <input 
                        type="text" 
                        readOnly 
                        value="admin" 
                        className="w-full h-full bg-transparent text-black text-[10px] uppercase font-bold tracking-tight outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">Identity Password</label>
                    <div className="h-8.5 bg-white rounded-full flex items-center justify-between px-3 border border-transparent">
                      <input 
                        type="password" 
                        readOnly 
                        value="••••••••••••••" 
                        className="bg-transparent text-black text-[10px] outline-none"
                      />
                      <EyeOff className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    </div>
                  </div>

                  {/* Secret invite code input */}
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-[#F52C68] uppercase tracking-wider text-[#F52C68] block">Secret Code passcode</label>
                    <div className="h-8.5 bg-white/10 rounded-full flex items-center px-3 border border-[#F52C68]/40">
                      <input 
                        type="text" 
                        readOnly 
                        value={loginFormInvite} 
                        className="w-full h-full bg-transparent text-white text-[10px] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 leading-none">
                    <span className="text-[8px] text-neutral-400 underline cursor-pointer">Forgot password?</span>
                    <button className="px-5 py-1.5 bg-[#F52C68] hover:opacity-90 active:scale-95 text-white font-mono font-bold text-[9px] rounded-full uppercase tracking-widest cursor-pointer leading-none">
                      NEXT
                    </button>
                  </div>
                </div>

                <div className="text-center font-mono text-[7px] text-neutral-500">
                  BOOT KEY: 0x76FF-ADMINISTRATOR
                </div>
              </div>
            </div>

            {/* SCREEN 4: REGISTRATION SETUP */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>04. New Account Handle</span>
                <span className="text-neutral-500">Secure Setup</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-5 overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center text-[8.5px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Back</span>
                  <div className="w-16 h-4 bg-neutral-900 rounded-b-lg" />
                  <span className="flex items-center gap-1">LTE <span className="w-2.5 h-1.5 bg-neutral-500 rounded-sm inline-block" /></span>
                </div>

                <div className="space-y-3.5 my-auto text-left">
                  <h4 className="text-md font-display font-black text-white leading-none uppercase">CREATE HANDLE</h4>
                  <p className="text-[8.5px] text-neutral-500 leading-tight">
                    Each device generates a local encryption pair mapped to your username.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-bold text-neutral-500 block uppercase">Enter Unique Handle username</label>
                    <div className="h-8.5 bg-neutral-900 border border-white/10 rounded-full flex items-center px-3">
                      <input type="text" readOnly value="@your_handle" className="w-full bg-transparent text-white text-[9.5px] outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-bold text-neutral-500 block uppercase">Primary Key Password</label>
                    <div className="h-8.5 bg-neutral-900 border border-white/10 rounded-full flex items-center justify-between px-3">
                      <input type="password" readOnly value="secretpass" className="w-full bg-transparent text-white text-[9.5px] outline-none" />
                      <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-bold text-neutral-500 block uppercase">Secret Invite Key</label>
                    <div className="h-8.5 bg-neutral-900 border border-white/10 rounded-full flex items-center px-3">
                      <input type="text" readOnly placeholder="Enter invite code" className="w-full bg-transparent text-neutral-400 text-[9.5px] outline-none" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1 border-t border-white/5 mt-2">
                    <div className="w-3.5 h-3.5 rounded bg-[#F52C68] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                    <span className="text-[7.5px] text-neutral-400">Agree to secure decentralized packet ledger.</span>
                  </div>

                  <button className="w-full py-2 bg-gradient-to-r from-[#F52C68] to-[#9c27b0] text-white font-mono font-bold text-[9px] uppercase rounded-full tracking-widest mt-2 cursor-pointer">
                    DEPLOY ID
                  </button>
                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600">
                  SECURE MESH LEDGER ACTIVE
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ROW SECTION 2: STRUCTURED MAIN FEED & CARDS SYSTEM */}
        <section className="space-y-6">
          <div className="border-l-2 border-[#9c27b0] pl-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">Section 2: High-dynamics main Feed & content cards</h2>
            <p className="text-xs text-neutral-500">Modular Feed grids showing profile cards in "Connects" and small video thumbnails in "Snippets."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* SCREEN 5: CORE FEED GRID AND TABS */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>05. Channel Feed Dashboard</span>
                <span className="text-[#F52C68]">Unified Home Hub</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4 overflow-hidden flex flex-col justify-between">
                
                {/* Header toolbar */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F52C68] to-[#9c27b0] flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">B</span>
                    </div>
                    <span className="text-xs font-display font-medium tracking-tight text-white leading-none">Booran</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F52C68] rounded-full" />
                      <Bell className="w-4 h-4 text-neutral-300" />
                    </div>
                    <img src={getHumanAvatar("booran")} className="w-5 h-5 rounded-md border border-white/10" />
                  </div>
                </div>

                {/* Sub Segment Tabs */}
                <div className="flex items-center space-x-2.5 py-2 border-b border-white/5">
                  <span className="text-[9.5px] font-mono font-bold text-[#F52C68] border-b border-[#F52C68] pb-0.5 cursor-pointer">CONNECTS</span>
                  <span className="text-[9.5px] font-mono text-neutral-500 font-bold hover:text-white cursor-pointer">SNIPPETS VIEW</span>
                  <span className="text-[8px] bg-neutral-900 border border-white/10 text-neutral-400 px-1.5 py-0.2 rounded ml-auto">PRO</span>
                </div>

                {/* Vertical Scroll Area Mock */}
                <div className="flex-1 overflow-y-auto space-y-3 py-2.5 custom-scrollbar pr-0.5">
                  
                  {/* Category Filter list */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                    <span className="text-[7.5px] font-mono bg-[#F52C68] text-white px-2 py-0.5 rounded-full font-bold">New</span>
                    <span className="text-[7.5px] font-mono bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded-full hover:text-white">Music & Ent</span>
                    <span className="text-[7.5px] font-mono bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded-full hover:text-white">Study</span>
                    <span className="text-[7.5px] font-mono bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded-full">Careers</span>
                  </div>

                  {/* Horizontal Connects list */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono uppercase text-neutral-500 font-bold block">ACTIVE CHANNELS IN GRIDS</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-neutral-900 border border-white/5 p-1.5 rounded-xl text-center flex flex-col items-center">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" className="w-7 h-7 rounded-lg object-cover" />
                        <span className="text-[8px] font-bold text-white mt-1 leading-none select-none">@sof_cn</span>
                        <span className="text-[6.5px] text-[#F52C68] font-mono font-bold mt-0.5">9.8k pt</span>
                      </div>
                      <div className="bg-neutral-900 border border-white/5 p-1.5 rounded-xl text-center flex flex-col items-center">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80" className="w-7 h-7 rounded-lg object-cover" />
                        <span className="text-[8px] font-bold text-white mt-1 leading-none">@raj_pat</span>
                        <span className="text-[6.5px] text-[#F52C68] font-mono font-bold mt-0.5">7.4k pt</span>
                      </div>
                      <div className="bg-neutral-900 border border-white/5 p-1.5 rounded-xl text-center flex flex-col items-center">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" className="w-7 h-7 rounded-lg object-cover" />
                        <span className="text-[8px] font-bold text-white mt-1 leading-none">@diana_p</span>
                        <span className="text-[6.5px] text-[#F52C68] font-mono font-bold mt-0.5">14.1k pt</span>
                      </div>
                    </div>
                  </div>

                  {/* Standard Crisp Card */}
                  <div className="bg-neutral-950 border border-white/5 rounded-2xl p-2.5 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&h=80&q=80" className="w-5 h-5 rounded object-cover" />
                        <span className="text-[9px] font-bold text-stone-200">@zack_holmes</span>
                      </div>
                      <span className="text-[7px] text-neutral-500 font-mono">2m ago</span>
                    </div>
                    <p className="text-[8.5px] text-neutral-300 leading-normal font-sans">
                      Establish secure local key verification completed. Let's start the broadcast packet feed!
                    </p>
                    <div className="flex items-center gap-3 pt-1 border-t border-white/5 text-neutral-500 text-[10px]">
                      <span className="flex items-center gap-1 text-[#F52C68]"><Heart className="w-3.5 h-3.5 fill-current" /> 512</span>
                      <span className="flex items-center gap-1 text-neutral-400"><MessageSquare className="w-3.5 h-3.5" /> 23</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Bar lock */}
                <div className="flex justify-around items-center border-t border-white/5 pt-2.5">
                  <Home className="w-4 h-4 text-white" />
                  <MessageSquare className="w-4 h-4 text-neutral-500" />
                  <div className="w-6 h-6 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F52C68]" />
                  </div>
                  <Camera className="w-4 h-4 text-neutral-500" />
                  <LayoutGrid className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
            </div>

            {/* SCREEN 6: CORE REELS / SNIPPETS SWIPER VIEW */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>06. Sniper swiper</span>
                <span className="text-[#F52C68]">Vertical Reels Grid</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4 overflow-hidden flex flex-col justify-between">
                
                {/* Simulated Fullscreen vertical post background image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=700&q=80" 
                    className="w-full h-full object-cover opacity-60 filter saturate-50 contrast-110" 
                  />
                  {/* Subtle Dark gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />
                </div>

                {/* Overlay UI elements on Z-10 */}
                <div className="relative z-10 flex justify-between items-center text-[8.5px] font-mono text-neutral-300">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-[#F52C68]" /> Snippet 🎬</span>
                  <div className="px-1.5 py-0.5 bg-black/20 border border-white/5 rounded text-[8px] font-bold">Trending</div>
                  <span className="text-neutral-300 font-bold">12k Watched</span>
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-end text-left space-y-2 mt-auto">
                  
                  {/* Heart anim layout on double tap simulation */}
                  <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110 animate-pulse text-center">
                    <Heart className="w-12 h-12 text-[#F52C68] fill-current drop-shadow-[0_0_15px_rgba(245,44,104,0.7)]" />
                    <span className="text-[7.5px] font-mono bg-black/30 px-1.5 rounded text-white mt-1 uppercase">double tap like</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="space-y-1 bg-black/20 backdrop-blur-sm p-2 rounded-xl border border-white/5 max-w-[70%]">
                      <div className="flex items-center space-x-1.5">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&h=60&q=80" className="w-4 h-4 rounded-full" />
                        <span className="text-[9.5px] font-bold text-white leading-none">@raj_patel</span>
                        <span className="text-[7px] text-[#F52C68] font-bold uppercase tracking-wider font-mono">PRO</span>
                      </div>
                      <p className="text-[8px] text-neutral-300 line-clamp-2 leading-tight">
                        Authentic video posted securely. Custom backup keys active!
                      </p>
                      
                      {/* Song Backing Audio Tag with Realistic Data */}
                      <div className="flex items-center gap-1 text-[7.5px] text-[#F52C68] font-mono pt-0.5 leading-none font-bold">
                        <Music className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>Song name: Cyber Handshake - Core 1.0</span>
                      </div>
                    </div>

                    {/* Left Actions column */}
                    <div className="flex flex-col items-center space-y-3.5 bg-black/20 p-2 rounded-full border border-white/10 shadow-2xl mr-1">
                      <div className="flex flex-col items-center cursor-pointer">
                        <Heart className="w-5 h-5 text-[#F52C68] fill-current animate-pulse" />
                        <span className="text-[8px] font-bold text-white mt-0.5">843</span>
                      </div>
                      <div className="flex flex-col items-center cursor-pointer">
                        <MessageSquare className="w-5 h-5 text-neutral-300" />
                        <span className="text-[8px] font-bold text-stone-300 mt-0.5">49</span>
                      </div>
                      <div className="flex flex-col items-center cursor-pointer">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-[8px] font-bold text-stone-200 mt-0.5">Rating</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Horizontal Navigation indicators */}
                <div className="relative z-10 flex justify-center space-x-1.5 border-t border-white/5 pt-2 mt-2">
                  <div className="w-5 h-1 rounded-full bg-[#F52C68]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                </div>
              </div>
            </div>

            {/* SCREEN 7: HIGH-FIDELITY AD advertisement CARD */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>07. Own advertisement card</span>
                <span className="text-[#a32cc4]">Promoted Module</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span>Sponsored Broadcast</span>
                  <div className="px-1 py-0.2 bg-purple-950/40 text-purple-400 border border-purple-500/20 rounded font-bold uppercase tracking-wider text-[6.5px]">Premium Link</div>
                </div>

                <div className="space-y-3.5 my-auto text-left">
                  <div className="p-2 border border-white/10 bg-neutral-900/70 rounded-2xl space-y-2">
                    
                    {/* Sponsored Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                        <span className="text-[9.5px] uppercase font-bold tracking-tight text-white">BOORAN SECURE ADS</span>
                      </div>
                      <span className="text-[7.5px] text-neutral-500 uppercase font-mono">Active Budget</span>
                    </div>

                    {/* Large mockup banner */}
                    <div className="aspect-[16/10] bg-gradient-to-tr from-[#9c27b0] to-[#F52C68] rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner uppercase">
                      <div className="absolute top-0 right-0 bg-black/20 text-white text-[6.5px] font-semibold px-2 py-0.5 rounded-bl font-mono">PREMIUM COMPILATION</div>
                      <Globe className="w-6 h-6 text-white mb-1 opacity-80" />
                      <span className="text-white font-display font-black text-xs text-center tracking-tight leading-tighter">Unified Mesh Network Promo</span>
                      <span className="text-[7px] text-purple-200 uppercase tracking-widest mt-0.5 font-mono">Establish Node Access Now</span>
                    </div>

                    {/* Specifications List */}
                    <div className="space-y-1 pt-1.5 text-[8.5px] text-neutral-400 font-sans border-t border-white/5">
                      <div className="flex justify-between">
                        <span>Daily Budget Stream:</span>
                        <strong className="text-white font-mono">₹{adAmount || '64,500'} INR</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Target View Channels:</span>
                        <strong className="text-white font-mono">Discover grids & virals</strong>
                      </div>
                      <div className="flex justify-between text-[#F52C68] font-bold">
                        <span>Est. Active handshakes:</span>
                        <strong className="font-mono">82,100 Nodes</strong>
                      </div>
                    </div>

                    {/* CTA triggers */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button className="py-2.5 border border-white/10 hover:bg-neutral-800 text-neutral-400 text-[8px] font-bold uppercase rounded-lg cursor-pointer">
                        Modify bid
                      </button>
                      <button className="py-2.5 bg-gradient-to-r from-[#F52C68] to-[#9c27b0] text-white text-[8px] font-bold uppercase rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer">
                        Post Live
                      </button>
                    </div>

                  </div>
                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600">
                  UNIFORM REACH ENTIRE DISCOVER GRIDS
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ROW SECTION 3: CREATION & DRAFTING SUITE */}
        <section className="space-y-6">
          <div className="border-l-2 border-[#00bcd4] pl-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">Section 3: Enhanced content Creation & Draft drafting</h2>
            <p className="text-xs text-neutral-500">Drafting card setups showing mode selectors, filter adjustments, and backing music clip configuration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* SCREEN 8: CREATION DRAFT FORM VIEW */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>08. Content Draft Hub</span>
                <span className="text-[#F52C68]">Creation Console</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1"><Sliders className="w-3 h-3 text-[#F52C68]" /> Create Draft</span>
                  <span>2 MB max</span>
                </div>

                <div className="space-y-2.5 my-auto text-left">
                  
                  {/* Image/Video Capture placeholder card */}
                  <div className="aspect-[16/10] bg-neutral-900 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer relative hover:border-[#F52C68] transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
                      <Plus className="w-5 h-5 text-[#F52C68] stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-white mt-2">Plus image upload / Capture placeholder</span>
                    <span className="text-[7.5px] text-neutral-500 font-mono mt-0.5">supports JPG, MP4, high-fidelity source</span>
                  </div>

                  {/* Filter adjustments */}
                  <div className="bg-neutral-950 border border-white/5 p-2 rounded-2xl space-y-2">
                    <span className="text-[8px] font-mono uppercase text-neutral-400 font-bold block">Adjust active filters</span>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[7px] text-neutral-500 font-mono">
                        <span>Saturation</span>
                        <span className="text-white">82%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F52C68] w-[82%]" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[7px] text-neutral-500 font-mono">
                        <span>AI Resolution Sharpness</span>
                        <span className="text-white">Enabled</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F52C68] w-[100%]" />
                      </div>
                    </div>
                  </div>

                  {/* Caption setup */}
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase">Write Caption</label>
                    <textarea 
                      readOnly 
                      value="Authentic viral post published securely under private keys. #BooranMesh" 
                      className="w-full bg-neutral-900 border border-white/5 rounded-xl p-2 text-[8.5px] text-neutral-300 outline-none resize-none h-11 leading-normal" 
                    />
                  </div>

                  {/* Mode Toggles */}
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1 rounded-xl">
                    <button className="py-1 bg-[#F52C68] text-white text-[8px] font-mono font-bold uppercase rounded-lg cursor-pointer">
                      📷 Photo Mode
                    </button>
                    <button className="py-1 text-neutral-500 text-[8px] font-mono font-bold uppercase rounded-lg hover:text-white">
                      🎥 Video Mode
                    </button>
                  </div>

                </div>

                {/* Post bottom CTA */}
                <button className="w-full py-2.5 bg-gradient-to-r from-[#F52C68] to-[#9c27b0] text-white font-mono font-bold text-[9px] uppercase tracking-widest rounded-xl shadow-md cursor-pointer">
                  POST NOW SECURELY
                </button>
              </div>
            </div>

            {/* SCREEN 9: MUSIC CLIP SELECTOR */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>09. Backing Music selector</span>
                <span className="text-[#F52C68]">Clip Audio Hub</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1 uppercase"><Music className="w-3 h-3 text-[#F52C68]" /> backing audio clips</span>
                  <span>License clear</span>
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  <div className="text-left space-y-1">
                    <h4 className="text-xs font-black uppercase text-white tracking-tight">Select clip of music</h4>
                    <p className="text-[8px] text-neutral-500 leading-tight">
                      Add sound names of viral tracks directly and overlay backtracks onto drafts.
                    </p>
                  </div>

                  {/* Music Rows */}
                  <div className="space-y-2">
                    {musicClips.map((music) => {
                      const isSelected = selectedMusicId === music.id;
                      return (
                        <div 
                          key={music.id}
                          onClick={() => setSelectedMusicId(music.id)}
                          className={`p-2 rounded-xl text-left border cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#F52C68]/10 border-[#F52C68]' 
                              : 'bg-neutral-900/60 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? 'bg-[#F52C68] text-white' : 'bg-black text-neutral-500'}`}>
                              <Music className="w-3 h-3" />
                            </div>
                            <div className="leading-tight">
                              <span className="text-[9px] font-bold text-white block truncate max-w-[130px]">{music.title}</span>
                              <span className="text-[7px] text-neutral-500 block truncate">{music.author}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[7.5px] font-mono text-neutral-400 font-bold">{music.duration}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#F52C68] bg-[#F52C68]' : 'border-neutral-700'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Song name search custom */}
                  <div className="space-y-1 text-left">
                    <label className="text-[7px] font-mono font-bold uppercase text-neutral-500">custom song name of viral entry</label>
                    <div className="h-8.5 bg-neutral-900 border border-white/10 rounded-xl flex items-center px-3">
                      <input 
                        type="text" 
                        readOnly 
                        value="Booran Nightbeat - 110 BPM Synthwave" 
                        className="w-full bg-transparent text-white text-[9px] font-mono outline-none" 
                      />
                    </div>
                  </div>

                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  auto sync audio stream active
                </div>
              </div>
            </div>

            {/* SCREEN 10: USER SEARCH HUB */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>10. Social Search Lists</span>
                <span className="text-cyan-500">Discovery Node</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span>Search for user</span>
                  <span className="text-cyan-400 font-bold">120 Connects Online</span>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-3.5 my-auto">
                  
                  {/* Large search input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value="Search handle or name passcode..." 
                      className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-3 pr-8 text-[9px] text-neutral-400 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[#F52C68]">✦</span>
                  </div>

                  {/* List items */}
                  <div className="space-y-2 text-left">
                    <span className="text-[7.5px] font-mono text-neutral-500 uppercase block font-bold">Suggested Network Nodes</span>
                    
                    <div className="p-2 bg-neutral-900/70 border border-white/5 rounded-xl flex items-center justify-between hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center space-x-2">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&h=60&q=80" className="w-6 h-6 rounded-md object-cover" />
                        <div className="leading-tight">
                          <span className="text-[9px] font-bold text-white block">@vicky_sen</span>
                          <span className="text-[7px] text-neutral-500 block">Vikram Sen | Cloud Arch</span>
                        </div>
                      </div>
                      <button className="px-2 py-1 bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[7.5px] uppercase rounded cursor-pointer leading-none">
                        Link node
                      </button>
                    </div>

                    <div className="p-2 bg-neutral-900/70 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=60&h=60&q=80" className="w-6 h-6 rounded-md object-cover" />
                        <div className="leading-tight">
                          <span className="text-[9px] font-bold text-white block">@diana_prince</span>
                          <span className="text-[7px] text-neutral-500 block">Diana | Cryptologist</span>
                        </div>
                      </div>
                      <button className="px-2 py-1 bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[7.5px] uppercase rounded cursor-pointer leading-none">
                        Link node
                      </button>
                    </div>

                    <div className="p-2 bg-neutral-900/70 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&h=60&q=80" className="w-6 h-6 rounded-md object-cover" />
                        <div className="leading-tight">
                          <span className="text-[9px] font-bold text-white block">@sofia_chen</span>
                          <span className="text-[7px] text-neutral-500 block">Sofia Chen | Audio Core</span>
                        </div>
                      </div>
                      <span className="text-[7.5px] font-mono text-neutral-500 uppercase font-semibold mr-1">linked</span>
                    </div>

                  </div>

                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  verified handshakes strictly secure
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ROW SECTION 4: SETTINGS & PRIVACY HUBS */}
        <section className="space-y-6">
          <div className="border-l-2 border-[#ff9800] pl-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">Section 4: Control Settings, Profile, & Privacy Hubs</h2>
            <p className="text-xs text-neutral-500">Fine-grain menus managing swipe parameters, privacy guards, blocked registries, and user avatars.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* SCREEN 11: COMPREHENSIVE SETTINGS MENU */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>11. settings menu</span>
                <span className="text-[#F52C68]">Config Hub</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1"><Settings className="w-3 h-3 text-[#F52C68]" /> UI Parameters</span>
                  <span>v2.4</span>
                </div>

                <div className="space-y-3.5 my-auto text-left">
                  <h4 className="text-xs font-display font-black text-white uppercase leading-none">System Settings</h4>
                  
                  <div className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                    
                    {/* Swipe Quality parameter */}
                    <div className="p-2.5 flex items-center justify-between text-[8.5px]">
                      <span className="text-neutral-300 font-semibold">Swipe Quality Status</span>
                      <span className="text-[#F52C68] font-mono font-bold uppercase">ULTRA HD</span>
                    </div>

                    {/* Data Saver trigger */}
                    <div className="p-2.5 flex items-center justify-between text-[8.5px]">
                      <span className="text-neutral-300 font-semibold">Data Saver Packet Compression</span>
                      <span className="text-neutral-500 font-mono font-bold">ACTIVE</span>
                    </div>

                    {/* AI Resolution switcher */}
                    <div className="p-2.5 flex items-center justify-between text-[8.5px]">
                      <span className="text-neutral-300 font-semibold">AI Resolution Upscaling</span>
                      <div className="w-7 h-4 bg-[#F52C68] rounded-full p-0.5 flex items-center justify-end">
                        <div className="w-3 h-3 rounded-full bg-white shadow" />
                      </div>
                    </div>

                    {/* Camera Video original resolution toggle */}
                    <div className="p-2.5 flex items-center justify-between text-[8.5px]">
                      <span className="text-neutral-300 font-semibold">Original AI Resolution (Camera/Video)</span>
                      <div className="w-7 h-4 bg-neutral-800 rounded-full p-0.5 flex items-center justify-start">
                        <div className="w-3 h-3 rounded-full bg-neutral-600" />
                      </div>
                    </div>

                    {/* Navigation list cells */}
                    <div className="p-2.5 flex items-center justify-between text-[8.5px] cursor-pointer hover:bg-neutral-800/40">
                      <span className="text-[#F52C68] font-semibold">Manage Blocked user list</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                    </div>

                    <div className="p-2.5 flex items-center justify-between text-[8.5px] cursor-pointer hover:bg-neutral-800/40">
                      <span className="text-neutral-300 font-semibold">Edit profile pic multi grid</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                    </div>

                  </div>
                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  Local cache: 142.1 MB
                </div>
              </div>
            </div>

            {/* SCREEN 12: SECURITY / PRIVACY PANEL */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>12. privacy hub</span>
                <span className="text-yellow-500">Security Guard</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-yellow-500" /> Privacy Hub</span>
                  <span>Strict Encrypted</span>
                </div>

                <div className="space-y-3 my-auto text-left">
                  <h4 className="text-xs font-display font-black text-white uppercase leading-none">Privacy Guard Checklist</h4>
                  
                  {/* Detailed Clean Checkboxes */}
                  <div className="space-y-2 bg-neutral-900/60 border border-white/5 p-2 rounded-2xl">
                    
                    <div className="flex items-center justify-between">
                      <div className="leading-tight">
                        <span className="text-[8.5px] font-bold text-white block">User name hide</span>
                        <span className="text-[6.5px] text-neutral-500 block font-mono">ENCRYPT HANDSHAKE CODE</span>
                      </div>
                      <div className="w-4 h-4 rounded bg-[#F52C68] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3.5]" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="leading-tight">
                        <span className="text-[8.5px] font-bold text-white block">Fingers and eye blur</span>
                        <span className="text-[6.5px] text-neutral-500 block font-mono">AUTOMATIC SENSOR MATTE</span>
                      </div>
                      <div className="w-4 h-4 rounded border border-neutral-700 bg-transparent" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="leading-tight">
                        <span className="text-[8.5px] font-bold text-white block">Screenshot & rec lock</span>
                        <span className="text-[6.5px] text-neutral-500 block font-mono">DISABLE CACHE STORAGE</span>
                      </div>
                      <div className="w-4 h-4 rounded bg-[#F52C68] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3.5]" />
                      </div>
                    </div>

                  </div>

                  {/* Add Personal Details mobile / birthdate */}
                  <div className="space-y-2 bg-neutral-900/60 border border-white/5 p-2 rounded-2xl">
                    <span className="text-[7.5px] font-mono text-neutral-500 uppercase block font-bold leading-none">Add Personal Details (Secure Vault)</span>
                    
                    <div className="space-y-1">
                      <label className="text-[7px] text-neutral-400 block font-mono uppercase">Secure Mobile No.</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={personalMobile} 
                        className="w-full bg-neutral-950 border border-white/5 rounded-lg p-1.5 text-[8.5px] text-white outline-none font-mono" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[7px] text-neutral-400 block font-mono uppercase">Birthdate (YYYY-MM-DD format)</label>
                      <input 
                        type="date" 
                        readOnly 
                        value={personalBirthdate} 
                        className="w-full bg-neutral-950 border border-white/5 rounded-lg p-1.5 text-[8.5px] text-white outline-none font-mono" 
                      />
                    </div>
                  </div>

                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  DEPICTS HIGH DYNAMIC SHIELDING
                </div>
              </div>
            </div>

            {/* SCREEN 13: EDIT PROFILE PICTURE MULTI GRID */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>13. Edit profile pic</span>
                <span className="text-[#a32cc4]">Avatar Picker</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1 cursor-pointer"><ArrowLeft className="w-2.5 h-2.5" /> Profile Settings</span>
                  <span>Face Ledger</span>
                </div>

                <div className="space-y-3 my-auto text-center">
                  <div className="relative w-12 h-12 mx-auto rounded-full border border-[#F52C68] p-0.5 overflow-hidden">
                    <img src={getHumanAvatar("booran")} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase leading-none">Avatar Multi grid picker</h4>
                    <p className="text-[7.5px] text-neutral-500 mt-1 max-w-[120px] mx-auto leading-tight">
                      Pick a verified representation or remove completely to stay hidden.
                    </p>
                  </div>

                  {/* Multi block grid representing prefilled visual cards */}
                  <div className="grid grid-cols-3 gap-1.5 py-1">
                    <div className="aspect-square bg-neutral-900 border-2 border-[#F52C68] rounded-xl overflow-hidden relative">
                      <img src={getHumanAvatar("reg")} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[4.5]" />
                      </div>
                    </div>
                    <div className="aspect-square bg-neutral-900 border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-white/20">
                      <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&h=60&q=80" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square bg-neutral-900 border border-white/5 rounded-xl overflow-hidden cursor-pointer">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&h=60&q=80" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square bg-neutral-900 border border-white/5 rounded-xl overflow-hidden cursor-pointer">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&h=60&q=80" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square bg-neutral-900 border border-white/5 rounded-xl overflow-hidden cursor-pointer">
                      <img src={getHumanAvatar("booran")} className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square bg-neutral-950 border border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#F52C68]">
                      <Plus className="w-4 h-4 text-[#F52C68]" />
                    </div>
                  </div>

                  <button className="w-full py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 font-mono font-bold text-[8.5px] uppercase rounded-xl cursor-pointer">
                    REMOVE PROFILE PIC
                  </button>
                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  mesh privacy standard v1
                </div>
              </div>
            </div>

            {/* SCREEN 14: BLOCKED USERS LIST */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>14. Blocked Users</span>
                <span className="text-red-500">Restricted Rows</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1 cursor-pointer"><ArrowLeft className="w-2.5 h-2.5" /> Blocked user</span>
                  <span>{blockedItems.length} restricted</span>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-2.5 my-auto text-left">
                  
                  {/* Permanent delete header container */}
                  <div className="flex justify-between items-center bg-neutral-950 p-2 border border-white/5 rounded-xl gap-2">
                    <span className="text-[7.5px] text-neutral-500 font-mono">
                      Selected: {selectedBlockedIds.length} user
                    </span>
                    <button className="px-2 py-1 rounded bg-red-500/25 hover:bg-red-500 text-red-500 hover:text-white transition-all font-mono font-bold text-[8px] uppercase tracking-wider flex items-center gap-1 cursor-pointer leading-none">
                      <Trash2 className="w-2.5 h-2.5" /> Permanent delete
                    </button>
                  </div>

                  <span className="text-[8px] text-neutral-500 font-mono italic block leading-tight">
                    Select users from the connection log to clear handshake keys:
                  </span>

                  {/* Block lists. font size class with text-sm representing size 14 */}
                  <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                    {blockedItems.map((item) => {
                      const isChecked = selectedBlockedIds.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          className="px-3 py-2.5 flex items-center justify-between hover:bg-neutral-800/40 transition-colors cursor-pointer"
                        >
                          <div className="leading-tight">
                            {/* Username with size 14 exact styling */}
                            <span className="text-sm font-semibold text-neutral-100 block">{item.handle}</span>
                            <span className="text-[6.5px] text-neutral-500 uppercase font-mono block mt-0.5">{item.reason}</span>
                          </div>

                          {/* Round rect container Based on size 18px x 18px */}
                          <div className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-[#F52C68] border-transparent' : 'border-white bg-transparent'
                          }`}>
                            {isChecked && <span className="text-[10px] text-white font-extrabold">&#10003;</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  UNLINKED PUBLIC METRICS CLEARED
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ROW SECTION 5: SPECIALTY ANALYTICS & HUB DASHBOARDS */}
        <section className="space-y-6">
          <div className="border-l-2 border-[#e91e63] pl-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">Section 5: Specialty Analytics & commerce Hub Dashboards</h2>
            <p className="text-xs text-neutral-500">"Stars" visual metrics with rating bar graphs and "Shopi" INR-valued e-commerce grid layouts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">

            {/* SCREEN 15: "STARS" PROFILE ANALYTICS SCOREBOARD */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>15. Stars Scoreboard metrics</span>
                <span className="text-amber-500">Pro Statistics</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4.5 overflow-hidden flex flex-col justify-between">
                
                <div className="flex justify-between items-center text-[8.5px] font-mono text-neutral-500 pb-1.5 border-b border-white/5">
                  <span className="flex items-center gap-1 leading-none text-amber-500 font-bold"><Star className="w-3.5 h-3.5 fill-current" /> Stars Profile Analytics</span>
                  <span>Premium Node</span>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-3 my-auto text-left">
                  
                  {/* Rating indicators and total counters */}
                  <div className="p-2.5 bg-neutral-900/60 border border-white/5 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[8.5px] text-neutral-500 uppercase block font-mono">Snippets Watched</span>
                      <strong className="text-lg font-black text-white tracking-tight">12,345</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[8.5px] text-neutral-500 uppercase block font-mono">Reputation Score</span>
                      <strong className="text-md font-bold text-amber-400 font-mono flex items-center gap-1 justify-end">{ratingStars} <Star className="w-3.5 h-3.5 fill-current" /></strong>
                    </div>
                  </div>

                  {/* Vertical Bar Graphs representing Ratings */}
                  <div className="bg-neutral-950 p-3 rounded-2xl border border-white/5 space-y-2.5">
                    <span className="text-[7.5px] font-mono text-neutral-500 font-bold uppercase leading-none block">Weekly Packet Analytics</span>
                    
                    <div className="grid grid-cols-7 gap-1 h-20 items-end border-b border-white/5 pb-1">
                      {[35, 60, 45, 85, 50, 75, 90].map((height, i) => (
                        <div key={i} className="flex flex-col items-center h-full justify-end relative group">
                          {/* Top Star Marker Outline on the highest peaks */}
                          {height > 70 && (
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 absolute -top-3 animate-pulse" />
                          )}
                          <div 
                            style={{ height: `${height}%` }}
                            className="w-full bg-gradient-to-t from-[#F52C68] to-purple-600 rounded-t-sm transition-all" 
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-mono text-[6.5px] text-neutral-500 font-bold uppercase">
                      <span>MON</span>
                      <span>TUE</span>
                      <span>WED</span>
                      <span>THU</span>
                      <span>FRI</span>
                      <span>SAT</span>
                      <span>SUN</span>
                    </div>
                  </div>

                  {/* Stats highlights */}
                  <div className="space-y-1.5 text-[8px] text-neutral-400">
                    <div className="flex justify-between items-center p-1.5 bg-neutral-900 rounded-lg">
                      <span>Establishing Connections Ratio</span>
                      <span className="text-white font-bold leading-none">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 bg-neutral-900 rounded-lg">
                      <span>Average Snippet Rating stars</span>
                      <span className="text-amber-400 font-bold leading-none flex items-center gap-0.5">4.8 ★</span>
                    </div>
                  </div>

                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  DATA COMPILING SECURE MESH
                </div>
              </div>
            </div>

            {/* SCREEN 16: "SHOPI" CURRENCY-VALUED E-COMMERCE HUB */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-neutral-400 px-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span>16. Shopi Commerce Grid</span>
                <span className="text-[#F52C68]">INR Rupee Rupees Marketplace</span>
              </div>
              <div className="relative aspect-[9/16] bg-black border border-white/10 rounded-[38px] shadow-2xl p-4 overflow-hidden flex flex-col justify-between">
                
                {/* Simulated Header */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-xs font-display font-black tracking-tight text-white uppercase"><ShoppingBag className="w-4 h-4 text-[#F52C68]" /> SHOPI MARKET</span>
                  
                  <div className="relative">
                    <span className="absolute -top-1 -right-1.5 text-[7px] bg-[#F52C68] text-white px-1 py-0.2 rounded-full font-mono font-bold leading-none">
                      {cartCount}
                    </span>
                    <span className="text-[10px] text-neutral-300 font-mono">CART</span>
                  </div>
                </div>

                {/* Main 2-column list of products */}
                <div className="flex-1 overflow-y-auto py-2.5 custom-scrollbar space-y-3.5 text-left">
                  
                  {/* Category filters inside store */}
                  <div className="flex items-center space-x-1 max-w-full overflow-x-auto pb-1 leading-none">
                    <span className="text-[6.5px] font-mono bg-[#F52C68] text-white px-1.5 py-0.5 rounded uppercase font-bold">Hardware</span>
                    <span className="text-[6.5px] font-mono bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded uppercase">Filters</span>
                    <span className="text-[6.5px] font-mono bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded">Vouchers</span>
                  </div>

                  {/* 2 column grid of products */}
                  <div className="grid grid-cols-2 gap-2">
                    {shopProducts.map((p) => (
                      <div key={p.id} className="bg-neutral-900 border border-white/5 rounded-xl p-1.5 flex flex-col justify-between space-y-1 relative group hover:border-[#F52C68]/40 transition-colors">
                        
                        {/* Hot sticker */}
                        {p.isHot && (
                          <span className="absolute top-1 left-1 bg-gradient-to-r from-[#F52C68] to-purple-600 text-white text-[5px] font-mono font-black uppercase px-1 rounded leading-tight">HOT ITEM</span>
                        )}

                        <div className="aspect-square bg-black rounded-lg flex items-center justify-center p-2">
                          <ShoppingBag className="w-5 h-5 text-neutral-700 group-hover:text-[#F52C68] transition-colors" />
                        </div>

                        <div className="leading-tight pt-0.5">
                          <span className="text-[8.5px] font-bold text-white block truncate leading-tight select-none">{p.title}</span>
                          <span className="text-[6.5px] text-neutral-500 block truncate uppercase tracking-wider mt-0.5 font-mono">{p.label}</span>
                        </div>

                        {/* Rupees price, INR symbol, displayed in bold yellow as per specification request */}
                        <div className="flex justify-between items-center pt-1 border-t border-white/5">
                          <span className="text-[9px] font-black text-yellow-400 font-mono">{p.price}</span>
                          <button 
                            onClick={() => setCartCount(c => c + 1)} 
                            className="bg-[#F52C68] hover:bg-neutral-100 text-white hover:text-black py-0.5 px-1.5 rounded text-[7.5px] font-mono font-bold uppercase cursor-pointer"
                          >
                            + ADD
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>

                <div className="text-center font-mono text-[7px] text-neutral-600 uppercase">
                  ₹ currency pricing INR symbols loaded
                </div>
              </div>
            </div>

            {/* PRESENTATION OVERVIEW SPECIFICATIONS */}
            <div className="flex flex-col space-y-4 bg-neutral-900/40 border border-white/5 rounded-[38px] p-6 text-left justify-center shadow-2xl">
              <div className="space-y-1.5">
                <span className="text-[#F52C68] font-mono font-bold text-[8.5px] uppercase tracking-widest block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-pulse text-[#F52C68]" /> Design System Guidelines
                </span>
                <h4 className="text-md font-display font-black text-white uppercase">Booran UI Tokens</h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                  The visual layout borrows from minimalist mechanical diagnostics, blending stark contrast colors 
                  and high depth.
                </p>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-2 bg-[#F52C68] rounded shadow-[0_0_8px_rgba(245,44,104,0.3)] shrink-0" />
                  <span className="text-[9.5px] text-white">#F52C68 Core Hot Pink Accent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-2 bg-[#9c27b0] rounded shrink-0" />
                  <span className="text-[9.5px] text-white">#9C27B0 Deep Purple Secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-2 bg-yellow-400 rounded shrink-0" />
                  <span className="text-[9.5px] text-white">#FACC15 Golden INR Symbol Focus</span>
                </div>
              </div>

              <div className="p-3 bg-black border border-white/5 rounded-2xl flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-[#F52C68]" />
                <div className="leading-tight">
                  <span className="text-[9.5px] text-white font-mono block font-bold uppercase">Device Chassis Outline</span>
                  <span className="text-[8px] text-neutral-500 block">Each preview utilizes real frame contours.</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Decorative footer logo */}
      <div className="max-w-7xl mx-auto border-t border-white/5 mt-16 pt-8 text-center text-neutral-600 text-xs font-mono space-y-1">
        <div>BOARD LAYOUT SECURED & HANDWRITTEN MAPPING COMPROMISED</div>
        <div className="text-[10px]">BOORAN SECURE NETWORKS © 2026. ALL METRICS DEPLOYED COMPLETELY GREEN.</div>
      </div>

    </div>
  );
}
