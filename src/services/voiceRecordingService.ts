import { VoiceRecorder } from '../components/voice/VoiceRecorder';

class VoiceRecordingService {
  private activeRecorder: VoiceRecorder | null = null;
  private maxDuration = 30 * 60; // 30 minutes in seconds

  getRecorder(): VoiceRecorder {
    if (!this.activeRecorder) {
      this.activeRecorder = new VoiceRecorder();
    }
    return this.activeRecorder;
  }

  isRecording(): boolean {
    return this.activeRecorder ? this.activeRecorder.state !== 'inactive' : false;
  }

  getMaxDuration(): number {
    return this.maxDuration;
  }

  releaseRecorder(): void {
    if (this.activeRecorder) {
      this.activeRecorder.cancel();
      this.activeRecorder = null;
    }
  }
}

export const voiceRecordingService = new VoiceRecordingService();
export default voiceRecordingService;
