import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import AppLogo from './AppLogo';

interface SplashViewProps {
  onComplete: () => void;
}

export default function SplashView({ onComplete }: SplashViewProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress percentage smoothly over 1 second
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 10);

    // Complete the intro flow after 1 second
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 bg-[#060608] flex flex-col items-center justify-between py-16 px-6 cursor-pointer select-none overflow-hidden z-[9999]"
      onClick={onComplete}
    >
      {/* Dynamic Cinematic Breathing Ambient Background Glows */}
      <motion.div 
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-[#F52C68]/15 to-indigo-500/15 rounded-full blur-[120px]" 
      />
      
      <motion.div 
        animate={{
          scale: [1.15, 1, 1.15],
          opacity: [0.08, 0.18, 0.08],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-gradient-to-br from-[#00ffd2]/8 to-pink-500/15 rounded-full blur-[110px]" 
      />

      {/* Spacer for centering layout */}
      <div className="w-full h-8" />

      {/* Centerpiece: Logo + Title with fresh, premium styling */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        
        {/* Soft elegant pulsing glow underneath the logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-36 h-36 bg-gradient-to-r from-[#F52C68] to-indigo-500 rounded-full blur-2xl -z-10"
        />

        {/* Brand-new logo scaling and entry animation */}
        <motion.div
          initial={{ scale: 0.2, rotate: -90, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, rotate: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ 
            type: "spring",
            stiffness: 110,
            damping: 18,
            delay: 0.15
          }}
          className="relative"
        >
          {/* Decorative outer fine neon orbit path */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-dashed border-white/10"
          />
          <AppLogo size="lg" />
        </motion.div>

        {/* Brand App Name: Fresh tracking-wide letter expansion animation */}
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.05em", filter: "blur(6px)", y: 15 }}
          animate={{ opacity: 1, letterSpacing: "0.22em", filter: "blur(0px)", y: 0 }}
          transition={{ 
            duration: 1.4, 
            delay: 0.4, 
            ease: [0.19, 1, 0.22, 1] 
          }}
          className="mt-10 flex items-center justify-center select-none text-white text-xl sm:text-2xl font-[family-name:--font-brush] tracking-[0.22em] pl-[0.22em] drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]"
        >
          SCROLLRISE
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="text-[11px] sm:text-xs text-[#F52C68] font-black self-start -mt-2 ml-1"
          >
            ™
          </motion.span>
        </motion.div>
      </div>

      {/* Loading Bar Section */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center pb-8">
        
        {/* Dynamic clean progress numeric indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          className="text-[11px] font-mono font-bold text-neutral-300 mb-2.5 tracking-widest"
        >
          {progress}%
        </motion.div>

        {/* High-end minimalist loading bar */}
        <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative shadow-inner">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#F52C68] via-indigo-500 to-[#00ffd2] rounded-full shadow-[0_0_8px_rgba(245,44,104,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}
