import { useState, useEffect, useRef, useCallback } from 'react';
import { voicePlaybackService } from '../services/voicePlaybackService';

export function useVoicePlayer(messageId: string, audioUrl: string) {
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const timerRef = useRef<any>(null);

  // Synchronize state with the global playback service
  useEffect(() => {
    const unsubscribe = voicePlaybackService.subscribe((activeId, activeIsPlaying) => {
      const active = activeId === messageId;
      setIsActive(active);
      setIsPlaying(active && activeIsPlaying);

      if (!active) {
        setCurrentTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Start time-update polling if we are playing and native listener fallback
        const player = voicePlaybackService.getActivePlayer();
        if (player) {
          setDuration(player.duration || 0);
          setPlaybackSpeed(playbackSpeed);
          player.setPlaybackRate(playbackSpeed);

          if (activeIsPlaying) {
            if (!timerRef.current) {
              timerRef.current = setInterval(() => {
                if (player) {
                  setCurrentTime(player.currentTime);
                  setDuration(player.duration || 0);
                }
              }, 100);
            }
          } else {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [messageId, playbackSpeed]);

  const togglePlay = useCallback(() => {
    if (!audioUrl) return;
    if (isActive) {
      const player = voicePlaybackService.getActivePlayer();
      if (player) {
        if (isPlaying) {
          player.pause();
        } else {
          player.setPlaybackRate(playbackSpeed);
          player.play().catch(e => {
            console.error("Error playing audio:", e);
            setIsPlaying(false);
          });
        }
      }
    } else {
      const player = voicePlaybackService.registerPlayer(messageId, audioUrl);
      player.onDuration((dur) => setDuration(dur));
      player.onTimeUpdate((time) => setCurrentTime(time));
      player.onEnded(() => {
        setCurrentTime(0);
        setIsPlaying(false);
      });
      player.setPlaybackRate(playbackSpeed);
      player.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error("Error initiating play:", e);
          setIsPlaying(false);
          if (voicePlaybackService.getActiveId() === messageId) {
             voicePlaybackService.stopActive();
          }
        });
    }
  }, [isActive, isPlaying, messageId, audioUrl, playbackSpeed]);

  const seek = useCallback((time: number) => {
    if (isActive) {
      const player = voicePlaybackService.getActivePlayer();
      if (player) {
        player.seek(time);
        setCurrentTime(time);
      }
    } else {
      // Lazy init and seek
      const player = voicePlaybackService.registerPlayer(messageId, audioUrl);
      player.seek(time);
      setCurrentTime(time);
    }
  }, [isActive, messageId, audioUrl]);

  const stop = useCallback(() => {
    if (isActive) {
      voicePlaybackService.stopActive();
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [isActive]);

  const replay = useCallback(() => {
    const player = voicePlaybackService.registerPlayer(messageId, audioUrl);
    player.seek(0);
    player.setPlaybackRate(playbackSpeed);
    player.play()
      .then(() => {
        setIsPlaying(true);
        setCurrentTime(0);
      })
      .catch(e => console.error("Error replaying:", e));
  }, [messageId, audioUrl, playbackSpeed]);

  const changeSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (isActive) {
      const player = voicePlaybackService.getActivePlayer();
      if (player) {
        player.setPlaybackRate(speed);
      }
    }
  }, [isActive]);

  return {
    isActive,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    togglePlay,
    seek,
    stop,
    replay,
    changeSpeed
  };
}

export default useVoicePlayer;
