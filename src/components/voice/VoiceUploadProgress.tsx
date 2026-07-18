import React from 'react';
import { Upload, CheckCircle } from 'lucide-react';

interface VoiceUploadProgressProps {
  progress: number;
  fileName?: string;
}

export const VoiceUploadProgress: React.FC<VoiceUploadProgressProps> = ({ progress, fileName }) => {
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3 flex flex-col gap-2 w-full max-w-[280px]">
      <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
        <span className="flex items-center gap-1.5 font-sans font-bold">
          <Upload className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
          Uploading Voice Note
        </span>
        <span>{progress}%</span>
      </div>

      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-[#2c65cc] h-full transition-all duration-150" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {fileName && (
        <span className="text-[9px] font-mono text-zinc-500 truncate">
          {fileName}
        </span>
      )}
    </div>
  );
};

export default VoiceUploadProgress;
