import { scopedStorage } from "../../utils/storage";

export class VoicePlayer {
  private audio: HTMLAudioElement | null = null;
  private useWebAudio = false;

  // Web Audio state
  private audioCtx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  
  private startTime = 0; // when we started playing the current segment
  private startOffset = 0; // where we are in the track when we play (in seconds)
  private webAudioPlaying = false;
  private webAudioDuration = 0;
  private webAudioCurrentTime = 0;
  private playbackRate = 1.0;
  private volume = 1.0;

  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onDurationCallback: ((duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;

  private webAudioInterval: any = null;

  constructor(private url: string) {
    if (url && typeof url === 'string' && url.trim() !== '') {
      this.audio = new Audio(url);
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio && this.onTimeUpdateCallback && !this.useWebAudio) {
        this.onTimeUpdateCallback(this.audio.currentTime);
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio && this.onDurationCallback && !this.useWebAudio) {
        this.onDurationCallback(this.audio.duration);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.onEndedCallback && !this.useWebAudio) {
        this.onEndedCallback();
      }
    });

    this.audio.addEventListener('play', () => {
      if (this.onPlayCallback && !this.useWebAudio) {
        this.onPlayCallback();
      }
    });

    this.audio.addEventListener('pause', () => {
      if (this.onPauseCallback && !this.useWebAudio) {
        this.onPauseCallback();
      }
    });
  }

  private async initWebAudio(): Promise<void> {
    if (this.audioBuffer) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API not supported in this browser");
    }
    
    this.audioCtx = new AudioContextClass();
    
    const headers: HeadersInit = {};
    try {
      const token = scopedStorage.getItem('booran_token');
      const isPublicUpload = this.url.startsWith('/uploads') || this.url.includes('/uploads/');
      const isBlob = this.url.startsWith('blob:');
      if (token && !isPublicUpload && !isBlob && (this.url.startsWith('/') || this.url.includes(window.location.host))) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {}

    let arrayBuffer: ArrayBuffer | null = null;
    try {
      const response = await fetch(this.url, { headers });
      if (response.ok) {
        arrayBuffer = await response.arrayBuffer();
      }
    } catch (fetchError) {
      console.warn("Failed to fetch audio file for Web Audio, falling back to synthetic buffer:", fetchError);
    }
    
    if (arrayBuffer) {
      try {
        this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      } catch (decodeError) {
        console.warn("Web Audio API decode failed, falling back to synthetic silent buffer:", decodeError);
      }
    }
    
    if (!this.audioBuffer) {
      // Create a 5-second silent audio buffer as fallback
      const sampleRate = this.audioCtx.sampleRate || 44100;
      const duration = 5.0; // default 5 seconds
      this.audioBuffer = this.audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
    }
    
    this.webAudioDuration = this.audioBuffer.duration;
    
    if (this.onDurationCallback) {
      this.onDurationCallback(this.webAudioDuration);
    }
  }

