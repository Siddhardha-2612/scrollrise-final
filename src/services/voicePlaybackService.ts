import { VoicePlayer } from '../components/voice/VoicePlayer';

class VoicePlaybackService {
  private activePlayer: VoicePlayer | null = null;
  private activeId: string | null = null;
  private listeners = new Set<(activeId: string | null, isPlaying: boolean) => void>();

  registerPlayer(id: string, url: string): VoicePlayer {
    // If there is an active player for a DIFFERENT message, pause and destroy it first
    if (this.activePlayer && this.activeId !== id) {
      this.activePlayer.destroy();
      this.activePlayer = null;
      this.activeId = null;
      this.notify();
    }

    if (!this.activePlayer) {
      this.activePlayer = new VoicePlayer(url);
      this.activeId = id;
      
      this.activePlayer.onPlay(() => this.notify(true));
      this.activePlayer.onPause(() => this.notify(false));
      this.activePlayer.onEnded(() => {
        this.notify(false);
      });
    }

    return this.activePlayer;
  }

  getActivePlayer(): VoicePlayer | null {
    return this.activePlayer;
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  pauseActive(): void {
    if (this.activePlayer) {
      this.activePlayer.pause();
    }
  }

  stopActive(): void {
    if (this.activePlayer) {
      this.activePlayer.destroy();
      this.activePlayer = null;
      this.activeId = null;
      this.notify(false);
    }
  }

  subscribe(callback: (activeId: string | null, isPlaying: boolean) => void): () => void {
    this.listeners.add(callback);
    // Initial emission
    callback(this.activeId, this.activePlayer ? this.activePlayer.isPlaying : false);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(isPlayingOverride?: boolean): void {
    const isPlaying = isPlayingOverride !== undefined 
      ? isPlayingOverride 
      : (this.activePlayer ? this.activePlayer.isPlaying : false);
    this.listeners.forEach(cb => cb(this.activeId, isPlaying));
  }
}

export const voicePlaybackService = new VoicePlaybackService();
export default voicePlaybackService;
