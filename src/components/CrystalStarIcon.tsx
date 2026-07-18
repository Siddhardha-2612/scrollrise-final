import React from 'react';

export default function CrystalStarIcon({ className, isActive }: { className?: string; isActive?: boolean }) {
  if (!isActive) {
    return (
      <svg className={`text-zinc-100 stroke-current transition-colors ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12,2 L15,8.5 L22,9.5 L16.5,14.5 L18.5,21.5 L12,17.5 L5.5,21.5 L7.5,14.5 L2,9.5 L9,8.5 Z" />
      </svg>
    );
  }

  return (
    <svg 
      className={`text-yellow-400 ${className}`} 
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12,2 L15,8.5 L22,9.5 L16.5,14.5 L18.5,21.5 L12,17.5 L5.5,21.5 L7.5,14.5 L2,9.5 L9,8.5 Z" />
    </svg>
  );
}