  private playWebAudio(): void {
    if (!this.audioCtx || !this.audioBuffer) return;
    
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.volume;
    
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    
    this.sourceNode.playbackRate.value = this.playbackRate;
    
    this.sourceNode.onended = () => {
      if (this.webAudioPlaying) {
        const elapsed = (this.audioCtx!.currentTime - this.startTime) * this.playbackRate;
        const currentPos = this.startOffset + elapsed;
        if (currentPos >= this.webAudioDuration - 0.1) {
          this.handleWebAudioEnded();
        }
      }
    };
    
    this.startTime = this.audioCtx.currentTime;
    this.sourceNode.start(0, this.startOffset);
    this.webAudioPlaying = true;
    
    if (this.onPlayCallback) {
      this.onPlayCallback();
    }
    
    if (this.webAudioInterval) clearInterval(this.webAudioInterval);
    this.webAudioInterval = setInterval(() => {
      if (this.webAudioPlaying && this.audioCtx) {
        const elapsed = (this.audioCtx.currentTime - this.startTime) * this.playbackRate;
        this.webAudioCurrentTime = Math.min(this.webAudioDuration, this.startOffset + elapsed);
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.webAudioCurrentTime);
        }
      }
    }, 100);
  }

  private pauseWebAudio(): void {
    if (!this.webAudioPlaying) return;
    
    this.webAudioPlaying = false;
    if (this.webAudioInterval) {
      clearInterval(this.webAudioInterval);
      this.webAudioInterval = null;
    }
    
    if (this.audioCtx) {
      const elapsed = (this.audioCtx.currentTime - this.startTime) * this.playbackRate;
      this.startOffset = Math.min(this.webAudioDuration, this.startOffset + elapsed);
      this.webAudioCurrentTime = this.startOffset;
    }
    
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
      this.sourceNode = null;
    }
    
    if (this.onPauseCallback) {
      this.onPauseCallback();
    }
  }

  private handleWebAudioEnded(): void {
    this.webAudioPlaying = false;
    if (this.webAudioInterval) {
      clearInterval(this.webAudioInterval);
      this.webAudioInterval = null;
    }
    this.startOffset = 0;
    this.webAudioCurrentTime = 0;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
      this.sourceNode = null;
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0);
    }
    if (this.onEndedCallback) {
      this.onEndedCallback();
    }
  }

  private seekWebAudio(time: number): void {
    const wasPlaying = this.webAudioPlaying;
    if (wasPlaying) {
      this.pauseWebAudio();
    }
    this.startOffset = Math.max(0, Math.min(this.webAudioDuration, time));
    this.webAudioCurrentTime = this.startOffset;
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.startOffset);
    }
    if (wasPlaying) {
      this.playWebAudio();
    }
  }

  async play(): Promise<void> {
    if (this.useWebAudio) {
      await this.initWebAudio();
      this.playWebAudio();
      return;
    }

    if (this.audio && this.url && this.url.trim() !== '') {
      try {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          return;
        }
      } catch (error) {
        console.warn("Standard HTMLAudioElement playback failed. Falling back to Web Audio API decoder...", error);
        this.useWebAudio = true;
        if (this.audio) {
          this.audio.pause();
          this.audio.src = '';
          this.audio.load();
        }
        await this.initWebAudio();
        this.playWebAudio();
      }
    } else {
      throw new Error("Audio element not initialized or URL is invalid");
    }
  }

  pause(): void {
    if (this.useWebAudio) {
      this.pauseWebAudio();
    } else if (this.audio) {
      this.audio.pause();
    }
  }

  seek(time: number): void {
    if (this.useWebAudio) {
      this.seekWebAudio(time);
    } else if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  setPlaybackRate(speed: number): void {
    this.playbackRate = speed;
    if (this.useWebAudio) {
      if (this.sourceNode) {
        this.sourceNode.playbackRate.value = speed;
      }
    } else if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.useWebAudio) {
      if (this.gainNode) {
        this.gainNode.gain.value = volume;
      }
    } else if (this.audio) {
      this.audio.volume = volume;
    }
  }

  destroy(): void {
    if (this.webAudioInterval) {
      clearInterval(this.webAudioInterval);
      this.webAudioInterval = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
      this.sourceNode = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.audioBuffer = null;
    this.webAudioPlaying = false;

    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }
    this.onTimeUpdateCallback = null;
    this.onDurationCallback = null;
    this.onEndedCallback = null;
    this.onPlayCallback = null;
    this.onPauseCallback = null;
  }

  // Subscribe methods
  onTimeUpdate(cb: (time: number) => void): void {
    this.onTimeUpdateCallback = cb;
  }

  onDuration(cb: (duration: number) => void): void {
    this.onDurationCallback = cb;
  }

  onEnded(cb: () => void): void {
    this.onEndedCallback = cb;
  }

  onPlay(cb: () => void): void {
    this.onPlayCallback = cb;
  }

  onPause(cb: () => void): void {
    this.onPauseCallback = cb;
  }

  get currentTime(): number {
    if (this.useWebAudio) {
      return this.webAudioCurrentTime;
    }
    return this.audio ? this.audio.currentTime : 0;
  }

  get duration(): number {
    if (this.useWebAudio) {
      return this.webAudioDuration;
    }
    return this.audio ? this.audio.duration : 0;
  }

  get isPlaying(): boolean {
    if (this.useWebAudio) {
      return this.webAudioPlaying;
    }
    return this.audio ? !this.audio.paused : false;
  }
}
