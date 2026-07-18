import { useState, useEffect, useRef, useCallback } from 'react';
import { voiceRecordingService } from '../services/voiceRecordingService';

export function useVoiceRecorder(onRecordingComplete?: (blob: Blob, duration: number) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const recorder = voiceRecordingService.getRecorder();

  const handleStop = useCallback((blob: Blob) => {
    // Stop local timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const finalDuration = recordingTime;
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);

    if (onRecordingComplete && blob.size > 0) {
      onRecordingComplete(blob, finalDuration || 1);
    }
  }, [recordingTime, onRecordingComplete]);

  const handleErr = useCallback((err: Error) => {
    console.error("[useVoiceRecorder] Microphone permission or capture error:", err);
    setPermissionError(err.message || "Microphone access denied or failed");
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setRecordingTime(0);
    setIsPaused(false);

    try {
      await recorder.start(handleStop, handleErr);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          const maxDur = voiceRecordingService.getMaxDuration();
          if (next >= maxDur) {
            // Reached maximum recording length of 30 mins, automatically stop recording
            recorder.stop();
            return prev;
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      handleErr(err);
    }
  }, [recorder, handleStop, handleErr]);

  const pauseRecording = useCallback(() => {
    if (recorder.state === 'recording') {
      recorder.pause();
      setIsPaused(true);
    }
  }, [recorder]);

  const resumeRecording = useCallback(() => {
    if (recorder.state === 'paused') {
      recorder.resume();
      setIsPaused(false);
    }
  }, [recorder]);

  const stopRecording = useCallback(() => {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, [recorder]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorder.cancel();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  }, [recorder]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      voiceRecordingService.releaseRecorder();
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    permissionError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording
  };
}

export default useVoiceRecorder;
