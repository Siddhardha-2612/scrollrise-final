import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AppLogo({ className = '', size = 'md' }: AppLogoProps) {
  // Sizing mapping helper
  const sizeClasses = {
    sm: 'w-12 h-12 rounded-[12px]',
    md: 'w-28 h-28 rounded-[28px]',
    lg: 'w-36 h-36 rounded-[36px]',
    xl: 'w-48 h-48 rounded-[48px]',
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.4)] ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vibrant linear gradient that exactly matches the user's uploaded logo */}
          <linearGradient id="logo-vibrant-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E50FF" />    {/* Dynamic Blue */}
            <stop offset="25%" stopColor="#8B5CF6" />   {/* Violet */}
            <stop offset="55%" stopColor="#EC4899" />   {/* Hot Pink */}
            <stop offset="80%" stopColor="#EF4444" />   {/* Bright Red-Orange */}
            <stop offset="100%" stopColor="#F59E0B" />  {/* Golden Yellow */}
          </linearGradient>
          
          {/* Subtle inner shadow filter to make the white logo pop with premium depth */}
          <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>

          {/* S monogram mask cutting parallel diagonal slots through the hexagon */}
          <mask id="logo-s-mask">
            {/* White area retains the original shape */}
            <rect width="100" height="100" fill="white" />
            {/* Black lines cut through to the background */}
            {/* Upper-right slot cutting down-left, leaving the top-left loop closed */}
            <line 
              x1="36" 
              y1="30" 
              x2="95" 
              y2="64" 
              stroke="black" 
              strokeWidth="11" 
              strokeLinecap="round" 
            />
            {/* Lower-left slot cutting up-right, leaving the bottom-right loop closed */}
            <line 
              x1="5" 
              y1="36" 
              x2="64" 
              y2="70" 
              stroke="black" 
              strokeWidth="11" 
              strokeLinecap="round" 
            />
          </mask>
        </defs>

        {/* Background Card */}
        <rect width="100" height="100" fill="url(#logo-vibrant-grad)" />

        {/* Inner Stylized Hexagonal 'S' Monogram */}
        <g filter="url(#subtle-shadow)">
          <path 
            d="M 50 14 C 52 15.1, 79.2 30.8, 80 32 C 81.2 33.5, 81.2 66.5, 80 68 C 79.2 69.2, 52 84.9, 50 86 C 48 84.9, 20.8 69.2, 20 68 C 18.8 66.5, 18.8 33.5, 20 32 C 20.8 30.8, 48 15.1, 50 14 Z" 
            fill="white"
            mask="url(#logo-s-mask)"
          />
          
          {/* Bottom horizontal small bar / pill */}
          <rect x="41" y="87" width="18" height="5.5" rx="2.75" fill="white" />
        </g>

        {/* Trade Mark (TM) symbol positioned elegantly near the top right of the monogram, safely avoiding rounded corner clipping */}
        <text
          x="75"
          y="29"
          fill="white"
          fontSize="7.5"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="900"
          opacity="0.95"
          textAnchor="start"
        >
          ™
        </text>
      </svg>
    </div>
  );
}
