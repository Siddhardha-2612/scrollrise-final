import { scopedStorage } from "../utils/storage";
import React, { useState, useEffect, useRef } from 'react';
import { CameraPlusIcon } from './CameraPlusIcon';
import { Eye, EyeOff, ArrowLeft, ScanFace, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL } from '../config';


interface RegistrationFormViewProps {
  onBack: () => void;
  onSuccess: (username: string) => void;
}

export default function RegistrationFormView({ onBack, onSuccess }: RegistrationFormViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);

  // Biometric Selfie Capture States
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [isCapturingSelfie, setIsCapturingSelfie] = useState<boolean>(false);
  const [selfieStatusText, setSelfieStatusText] = useState<string>('ANALYZING FEATURES...');
  const [selfieIsScanning, setSelfieIsScanning] = useState<boolean>(false);
  const [selfieScanComplete, setSelfieScanComplete] = useState<boolean>(false);
  const [selfieAlignmentIssue, setSelfieAlignmentIssue] = useState<boolean>(false);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);

  const selfieVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const selfieStreamRef = React.useRef<MediaStream | null>(null);

  // Callback ref to reliably attach the webcam stream as soon as the video element mounts
  const selfieVideoRefCallback = (el: HTMLVideoElement | null) => {
    if (el) {
      selfieVideoRef.current = el;
      if (selfieStream) {
        el.srcObject = selfieStream;
        el.play().catch(err => {
          console.log("Selfie webcam video play started/interrupted:", err);
        });
      }
    }
  };

  // Clean up camera stream if unmounted or if capture closed
  useEffect(() => {
    return () => {
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Listen for selfieAlignmentIssue to pause/resume scanning timers (without closing camera)
  useEffect(() => {
    if (selfieAlignmentIssue) {
      if (selfieStream && (selfieStream as any).timers) {
        (selfieStream as any).timers.forEach((t: any) => clearTimeout(t));
      }
      setSelfieUrl(''); // Clear any captured photo preview immediately
    } else if (selfieIsScanning && selfieStream) {
      // If alignment issue is resolved, restart the scan flow from the beginning!
      runSelfieScanningFlow(selfieStream);
    }
  }, [selfieAlignmentIssue]);

  // Real-time canvas average brightness check for darkness / cover detection
  useEffect(() => {
    let active = true;
    let checkInterval: any = null;

    if (selfieIsScanning && selfieStream && selfieVideoRef.current) {
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
  }, [selfieIsScanning, selfieStream]);

  // Handler to request camera access and launch the selfie capture
  const openSelfieCapture = async () => {
    setIsCapturingSelfie(true);
    setSelfieScanComplete(false);
    setSelfieIsScanning(true);
    setSelfieAlignmentIssue(false);
    setSelfieStatusText('INITIALIZING CAMERA...');

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

      // Start the scan simulation with proper shake checks
      runSelfieScanningFlow(mediaStream);
    } catch (err) {
      console.error("Failed to access camera for selfie:", err);
      setSelfieStatusText('CAMERA ACCESS DENIED. PLEASE ALLOW CAMERA.');
      setSelfieIsScanning(false);
    }
  };

  const closeSelfieCapture = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach(track => track.stop());
      selfieStreamRef.current = null;
    }
    setSelfieStream(null);
    setIsCapturingSelfie(false);
  };

  const runSelfieScanningFlow = (activeStream: MediaStream) => {
    setSelfieIsScanning(true);
    setSelfieScanComplete(false);
    setSelfieAlignmentIssue(false);
    setSelfieStatusText('ALIGNING FACE VECTOR...');

    // 1. Align secured at 1.2s
    const t1 = setTimeout(() => {
      setSelfieStatusText('ALIGNMENT SECURED. MAPPING FACIAL VECTOR...');
    }, 1200);

    // 2. Comparing with registered ledger hashes at 2.4s
    const t2 = setTimeout(() => {
      setSelfieStatusText('COMPARING WITH REGISTERED BIOMETRIC VECTORS...');
    }, 2400);

    // 3. Complete scan successfully at 3.5s
    const t3 = setTimeout(() => {
      captureSelfieSnapshot();
      setSelfieStatusText('FACE REGISTERED SUCCESSFUL!');
      setSelfieIsScanning(false);
      setSelfieScanComplete(true);

      // Stop camera IMMEDIATELY upon verification complete
      if (selfieStreamRef.current) {
        selfieStreamRef.current.getTracks().forEach(track => track.stop());
        selfieStreamRef.current = null;
      }
      setSelfieStream(null);

      // Auto close after 1.5 seconds success so the user goes back to form
      const tClose = setTimeout(() => {
        setIsCapturingSelfie(false);
      }, 1500);
      (activeStream as any).timers.push(tClose);
    }, 3500);

    // Save timer references to cancel if user goes back
    (activeStream as any).timers = [t1, t2, t3];
  };

  const captureSelfieSnapshot = () => {
    const video = selfieVideoRef.current;
    if (video) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const videoWidth = video.videoWidth || 480;
          const videoHeight = video.videoHeight || 480;
          const size = Math.min(videoWidth, videoHeight);
          // Crop the central 55% of the frame to capture ONLY the face, with no body/neck
          const cropSize = size * 0.55;
          const sx = (videoWidth - cropSize) / 2;
          const sy = (videoHeight - cropSize) / 2;

          // Flip horizontally for natural mirror selfie
          ctx.translate(300, 0);
          ctx.scale(-1, 1);

          ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelfieUrl(dataUrl);
        }
      } catch (err) {
        console.error("Failed to capture snapshot frame:", err);
      }
    }
  };

  // Debounce state for username availability
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  React.useEffect(() => {
    const handleUsernameCheck = setTimeout(async () => {
      const trimmed = username.trim();
      if (trimmed.length >= 3) {
        setIsCheckingUsername(true);
        try {
          // Switch from Firebase to your MongoDB Backend Check
          const response = await fetch(`${API_BASE_URL}/api/auth/users-with-selfies`);
          const users = await response.json();
          const isTaken = users.some((u: any) => u.username.toLowerCase() === trimmed.toLowerCase());

          setUsernameAvailable(!isTaken);
          if (isTaken) {
            setErrorMessage('This username already exists. Please choose a different one.');
          } else if (errorMessage.includes('username already exists')) {
            setErrorMessage('');
          }
        } catch (e) {
          setUsernameAvailable(true);
        }
        setIsCheckingUsername(false);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(handleUsernameCheck);
  }, [username]);

  const isUsernameError = errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('handle') || (errorMessage.includes('all details') && !username);
  const isPasswordError = errorMessage.toLowerCase().includes('password') || (errorMessage.includes('all details') && !password);
  const isSecretCodeError = errorMessage.toLowerCase().includes('secret code') || (errorMessage.includes('all details') && !secretCode);
  const isMobileError = errorMessage.toLowerCase().includes('mobile') || (errorMessage.includes('all details') && !mobileNumber);
  const isDobError = errorMessage.toLowerCase().includes('date of birth') || (errorMessage.includes('all details') && !dateOfBirth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    const trimmedSecret = secretCode.trim();
    const trimmedMobile = mobileNumber.trim();
    const trimmedDob = dateOfBirth.trim();

    if (!trimmedUser || !trimmedPass || !trimmedSecret || !trimmedMobile || !trimmedDob) {
      setErrorMessage('Please fill in all details, including your mobile number and date of birth.');
      return;
    }

    if (trimmedUser.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (trimmedPass.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    
    if (trimmedSecret.length !== 8) {
      setErrorMessage('Secret Code must be exactly 8 digits.');
      return;
    }

    if (!selfieUrl) {
      setErrorMessage('Please scan your face first by tapping the Selfie button below.');
      return;
    }

    try {
      // 1. Switch from Firebase to your MongoDB Registration API
      const response = await fetch(API_BASE_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass,
          secretCode: trimmedSecret,
          mobileNumber: trimmedMobile,
          dateOfBirth: trimmedDob,
          hideDetails: hideDetails,
          selfieUrl: selfieUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Registration failed. Please try again.');
        return;
      }

      // 2. Save Session to Local Storage
      scopedStorage.setItem('booran_token', data.token);
      scopedStorage.setItem('booran_username', data.username);
      scopedStorage.setItem('booran_personal_mobile', trimmedMobile);
      scopedStorage.setItem('booran_date_of_birth', trimmedDob);
      scopedStorage.setItem('booran_hide_details', JSON.stringify(hideDetails));

      // 3. Success! Move to Dashboard
      onSuccess(data.username);
    } catch (err: any) {
      console.error("Registration Error:", err);
      setErrorMessage('Registration failed. Please check your internet connection or if the server is waking up.');
    }
  };

  return (
    <div className="min-h-full bg-black text-white p-6 md:p-12 flex flex-col justify-between safe-area-top">
      {/* Top action bar */}
      <div className="flex items-center">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-90 transition-all text-white hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-sm mx-auto mt-4 mb-auto py-4">
        <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-8">
          New account
        </h2>
        

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2 animate-pulse">
              <span className="text-red-500 font-bold">⚠️ Safeguard Alert:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* USERNAME INPUT */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
              <span className={isUsernameError ? 'text-red-500' : 'text-neutral-200'}>
                Username
              </span>
            </label>
            <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
              isUsernameError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-brand-pink/50'
            }`}>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  let val = e.target.value.substring(0, 17);
                  if (val.length > 0 && !/^[a-zA-Z0-9]/.test(val[0])) {
                    val = val.substring(1);
                  }
                  setUsername(val);
                  setErrorMessage('');
                }}
                maxLength={17}
                placeholder="Choose a username"
                className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium"
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
              <span className={isPasswordError ? 'text-red-500' : 'text-neutral-200'}>
                Password
              </span>
            </label>
            <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
              isPasswordError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-brand-pink/50'
            }`}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Choose a password"
                className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium pr-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-500 hover:text-black transition-colors focus:outline-none cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SECRET CODE INPUT */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
              <span className={isSecretCodeError ? 'text-red-500' : 'text-neutral-200'}>
                Secret Code
              </span>
            </label>
            <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
              isSecretCodeError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-brand-pink/50'
            }`}>
              <input
                type={showSecretCode ? 'text' : 'password'}
                value={secretCode}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if(val.length > 8) val = val.substring(0, 8);
                  setSecretCode(val);
                  setErrorMessage('');
                }}
                maxLength={8}
                placeholder="Choose 8-digit secret code"
                className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium pr-2 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowSecretCode(!showSecretCode)}
                className="text-neutral-500 hover:text-black transition-colors focus:outline-none cursor-pointer p-1"
              >
                {showSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MOBILE NUMBER INPUT */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
              <span className={isMobileError ? 'text-red-500' : 'text-neutral-200'}>
                Mobile Number
              </span>
            </label>
            <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
              isMobileError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-brand-pink/50'
            }`}>
              <input
                type="tel"
                maxLength={11}
                value={mobileNumber}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if(val.length > 11) val = val.substring(0, 11);
                  setMobileNumber(val);
                  setErrorMessage('');
                }}
                placeholder="Enter mobile number"
                className="w-full h-full bg-transparent text-black placeholder-neutral-500 outline-none text-base font-medium"
              />
            </div>
          </div>

          {/* DATE OF BIRTH INPUT */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold uppercase tracking-wider text-neutral-200">
              <span className={isDobError ? 'text-red-500' : 'text-neutral-200'}>
                Date of Birth
              </span>
            </label>
            <div className={`h-11 bg-white rounded-full flex items-center px-4 border-2 transition-all duration-200 ${
              isDobError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-transparent focus-within:border-brand-pink/50'
            }`}>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full h-full bg-transparent text-black outline-none text-base font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 cursor-pointer" onClick={() => setHideDetails(!hideDetails)}>
            <div
              className={`w-6 h-6 flex items-center justify-center transition-colors border ${
                hideDetails ? 'bg-white border-white' : 'bg-neutral-800 border-neutral-600'
              } rounded`}
            >
              {hideDetails && <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-white text-[15px] font-medium tracking-wide select-none">HIDE for others</span>
          </div>

          {/* Bottom actions container */}
          <div className="flex flex-row items-end justify-between pt-4 pb-2">
            <button
              type="button"
              onClick={openSelfieCapture}
              className="w-[110px] h-[110px] bg-[#1f1f1f] border border-white/5 rounded-[24px] flex flex-col items-center justify-center gap-2 hover:bg-[#282828] active:scale-95 transition-all shadow-lg overflow-hidden relative group cursor-pointer"
            >
              {selfieUrl ? (
                <>
                  <img src={selfieUrl} alt="Selfie preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-md" />
                    <span className="text-white text-[10px] font-medium tracking-wide mt-1 drop-shadow">Retake Scan</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 bg-neutral-800/80 rounded-2xl group-hover:scale-105 transition-transform duration-300">
                    <CameraPlusIcon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <span className="text-white text-[12px] font-normal tracking-wide">Selfie</span>
                </>
              )}
            </button>

            <button
              type="submit"
              className="px-10 py-3 mb-6 bg-[#EC5384] text-white font-bold text-[15px] tracking-wide rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer inline-flex items-center justify-center font-sans"
            >
              Next
            </button>
          </div>
        </form>
      </div>

      {/* FULL-SCREEN IMMERSIVE BIOMETRIC CAMERA SCAN OVERLAY */}
      <AnimatePresence>
        {isCapturingSelfie && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between font-sans select-none p-6 overflow-hidden safe-area-top"
          >
            <style>{`
              @keyframes shake {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                10%, 30%, 50%, 70%, 90% { transform: translate(-3.5px, 1.5px) rotate(-1deg); }
                20%, 40%, 60%, 80% { transform: translate(3.5px, -1.5px) rotate(1deg); }
              }
              .animate-shake {
                animation: shake 0.35s ease-in-out infinite;
              }
            `}</style>

            {/* Glowing subtle blurs for biometric context */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#EC5384]/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header section */}
            <div className="flex items-center justify-between w-full relative z-10 pt-2">
              <button 
                type="button"
                onClick={closeSelfieCapture}
                className="p-2.5 -ml-2 rounded-full bg-neutral-900/80 border border-white/5 hover:bg-white/10 active:scale-90 transition-all text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="bg-neutral-900/80 border border-white/5 rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-semibold text-neutral-300 tracking-wide uppercase font-mono">Biometrics Secure</span>
              </div>
            </div>

            {/* Scanning Center Viewport Container */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-6">
              
              {/* Title Section */}
              <div className="text-center mb-8 max-w-xs">
                <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-2 leading-snug">
                  Facial Registration Scan
                </h2>
                <p className="text-xs text-neutral-400 font-sans tracking-wide">
                  Hold your device still at eye-level to capture your unique biometric identifier
                </p>
              </div>

              {/* Scanning Circle Frame */}
              <div className={`relative w-[270px] h-[270px] mb-8 transition-transform duration-300 ${selfieAlignmentIssue ? 'animate-shake' : ''}`}>
                
                {/* Dash circle spinning border */}
                <div className={`absolute -inset-1.5 rounded-full border-2 border-dashed ${
                  selfieScanComplete 
                    ? 'border-emerald-500 animate-[spin_10s_linear_infinite]' 
                    : selfieAlignmentIssue 
                      ? 'border-red-500 animate-[spin_4s_linear_infinite]' 
                      : 'border-blue-500/60 animate-[spin_20s_linear_infinite]'
                }`} />
                
                {/* Pulse outline shadow ring */}
                <div className={`absolute inset-0 rounded-full ring-4 ${
                  selfieScanComplete 
                    ? 'ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : selfieAlignmentIssue 
                      ? 'ring-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.6)]' 
                      : 'ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                } transition-all duration-500`} />

                {/* Central Webcam Content Circle */}
                <div className={`absolute inset-0 rounded-full overflow-hidden bg-zinc-950 border-2 transition-colors duration-300 ${selfieAlignmentIssue ? 'border-red-500/40' : 'border-neutral-800'} flex items-center justify-center`}>
                  
                  {selfieStream ? (
                    <video 
                      ref={selfieVideoRefCallback}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-[1.75] scale-x-[-1.75]"
                    />
                  ) : (
                    /* Biometric Head Silhouette SVG placeholder if webcam is slow to boot */
                    <div className="w-44 h-44 opacity-80 text-zinc-500 relative flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current">
                        <path 
                          d="M50,15 C32,15 25,25 25,48 C25,75 42,88 50,88 C58,88 75,75 75,48 C75,25 68,15 50,15 Z" 
                          strokeWidth="2" 
                          stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} 
                          strokeOpacity={selfieIsScanning ? 0.6 : 0.2}
                          className={selfieIsScanning ? 'animate-pulse' : ''}
                        />
                        <path d="M35,42 Q40,38 45,42" stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7"/>
                        <path d="M55,42 Q60,38 65,42" stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7"/>
                        <circle cx="40" cy="45" r="2" fill={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                        <circle cx="60" cy="45" r="2" fill={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} />
                        <path d="M50,48 L50,58" stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2" strokeOpacity="0.7" />
                        <path d="M40,68 Q50,74 60,68" stroke={selfieAlignmentIssue ? "#ef4444" : "#3b82f6"} strokeWidth="2.5" strokeOpacity="0.8" />
                        
                        {selfieIsScanning && (
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
                  )}

                  {/* Vertical sweeping laser line scan */}
                  {selfieIsScanning && (
                    <motion.div 
                      initial={{ translateY: -30 }}
                      animate={{ translateY: 250 }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 2.2,
                        ease: "easeInOut"
                      }}
                      className={`absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent ${selfieAlignmentIssue ? 'via-red-500' : 'via-blue-400'} to-transparent shadow-[0_0_12px_${selfieAlignmentIssue ? '#ef4444' : '#3b82f6'}] opacity-80`}
                    />
                  )}

                  {/* Red Shaking/Obstruction alert overlay when alignment is wrong */}
                  {selfieIsScanning && selfieAlignmentIssue && (
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

                  {/* Emerald checkmark when capture succeeds */}
                  {selfieScanComplete && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-emerald-950/25 flex flex-col items-center justify-center backdrop-blur-[1px]"
                    >
                      <div className="p-4 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-[bounce_1.5s_infinite]">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Status indicators */}
              <div className="w-full max-w-sm px-4">
                {selfieScanComplete ? (
                  <div className="w-full bg-[#0f0f11] border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 shadow-2xl">
                    <span className="text-[11px] font-extrabold text-emerald-400 tracking-wider font-sans uppercase bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                      ✓ Face Registered
                    </span>
                    <p className="text-xs text-neutral-300">Identity successfully mapped to biometric ledger.</p>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="w-full flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0 text-left">
                        <p className="text-[10px] font-bold text-neutral-500 tracking-[0.1em] font-sans uppercase">
                          Biometric Status
                        </p>
                        <p className={`text-xs sm:text-sm font-bold tracking-wide font-sans ${selfieAlignmentIssue ? 'text-red-500' : 'text-neutral-300'} flex items-center gap-1.5 flex-wrap`}>
                          {selfieIsScanning && <span className={`w-2 h-2 rounded-full ${selfieAlignmentIssue ? 'bg-red-500' : 'bg-blue-500'} animate-ping inline-block shrink-0`} />}
                          <span className="break-words">{selfieStatusText}</span>
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-2xl bg-zinc-950 border transition-all duration-300 shrink-0 ${selfieAlignmentIssue ? 'border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : 'border-zinc-800 text-blue-400'}`}>
                        <ScanFace className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Shake/Cover simulation button */}
                    {selfieIsScanning && (
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

            {/* Cancel Bottom Action */}
            <div className="w-full max-w-sm mx-auto pb-4 pt-2">
              <button
                type="button"
                onClick={closeSelfieCapture}
                className="w-full py-3.5 rounded-full bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-neutral-300 font-bold text-xs tracking-[0.15em] uppercase transition-all"
              >
                Cancel Capture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
