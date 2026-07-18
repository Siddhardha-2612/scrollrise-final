import { getSupportedAudioMimeType, requestMicrophoneStream } from '../../utils/mediaRecorder';

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private onDataAvailableCallback: ((blob: Blob) => void) | null = null;
  private onStopCallback: ((blob: Blob) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  async start(
    onStop: (blob: Blob) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    this.chunks = [];
    this.onStopCallback = onStop;
    if (onError) this.onErrorCallback = onError;
    
    try {
      this.stream = await requestMicrophoneStream();
      const mimeType = getSupportedAudioMimeType();
      
      const options = { mimeType };
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options);
      } catch (e) {
        this.mediaRecorder = new MediaRecorder(this.stream);
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        if (this.onStopCallback) {
          this.onStopCallback(audioBlob);
        }
        this.release();
      };

      this.mediaRecorder.start();
    } catch (err: any) {
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
    }
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  cancel(): void {
    if (this.mediaRecorder) {
      // Disconnect stop callback to ignore blob generation
      this.mediaRecorder.onstop = null;
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    }
    this.release();
  }

  private release(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  get state(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder ? (this.mediaRecorder.state as any) : 'inactive';
  }
}
