import { useState, useEffect } from 'react';
import { getAudioWaveformPeaks } from '../utils/waveform';

export function useAudioWaveform(audioSource: Blob | string | undefined, numPeaks: number = 20) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!audioSource) {
      // Default placeholder peaks for empty state
      setPeaks(Array.from({ length: numPeaks }, (_, i) => 20 + Math.sin(i * 0.5) * 10 + (i % 3) * 5));
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    getAudioWaveformPeaks(audioSource, numPeaks)
      .then(pcmPeaks => {
        if (isSubscribed) {
          setPeaks(pcmPeaks);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("[useAudioWaveform] Failed to load peaks:", err);
        if (isSubscribed) {
          // Fallback peaks
          setPeaks(Array.from({ length: numPeaks }, (_, i) => 25 + Math.cos(i * 0.4) * 12));
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [audioSource, numPeaks]);

  return { peaks, isLoading };
}

export default useAudioWaveform;
