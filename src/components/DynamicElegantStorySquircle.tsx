import React from 'react';
import { User } from 'lucide-react';

interface DynamicElegantStorySquircleProps {
  children?: React.ReactNode;
  size?: number;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  className?: string;
  hasPlusButton?: boolean;
  onPlusClick?: (e: React.MouseEvent) => void;
}

/**
 * DynamicElegantStorySquircle
 * Implements the exact squircle card style shown in the second image:
 * - Rounded-squircle outer container
 * - High-contrast metallic dual-gradient border crossing from luxury warm gold (bottom-left)
 *   to deep crimson / burgundy / rose (top-right)
 * - Solid pitch-black background interior (#0c0c0d)
 * - Centered sleek, minimalist white user outline icon or custom children (e.g. image)
 * - Completely responsive with interactive states matching the theme
 */
export function DynamicElegantStorySquircle({
  children,
  size = 74,
  title,
  onClick,
  onDoubleClick,
  className = "",
  hasPlusButton = false,
  onPlusClick
 }: DynamicElegantStorySquircleProps) {
  // Generate random suffix to prevent clipPath ID collisions
  const idSuffix = React.useMemo(() => Math.random().toString(36).substring(2, 9), []);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`relative select-none flex-shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group ${className}`}
      style={{ width: size, height: size }}
      title={title}
    >
      {/* Background vector graphics layout for exact high-fidelity borders */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] pointer-events-none z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Strong metallic Gold Gradient to apply to the entire border */}
          <linearGradient id={`bezelGrad-${idSuffix}`} x1="0%" y1="90%" x2="100%" y2="10%">
            <stop offset="0%" stopColor="#9A7A35" />
            <stop offset="25%" stopColor="#EAC775" />
            <stop offset="50%" stopColor="#BE9648" />
            <stop offset="75%" stopColor="#FDF1A9" />
            <stop offset="100%" stopColor="#A3813B" />
          </linearGradient>

          {/* SQUIRCLE CLIP PATH inside objectBoundingBox (0.0 to 1.0) so it scales beautifully to any HTML div size */}
          <clipPath id={`innerSquircleClip-${idSuffix}`} clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.09
                     h 0.13
                     C 0.79,0.09 0.91,0.21 0.91,0.37
                     v 0.26
                     C 0.91,0.79 0.79,0.91 0.63,0.91
                     h -0.26
                     C 0.21,0.91 0.09,0.79 0.09,0.63
                     v -0.26
                     C 0.09,0.21 0.21,0.09 0.37,0.09
                     h 0.13 Z" />
          </clipPath>
        </defs>

        {/* Black background to fill the frame and provide gap */}
        <path
          d="M 50,4
             h 18
             C 84,4 96,16 96,32
             v 36
             C 96,84 84,96 68,96
             h -36
             C 16,96 4,84 4,68
             v -36
             C 4,16 16,4 32,4
             h 18 Z"
          fill="#000000"
        />

        {/* Outer squircle gradient border line matching the path at 4% inset */}
        <path
          d="M 50,4
             h 18
             C 84,4 96,16 96,32
             v 36
             C 96,84 84,96 68,96
             h -36
             C 16,96 4,84 4,68
             v -36
             C 4,16 16,4 32,4
             h 18 Z"
          fill="none"
          stroke={`url(#bezelGrad-${idSuffix})`}
          strokeWidth="5.5"
        />
      </svg>

      {/* HTML overlay clipped by SVG clip-path to ensure perfect pixel-crisp image rendering unconditionally */}
      <div 
        className="absolute inset-0 z-10 bg-black flex items-center justify-center transition-colors group-hover:bg-[#070709] pointer-events-auto overflow-hidden"
        style={{ clipPath: `url(#innerSquircleClip-${idSuffix})`, WebkitClipPath: `url(#innerSquircleClip-${idSuffix})` }}
      >
        {children ? children : (
          /* White outline user icon matching the picture perfectly */
          <User className="w-[35%] h-[35%] text-white opacity-95 stroke-[1.5] transition-transform duration-300 group-hover:scale-110" />
        )}

        {/* Interior subtle glow/depth vignette */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
      </div>

      {/* PLUS BADGE OVERLAY */}
      {hasPlusButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onPlusClick) {
              onPlusClick(e);
            }
          }}
          className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] bg-gradient-to-b from-[#4a4a4a] to-[#1a1a1a] text-white rounded-full border-2 border-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.9)] cursor-pointer transition-transform hover:scale-110 active:scale-90 z-20 overflow-hidden group/plus"
        >
          {/* Inner 1px inset ring for metallic effect */}
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
          {/* Star Icon */}
          <svg className="w-4 h-4 text-white drop-shadow-md relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      )}
    </div>
  );
}
