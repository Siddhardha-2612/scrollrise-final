import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceRecordingBarProps {
  recordingTime: number;
  onCancel: () => void;
  onSend: () => void;
  isBlocked?: boolean;
}

export const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  recordingTime,
  onCancel,
  onSend,
  isBlocked
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center w-full bg-[#313131] rounded-[999px] pl-4 pr-1.5 h-12 relative overflow-hidden">
      {/* Live Recording Time */}
      <span className="text-red-400 font-mono text-sm font-medium tracking-wide z-10 w-12 shrink-0 animate-pulse">
        {formatTime(recordingTime)}
      </span>

      {/* Animated Sound Waves centered absolutely (pulsing) */}
      <div className="absolute inset-x-0 w-full flex justify-center pointer-events-none z-0">
        <div className="flex items-center space-x-[4px]">
          <div className="w-[3px] h-[12px] bg-white rounded-full bg-opacity-90 animate-pulse" />
          <div className="w-[3px] h-[20px] bg-white rounded-full bg-opacity-90 animate-pulse" style={{ animationDelay: '100ms' }} />
          <div className="w-[3px] h-[28px] bg-white rounded-full bg-opacity-90 animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-[3px] h-[20px] bg-white rounded-full bg-opacity-90 animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-[3px] h-[12px] bg-white rounded-full bg-opacity-90 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>

      <div className="flex-1" />

      {/* Discard & Send Controls */}
      <div className="flex items-center space-x-2 shrink-0 relative z-10">
        {/* Discard Recording button (looks like custom mic indicator trigger) */}
        <button
          type="button" 
          onClick={onCancel}
          className="text-white hover:text-gray-300 transition-colors p-1.5 focus:outline-none cursor-pointer relative mr-1"
          title="Discard recording"
        >
          <Mic className="w-[24px] h-[24px]" strokeWidth={2} />
          <div className="absolute bottom-1 right-0.5 w-[14px] h-[14px] bg-white text-black rounded-full flex items-center justify-center shadow-lg border-[1.5px] border-[#313131]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-[8px] h-[8px]">
              <polyline points="2 12 7 12 10 3 14 21 17 12 22 12"></polyline>
            </svg>
          </div>
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={onSend}
          disabled={isBlocked}
          className="px-[18px] py-[6px] rounded-[99px] text-[#f8f9fa] font-medium text-[15px] hover:opacity-95 active:scale-95 transition-all cursor-pointer bg-[#2c65cc] disabled:opacity-50"
        >
          send
        </button>
      </div>
    </div>
  );
};

export default VoiceRecordingBar;
