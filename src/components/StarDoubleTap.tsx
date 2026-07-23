import React, { useEffect, useRef } from 'react';

export default function StarDoubleTap({ onComplete, scale = 1 }: { key?: React.Key; onComplete?: () => void; scale?: number }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Particle animation using hardware-accelerated transforms and requestAnimationFrame
  useEffect(() => {
    if (!containerRef.current) return;
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const startParticles = () => {
      const NUM_PARTICLES = 80;
      const particles: { 
        el: HTMLDivElement; 
        x: number; 
        y: number; 
        vx: number; 
        vy: number; 
        life: number; 
        maxLife: number; 
        rot: number; 
        rotSpeed: number 
      }[] = [];

      for (let i = 0; i < NUM_PARTICLES; i++) {
        const el = document.createElement('div');
        const isTriangle = Math.random() > 0.5;
        
        if (isTriangle) {
          el.className = 'absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[10px] border-l-transparent border-r-transparent origin-center z-20 opacity-0';
          el.style.borderBottomColor = Math.random() > 0.3 ? '#0EA5E9' : '#38BDF8';
          el.style.filter = `drop-shadow(0 0 6px ${el.style.borderBottomColor})`;
        } else {
          el.className = 'absolute rounded-full z-20 opacity-0';
          const size = Math.random() > 0.5 ? '4px' : '2px';
          el.style.width = size;
          el.style.height = size;
          el.style.backgroundColor = Math.random() > 0.5 ? '#0EA5E9' : '#38BDF8';
          el.style.boxShadow = `0 0 8px ${el.style.backgroundColor}`;
        }
        
        el.style.left = '50%';
        el.style.top = '50%';
        
        containerRef.current?.appendChild(el);
        
        // Radiate outwards
        const angle = Math.random() * Math.PI * 2;
        // Start slightly away from center (at the edge of the initial expanded star)
        const dist = 25 + Math.random() * 30; 
        
        // Fast explosion velocity
        const speed = 4 + Math.random() * 10; 
        
        particles.push({
          el,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 35 + Math.random() * 30, // Random lifespan
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 20
        });
      }

      const updateParticles = () => {
        let active = false;
        particles.forEach((p) => {
          if (p.life < p.maxLife) {
            active = true;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.92; // Friction for snappy burst and slow floating stop
            p.vy *= 0.92;
            p.rot += p.rotSpeed;
            p.life++;
            
            const progress = p.life / p.maxLife;
            // Quick scale up, then shrink down
            const currentScale = progress < 0.2 ? progress / 0.2 : 1 - ((progress - 0.2) / 0.8);
            // Exponential fade out
            const opacity = 1 - Math.pow(progress, 3);
            
            p.el.style.transform = `translate3d(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px), 0) rotate(${p.rot}deg) scale3d(${currentScale}, ${currentScale}, 1)`;
            p.el.style.opacity = Math.max(0, opacity).toString();
          } else {
            p.el.style.opacity = '0';
          }
        });

        if (active) {
          rafId = requestAnimationFrame(updateParticles);
        }
      };
      
      rafId = requestAnimationFrame(updateParticles);
    };

    // Delay particle burst to sync with the spring expansion peak (1.6s from timeline -> approx 300ms since we start at 1.2s tap)
    timeoutId = setTimeout(startParticles, 300);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* We skip the pure black background so it acts as an overlay seamlessly like Instagram. */}
      
      <div className="relative flex items-center justify-center" style={{ transform: `scale(${scale})` }}>
        {/* Core bloom / glow - changed from white/blue mix to stronger cyan */}
        <div className="absolute w-[160px] h-[160px] bg-[#0EA5E9]/30 blur-[40px] rounded-full opacity-0 animate-[star-neon-glow_2s_ease-out_forwards]" />
        
        {/* Particle container for JS driven requestAnimationFrame burst */}
        <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

        {/* High-end 3D Crystal Star with Futuristic Glassmorphism */}
        <svg 
          className="w-32 h-32 drop-shadow-[0_0_25px_rgba(14,165,233,0.9)] animate-[crystal-star-reaction_2s_cubic-bezier(0.34,1.56,0.64,1)_forwards] z-30 overflow-visible" 
          viewBox="0 0 24 24"
        >
          {/* Defs for Premium Crystal Gradients */}
          <defs>
            <linearGradient id="crystalTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="crystalRight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="crystalBottom" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#075985" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </linearGradient>
            <linearGradient id="crystalLeft" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
          </defs>

          {/* Top Arm */}
          <polygon points="12,12.5 12,1.5 8.5,8" fill="url(#crystalTop)" />
          <polygon points="12,12.5 12,1.5 15.5,8" fill="#0EA5E9" opacity="0.9" />
          
          {/* Right Arm */}
          <polygon points="12,12.5 22.5,9 15.5,8" fill="url(#crystalRight)" opacity="0.9" />
          <polygon points="12,12.5 22.5,9 17,14.5" fill="#0369A1" opacity="0.8" />
          
          {/* Bottom Right Arm */}
          <polygon points="12,12.5 19,22 17,14.5" fill="url(#crystalBottom)" opacity="0.85" />
          <polygon points="12,12.5 19,22 12,18" fill="#075985" opacity="0.9" />
          
          {/* Bottom Left Arm */}
          <polygon points="12,12.5 5,22 12,18" fill="url(#crystalBottom)" opacity="0.85" />
          <polygon points="12,12.5 5,22 7,14.5" fill="#0369A1" opacity="0.9" />
          
          {/* Left Arm */}
          <polygon points="12,12.5 1.5,9 7,14.5" fill="url(#crystalLeft)" opacity="0.9" />
          <polygon points="12,12.5 1.5,9 8.5,8" fill="#0284C7" opacity="0.9" />

          {/* Internal specular reflections (Glass edges) */}
          <path d="M12,1.5 L12,12.5 M22.5,9 L12,12.5 M19,22 L12,12.5 M5,22 L12,12.5 M1.5,9 L12,12.5" stroke="#0EA5E9" strokeWidth="0.2" strokeLinecap="round" opacity="0.4" />
          <path d="M12,1.5 L15.5,8 L22.5,9 L17,14.5 L19,22 L12,18 L5,22 L7,14.5 L1.5,9 L8.5,8 Z" stroke="#0EA5E9" strokeWidth="0.3" strokeLinejoin="round" fill="none" opacity="0.3" />
          
          {/* Overlay glow on top vertex */}
          <circle cx="12" cy="1.5" r="1.5" fill="#0EA5E9" opacity="0.4" filter="blur(1px)" />
        </svg>

        <style>{`
          /* 
            Reaction Timing translation (approx):
            0% -> 0.0s (Scale 0)
            20% -> 0.4s (Reaction Burst peak: 130%)
            40% -> 0.8s (Shine peak)
            70% -> 1.4s (Idle settle / Returning)
            100% -> 2.0s (Faded out)
          */
          @keyframes crystal-star-reaction {
            0% { transform: scale(0) rotate(-15deg); opacity: 0; filter: brightness(2) contrast(1.2); }
            15% { transform: scale(1.4) rotate(5deg); opacity: 1; filter: brightness(2.5) contrast(1.3); } /* Spring overshoot */
            30% { transform: scale(1.2) rotate(-2deg); opacity: 1; filter: brightness(1.5); }
            50% { transform: scale(1.3) rotate(0deg); opacity: 1; filter: brightness(2); } /* Shine peak */
            80% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
            100% { transform: scale(0.6) rotate(10deg); opacity: 0; filter: brightness(0.5); }
          }
          
          @keyframes star-neon-glow {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.3); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.8; }
            80% { transform: scale(1); opacity: 0.4; }
            100% { transform: scale(0.5); opacity: 0; }
          }
          
          @keyframes star-core-glow {
            0% { transform: scale(0.5); opacity: 0; }
            15% { transform: scale(1.1); opacity: 1; }
            40% { transform: scale(1.4); opacity: 0.9; }
            100% { transform: scale(0.8); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

