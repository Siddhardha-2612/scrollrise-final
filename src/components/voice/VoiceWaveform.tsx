import React from 'react';

interface VoiceWaveformProps {
  peaks: number[];
  currentTime: number;
  duration: number;
  isActive: boolean;
  onSeek: (time: number) => void;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  peaks,
  currentTime,
  duration,
  isActive,
  onSeek
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const targetTime = percentage * (duration || 5);
    onSeek(targetTime);
  };

  return (
    <div 
      className="h-10 flex items-end gap-[3px] px-1 relative cursor-pointer select-none"
      onClick={handleWaveformClick}
    >
      {peaks.map((barHeight, idx) => {
        const barPercent = (idx / peaks.length) * 100;
        const isPlayed = isActive && progressPercent >= barPercent;
        return (
          <div 
            key={idx}
            className="flex-1 rounded-full transition-all duration-150"
            style={{ 
              height: `${Math.max(15, Math.min(100, barHeight))}%`, 
              backgroundColor: isPlayed ? '#2c65cc' : 'rgba(255,255,255,0.15)'
            }}
          />
        );
      })}
    </div>
  );
};

export default VoiceWaveform;
