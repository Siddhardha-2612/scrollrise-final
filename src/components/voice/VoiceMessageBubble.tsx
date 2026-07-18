import React from 'react';
import { Play, Pause, Clock, RefreshCw } from 'lucide-react';
import { useVoicePlayer } from '../../hooks/useVoicePlayer';

interface VoiceMessageBubbleProps {
  messageId: string;
  audioUrl: string;
  duration: number;
  fileSize?: number;
  status?: string;
  uploadPercent?: number;
  onRetryUpload?: () => void;
  isMe?: boolean;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  messageId,
  audioUrl,
  status,
  onRetryUpload,
  isMe = false
}) => {
  const {
    isPlaying,
    togglePlay
  } = useVoicePlayer(messageId, audioUrl);

  const isFailed = status === 'failed';
  const isPending = status === 'pending';
  const hasValidAudio = !!audioUrl && typeof audioUrl === 'string' && audioUrl.trim() !== '';

  if (!hasValidAudio && !isPending && !isFailed) {
    return (
      <div className={`relative rounded-full px-4 py-2.5 flex items-center gap-2.5 shadow-md select-none w-[145px] shrink-0 justify-center opacity-50 cursor-not-allowed ${
        isMe ? 'bg-black/30 border border-white/10' : 'bg-black/20 border border-white/5'
      }`}>
        <div className="flex items-center justify-center shrink-0">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <span className="text-[11px] font-sans tracking-wide font-medium text-white/50 leading-none">
          Audio missing
        </span>
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasValidAudio) {
          togglePlay();
        }
      }}
      className={`relative rounded-full px-4 py-2.5 flex items-center gap-2.5 shadow-md select-none transition-all duration-200 w-[145px] shrink-0 justify-center ${
        hasValidAudio ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed opacity-70'
      } ${
        isMe 
          ? 'bg-black/30 hover:bg-black/40 border border-white/10' 
          : 'bg-black/20 hover:bg-black/30 border border-white/5'
      }`}
    >
      <div className="flex items-center justify-center shrink-0">
        {isPlaying ? (
          <Pause 
            className={`w-3.5 h-3.5 fill-current ${
              isMe ? 'text-white' : 'text-sky-200'
            }`} 
          />
        ) : (
          <Play 
            className={`w-3.5 h-3.5 fill-current ${
              isMe ? 'text-white' : 'text-sky-200'
            }`} 
          />
        )}
      </div>
      <span className="text-[11px] font-sans tracking-wide font-medium text-white/95 leading-none">
        Voice message
      </span>
    </div>
  );
};

export default VoiceMessageBubble;
