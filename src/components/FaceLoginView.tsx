import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ScanFace, 
  Sparkles, 
  Lock, 
  KeyRound, 
  Camera, 
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scopedStorage } from '../utils/storage';
import { API_BASE_URL } from '../config';

interface FaceLoginViewProps {
  onBack: () => void;
  onSuccess: (username: string) => void;
  onGoToManualLogin?: () => void;
}

type FaceLoginStep = 'live-scan';

export default function FaceLoginView({ onBack, onSuccess, onGoToManualLogin }: FaceLoginViewProps) {
  const [step, setStep] = useState<FaceLoginStep>('live-scan');
  
  // Secret code verification states
  const [isVerifyingSecretCode, setIsVerifyingSecretCode] = useState(false);
  const [enteredSecretCode, setEnteredSecretCode] = useState('');
  const [secretCodeError, setSecretCodeError] = useState('');
  const [isVerifyingCodeInProgress, setIsVerifyingCodeInProgress] = useState(false);
  const [showOSPrompt, setShowOSPrompt] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Scan states
  const [statusText, setStatusText] = useState('ANALYZING FEATURES...');
  const [isScanning, setIsScanning] = useState(true);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [hasWebcam, setHasWebcam] = useState(true);
  const [alignmentIssue, setAlignmentIssue] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<any[]>([]);

  // Auto start scanner on mount
  useEffect(() => {
    const autoInit = async () => {
      await requestCameraAccess();
      startScanningProcess();
    };
    autoInit();
  }, []);

  // Callback ref to reliably attach the webcam stream as soon as the video element mounts
  const videoRefCallback = (el: HTMLVideoElement | null) => {
    if (el) {
      videoRef.current = el;
      if (stream) {
        el.srcObject = stream;
        el.play().catch(err => {
          console.log("Webcam video play started/interrupted:", err);
        });
      }
    }
  };

  // Read previous logged in user or list of users to find a suitable candidate for login
  const [targetUser, setTargetUser] = useState<string>('');

  useEffect(() => {
    // Try to get previously logged in user
    const lastUser = scopedStorage.getItem('booran_username');
    if (lastUser) {
      setTargetUser(lastUser);
    } else {
      // Find any user in registration database
      try {
        const usersStr = scopedStorage.getItem('booran_users');
        if (usersStr) {
          const users = JSON.parse(usersStr);
          if (users && users.length > 0) {
            setTargetUser(users[0].username);
          } else {
            setTargetUser('ScrollriseUser');
          }
        } else {
          setTargetUser('ScrollriseUser');
        }
      } catch {
        setTargetUser('ScrollriseUser');
      }
    }
  }, []);

  // Handle cleanup of camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Real-time canvas average brightness check for darkness / cover detection
  useEffect(() => {
    let active = true;
    let checkInterval: any = null;

    if (isScanning && stream && videoRef.current) {
      const video = videoRef.current;
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
              setStatusText('⚠️ SHAKY OR FACE COVERING/HAND DETECTED');
              setAlignmentIssue(true);
            } else {
              setAlignmentIssue(prev => {
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
  }, [isScanning, stream]);

  // Listen for alignmentIssue to pause/resume scanning timers (without closing camera/redirecting)
  useEffect(() => {
    if (alignmentIssue) {
      // Clear scanning timers to prevent automatic successful login
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    } else if (isScanning && stream) {
      // If alignment issue is resolved, restart the scan process!
      startScanningProcess();
    }
  }, [alignmentIssue]);

  // Automatically redirect to manual login ONLY if permissionState is denied
  useEffect(() => {
    if (permissionState === 'denied') {
      // Clean up camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      
      // Redirect to manual login screen immediately
      if (onGoToManualLogin) {
        onGoToManualLogin();
      }
    }
  }, [permissionState, onGoToManualLogin, stream]);

  // Turn off camera light immediately when verification succeeds
  useEffect(() => {
    if (scanComplete) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [scanComplete, stream]);

  // Request actual camera access
  const requestCameraAccess = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 480 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setPermissionState('granted');
      setHasWebcam(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera hardware access failed or denied: ", err);
      setPermissionState('denied');
      setHasWebcam(false); // Enable fallback animated silhouette scanner
    }
  };

  // Step 1: Enable camera button clicked -> Show OS system permission pop-up
  const handleEnableCameraClick = () => {
    setShowOSPrompt(true);
  };

  // Step 2: System Permission choices
  const handleOSPermissionSelect = async (allowed: boolean) => {
    setShowOSPrompt(false);
    if (allowed) {
      // Request camera and transition to Step 3
      setStep('live-scan');
      // Request the real camera stream
      await requestCameraAccess();
      startScanningProcess();
    } else {
      // Access denied
      setPermissionState('denied');
    }
  };

  // Step 3: Face Scanning Simulation Process with both Pass/Fail biometrics
  const startScanningProcess = (forceFailure: boolean = simulateFailure) => {
    // Clear any previous running scan timers
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    setIsScanning(true);
    setScanComplete(false);
    setScanFailed(false);
    setAlignmentIssue(false);
    setStatusText('ANALYZING FEATURES...');

    // 1. Shaking / improper position alert at 1.5 seconds (only if simulating failure)
    const t1 = setTimeout(() => {
      if (forceFailure) {
        setStatusText('⚠️ SHAKY OR FACE COVERING/HAND DETECTED');
        setAlignmentIssue(true);
      }
    }, 1500);

    // 2. Alignment secured, mapping vector at 1.2 seconds
    const t2 = setTimeout(() => {
      if (!forceFailure) {
        setStatusText('ALIGNMENT SECURED. MAPPING FACIAL VECTOR...');
        setAlignmentIssue(false);
      }
    }, 1200);

    // 3. Comparing with ledger database hashes at 2.4 seconds
    const t3 = setTimeout(() => {
      if (!forceFailure) {
        setStatusText('COMPARING WITH REGISTERED BIOMETRIC VECTORS...');
      }
    }, 2400);

    // 4. Verification outcome (Pass / Fail based on simulated switch)
    const t4 = setTimeout(async () => {
      if (forceFailure) {
        setStatusText('FACE NOT MATCHED - ACCESS DENIED');
        setIsScanning(false);
        setScanFailed(true);
        setScanComplete(false);
      } else {
        setStatusText('FACE VERIFICATION SUCCESSFUL!');
        setIsScanning(false);
        setScanComplete(true);
        setScanFailed(false);

        // Fetch registered user accounts from MongoDB Backend
        try {
          const response = await fetch(API_BASE_URL + '/api/auth/users-with-selfies');
          const users = await response.json();

          if (users && users.length > 0) {
            setMatchedUsers(users);
            // Default to the last known user if they are in the list, otherwise the first one
            const foundLast = users.find((u: any) => u.username === targetUser);
            setSelectedUser(foundLast || users[0]);
          } else {
            // Fallback default if DB is empty
            const mockUser = {
              username: targetUser || 'User',
              selfieUrl: '',
              mobileNumber: '0000000000'
            };
            setMatchedUsers([mockUser]);
            setSelectedUser(mockUser);
          }
        } catch (err) {
          console.error("Failed to query backend users:", err);
          const mockUser = {
            username: targetUser || 'User',
            selfieUrl: '',
            mobileNumber: '0000000000'
          };
          setMatchedUsers([mockUser]);
          setSelectedUser(mockUser);
        }
      }
    }, 3500);

    timersRef.current = [t1, t2, t3, t4];
  };

  // Handle verify Secret Code
  const handleVerifySecretCode = async () => {
    if (enteredSecretCode.length !== 8) {
      setSecretCodeError('Secret code must be exactly 8 digits.');
      return;
    }

    const usernameToVerify = selectedUser?.username || targetUser || 'User';

    setSecretCodeError('');
    setIsVerifyingCodeInProgress(true);

    try {
      // 1. Verify Secret Code via MongoDB Backend API
      const response = await fetch(API_BASE_URL + '/api/auth/verify-secret-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameToVerify, secretCode: enteredSecretCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setSecretCodeError(data.error || 'Incorrect Secret Code.');
        setIsVerifyingCodeInProgress(false);
        return;
      }

      // 2. Success! Setup session and log in
      scopedStorage.setItem('booran_token', data.token);
      scopedStorage.setItem('booran_username', data.user.username);
      scopedStorage.setItem('booran_personal_mobile', data.user.mobileNumber || '');
      scopedStorage.setItem('booran_hide_details', JSON.stringify(!!data.user.hideDetails));

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      setIsVerifyingCodeInProgress(false);
      onSuccess(data.user.username);

    } catch (err: any) {
      console.error('Failed to verify secret code:', err);
      setSecretCodeError('System error: ' + err.message);
      setIsVerifyingCodeInProgress(false);
    }
  };

  // Handle final Login click
  const handleLoginClick = () => {
    setIsVerifyingSecretCode(true);
  };

  return (
    <div id="face-login-root" className="min-h-screen bg-black text-white flex flex-col justify-between font-sans relative overflow-hidden select-none">
      <style>{`
        #main-scroll-container > #face-login-root {
          background-color: black !important;
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-3.5px, 1.5px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translate(3.5px, -1.5px) rotate(1deg); }
        }
        .animate-shake {
          animation: shake 0.35s ease-in-out infinite;
        }
      `}</style>
      


      {/* 2. THE OS SYSTEM PERMISSION OVERLAY */}
      <AnimatePresence>
        {showOSPrompt && (
          <>
            {/* Ambient Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-40"
            />
            
            {/* Standard Mobile/OS Permissions dialog overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-6 z-50">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-[290px] bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-center"
              >
                {/* App circular mini logo/icon */}
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                
                {/* Permission Title */}
                <h3 className="text-sm font-semibold text-white leading-snug mb-2">
                  Allow ScrollRise to take pictures and record video?
                </h3>
                <p className="text-[11px] text-zinc-400 leading-normal mb-5">
                  This lets the security engine scan and authorize passwordless biometric access.
                </p>

                {/* Stacked choices matching native mobile permissions */}
                <div className="space-y-1.5 font-sans">
                  <button
                    onClick={() => handleOSPermissionSelect(true)}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    While using the app
                  </button>
                  <button
                    onClick={() => handleOSPermissionSelect(true)}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Only this time
                  </button>
                  <button
                    onClick={() => handleOSPermissionSelect(false)}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-zinc-400 font-medium text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Don't allow
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 3. THE LIVE SCAN SCREEN */}
      {step === 'live-scan' && (
        <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-6 relative z-10 bg-black overflow-y-auto">
          
          {/* Header: Back arrow and Title matching image_3aed97.jpg */}
          <div className="flex items-center justify-between w-full pt-2">
            <button 
              onClick={() => {
                // Stop camera stream on back
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                }
                onBack();
              }}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
            >
              <ArrowLeft className="w-7 h-7 stroke-[2]" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto my-auto py-2">
            
            {/* Title from the image */}
            <h2 className="text-xl sm:text-[28px] font-bold tracking-tight text-white mb-4 sm:mb-8 text-center font-sans">
              Facial Recognition Scan
            </h2>

            {/* The Scanning Circle viewport */}
            <div className={`relative w-[210px] h-[210px] sm:w-[280px] sm:h-[280px] mb-4 sm:mb-8 mx-auto transition-transform duration-300 ${alignmentIssue ? 'animate-shake' : ''}`}>
              
              {/* Spinning/pulsing neon circular outer ring */}
              <div className={`absolute -inset-1.5 rounded-full border-2 border-dashed ${
                scanComplete 
                  ? 'border-emerald-500 animate-[spin_10s_linear_infinite]' 
                  : scanFailed
                    ? 'border-red-500/40'
                    : alignmentIssue 
                      ? 'border-red-500 animate-[spin_4s_linear_infinite]' 
                      : 'border-blue-500/60 animate-[spin_20s_linear_infinite]'
              }`} />
              
              {/* Outer pulsing shadow ring */}
              <div className={`absolute inset-0 rounded-full ring-4 ${
                scanComplete 
                  ? 'ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : scanFailed
                    ? 'ring-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.3)] border-red-500/30'
                    : alignmentIssue 
                      ? 'ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.6)]' 
                      : 'ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
              } transition-all duration-500`} />

              {/* Central Circle Screen */}
              <div className={`absolute inset-0 rounded-full overflow-hidden bg-zinc-950 border-2 transition-colors duration-300 ${scanFailed || alignmentIssue ? 'border-red-500/40' : 'border-neutral-800'} flex items-center justify-center`}>
                
                {hasWebcam && stream ? (
                  /* Live video feed */
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-[1.75] scale-x-[-1.75]"
                  />
                ) : (
                  /* Fallback Mock scanning avatar if webcam is not permitted/available */
                  <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-zinc-900 to-zinc-950">
                    {/* Reassuring face avatar silhouette with glowing laser dots */}
                    <div className="w-48 h-48 opacity-80 text-zinc-500 relative flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current">
                        {/* Elegant face biometric silhouette node mesh mapping */}
                        <path 
                          d="M50,15 C32,15 25,25 25,48 C25,75 42,88 50,88 C58,88 75,75 75,48 C75,25 68,15 50,15 Z" 
                          strokeWidth="2" 
                          stroke={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} 
                          strokeOpacity={isScanning ? 0.6 : 0.2}
                          className={isScanning ? 'animate-pulse' : ''}
                        />
                        <path d="M35,42 Q40,38 45,42" stroke={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7"/>
                        <path d="M55,42 Q60,38 65,42" stroke={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7"/>
                        <circle cx="40" cy="45" r="2" fill={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} />
                        <circle cx="60" cy="45" r="2" fill={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} />
                        <path d="M50,48 L50,58" stroke={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7" />
                        <path d="M40,68 Q50,74 60,68" stroke={scanFailed || alignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2.5" strokeOpacity="0.8" />
                        
                        {/* Tech matrix coordinates */}
                        {isScanning && (
                          <>
                            <line x1="20" y1="50" x2="80" y2="50" stroke={alignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                            <line x1="50" y1="10" x2="50" y2="90" stroke={alignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                            <circle cx="28" cy="48" r="1.5" fill={alignmentIssue ? "#ef4444" : "#3b82f6"} />
                            <circle cx="72" cy="48" r="1.5" fill={alignmentIssue ? "#ef4444" : "#3b82f6"} />
                            <circle cx="50" cy="20" r="1.5" fill={alignmentIssue ? "#ef4444" : "#3b82f6"} />
                            <circle cx="50" cy="80" r="1.5" fill={alignmentIssue ? "#ef4444" : "#3b82f6"} />
                          </>
                        )}
                      </svg>
                    </div>
                  </div>
                )}

                {/* Laser scan line sweeps vertically */}
                {isScanning && (
                  <motion.div 
                    initial={{ translateY: -30 }}
                    animate={{ translateY: 260 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 2.2,
                      ease: "easeInOut"
                    }}
                    className={`absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent ${scanFailed || alignmentIssue ? 'via-red-500' : 'via-blue-400'} to-transparent shadow-[0_0_12px_${scanFailed || alignmentIssue ? '#ef4444' : '#3b82f6'}] opacity-80`}
                  />
                )}

                {/* Red shaking/obstruction alert overlay when alignment is bad */}
                {isScanning && alignmentIssue && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-red-950/40 flex flex-col items-center justify-center backdrop-blur-[1.5px] select-none p-4"
                  >
                    <div className="bg-red-600/95 border border-red-500 px-4 py-2.5 rounded-2xl text-white text-[11px] font-bold tracking-wide flex flex-col items-center gap-1 shadow-2xl animate-bounce max-w-[220px] text-center">
                      <span className="flex items-center gap-1 text-yellow-300 font-extrabold text-[12px]">⚠️ SCAN WARNING</span>
                      <span className="text-white">SHAKY, FACE COVERING OR HAND ON FACE</span>
                      <span className="text-[9px] font-medium text-white/70 mt-0.5 uppercase tracking-wider">Please clear face & hold still</span>
                    </div>
                  </motion.div>
                )}

                {/* Face match lock overlay when scanning is successful */}
                {scanComplete && (
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

                {/* Face match failure overlay */}
                {scanFailed && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-red-950/25 flex flex-col items-center justify-center backdrop-blur-[1px]"
                  >
                    <div className="p-4 rounded-full bg-red-500/25 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-[bounce_1.5s_infinite]">
                      <AlertCircle className="w-12 h-12" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Instruction Below the Circle matching image_3aed97.jpg */}
            <p className="text-[10px] sm:text-xs font-medium tracking-[0.15em] text-neutral-300 font-sans uppercase mb-4 sm:mb-10 select-none text-center">
              KEEP YOUR FACE WITHIN THE CIRCLE
            </p>

            {/* Dynamic Status indicators or matched accounts or mismatch warnings */}
            <div className="w-full max-w-sm px-2">
              {scanComplete ? (
                <div className="w-full space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-neutral-500 tracking-[0.1em] font-sans uppercase">
                      Accounts Matched
                    </p>
                    <span className="text-[10px] font-extrabold text-emerald-400 tracking-wider font-sans uppercase bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                      ✓ Face Verified
                    </span>
                  </div>

                  {/* Horizon scrolling list of matched accounts */}
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {matchedUsers.map((user) => {
                      const isSelected = selectedUser?.username === user.username;
                      return (
                        <div
                          key={user.username}
                          onClick={() => setSelectedUser(user)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl bg-[#0f0f11] border transition-all duration-300 cursor-pointer ${
                            isSelected 
                              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/10' 
                              : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center">
                              {user.selfieUrl ? (
                                <img src={user.selfieUrl} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                  <ScanFace className="w-5 h-5 text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-bold text-white font-sans">{user.username}</h4>
                              <p className="text-[10px] text-zinc-400 font-mono tracking-wider">MATCHED SYSTEM PROFILE</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-700'
                          }`}>
                            {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : scanFailed ? (
                /* RED WARNING BOX FOR FACE NOT MATCHED */
                <div className="w-full bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-500 shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 text-left">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">
                        FACE NOT MATCHED!
                      </h4>
                      <p className="text-xs text-red-400 leading-relaxed font-medium">
                        Verification failed. The scanned facial identity does not match any registered credentials. Please scan with the same face used to create the account.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startScanningProcess(simulateFailure)}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Retry Face Scan
                  </button>
                </div>
              ) : (
                /* SCANNING IN PROGRESS */
                <div className="w-full flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-bold text-neutral-500 tracking-[0.1em] font-sans uppercase">
                      Biometric Status
                    </p>
                    <p className={`text-xs sm:text-sm font-bold tracking-wide font-sans ${alignmentIssue ? 'text-red-500' : 'text-neutral-400'} flex items-center gap-1.5 flex-wrap`}>
                      {isScanning && <span className={`w-2 h-2 rounded-full ${alignmentIssue ? 'bg-red-500' : 'bg-blue-500'} animate-ping inline-block shrink-0`} />}
                      <span className="break-words">{statusText}</span>
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-2xl bg-zinc-950 border transition-all duration-300 shrink-0 ${alignmentIssue ? 'border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : 'border-zinc-800 text-blue-400'}`}>
                    <ScanFace className="w-7 h-7" />
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Controls for Hand/Hair Cover and Shaking */}
            {isScanning && !scanComplete && !scanFailed && (
              <div className="w-full max-w-sm mt-2 px-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setStatusText('⚠️ SHAKY OR FACE COVERING/HAND DETECTED');
                    setAlignmentIssue(true);
                  }}
                  className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-400 rounded-xl font-bold text-[10.5px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>⚠️ Cover Face / Shake / Put Hands on Head</span>
                </button>
              </div>
            )}

            {/* Core Action Button: LOG IN WITH FACE ID (Moved inside centerpiece container to reduce blank black space) */}
            <div className="w-full max-w-sm mt-6">
              <button
                onClick={handleLoginClick}
                disabled={(isScanning && !scanComplete) || scanFailed}
                className={`w-full py-3 px-5 rounded-full font-bold text-xs sm:text-sm tracking-[0.08em] transition-all duration-300 transform active:scale-98 shadow-md flex items-center justify-center font-sans h-12 relative ${
                  scanComplete 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' 
                    : scanFailed 
                      ? 'bg-zinc-900 border border-red-500/20 text-red-400 cursor-not-allowed opacity-60'
                      : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                }`}
              >
                <span className="uppercase tracking-wider font-semibold">
                  {scanComplete ? `CONTINUE AS ${selectedUser?.username || 'USER'}` : scanFailed ? 'ACCESS DENIED' : 'LOG IN WITH FACE ID'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Code Verification Overlay */}
      <AnimatePresence>
        {isVerifyingSecretCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between w-full pt-2">
              <button 
                onClick={() => {
                  setIsVerifyingSecretCode(false);
                  setEnteredSecretCode('');
                  setSecretCodeError('');
                }}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
              >
                <ArrowLeft className="w-7 h-7 stroke-[2]" />
              </button>
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase font-bold">
                Verification Required
              </span>
              <div className="w-10 h-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2 text-center">
                Enter your 8-digit Secret Code
              </h3>
              <p className="text-xs text-neutral-400 text-center mb-8 px-4 leading-relaxed">
                To log in to <span className="font-bold text-white">{selectedUser?.username || 'your account'}</span>, please enter the Secret Code set up during registration.
              </p>

              <div className="relative w-full max-w-xs mb-6">
                <input
                  type="password"
                  maxLength={8}
                  value={enteredSecretCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEnteredSecretCode(val);
                    setSecretCodeError('');
                  }}
                  placeholder="••••••••"
                  className="w-full tracking-[0.6em] text-center text-2xl font-bold bg-[#0f0f11] border border-zinc-800 focus:border-emerald-500 rounded-2xl py-4 text-white outline-none transition-colors placeholder:text-neutral-700 placeholder:tracking-normal"
                />
              </div>

              {secretCodeError && (
                <p className="text-xs font-semibold text-red-500 text-center animate-shake px-4 mb-4">
                  ⚠️ {secretCodeError}
                </p>
              )}

              {isVerifyingCodeInProgress && (
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-4 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  VERIFYING SECRET CODE...
                </div>
              )}
            </div>

            <div className="w-full max-w-sm mx-auto space-y-3 pb-4">
              <button
                onClick={handleVerifySecretCode}
                disabled={enteredSecretCode.length !== 8 || isVerifyingCodeInProgress}
                className={`w-full py-4 px-6 rounded-full font-bold text-sm tracking-[0.08em] transition-all duration-300 transform active:scale-98 shadow-md flex items-center justify-center font-sans h-14 ${
                  enteredSecretCode.length === 8 && !isVerifyingCodeInProgress
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-zinc-900 border border-zinc-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isVerifyingCodeInProgress ? 'VERIFYING...' : 'CONFIRM ACCESS'}
              </button>

              <button
                onClick={() => {
                  if (onGoToManualLogin) {
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop());
                    }
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                    onGoToManualLogin();
                  }
                }}
                className="w-full py-3 text-xs font-semibold text-neutral-400 hover:text-white transition-all text-center uppercase tracking-wider"
              >
                Use Manual Username/Password Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
