import { VoiceMessageMetadata } from '../types/voice';
import { scopedStorage } from '../utils/storage';
import { api } from './api';
import { API_BASE_URL } from '../config';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export class VoiceUploadService {
  static async uploadOriginalBlob(
    blob: Blob,
    metadata: {
      messageId: string;
      senderId: string;
      receiverId: string;
      duration: number;
    },
    onProgress?: (progress: UploadProgressEvent) => void
  ): Promise<VoiceMessageMetadata> {
    const formData = new FormData();
    formData.append('audio', blob, `${metadata.messageId}.webm`);
    formData.append('messageId', metadata.messageId);

    const token = scopedStorage.getItem('booran_token');

    const response = await fetch(API_BASE_URL + '/api/voice/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    const audioUrl = data.audioUrl;

    // Save to messages
    const msg = await api.sendMessage({
      receiverUsername: metadata.receiverId,
      text: "Voice message",
      mediaUrl: audioUrl,
      isVoice: true,
      duration: metadata.duration,
    });

    return {
      messageId: msg._id || metadata.messageId,
      senderId: metadata.senderId,
      receiverId: metadata.receiverId,
      audioUrl: audioUrl,
      duration: metadata.duration,
      fileSize: blob.size,
      timestamp: new Date().toISOString(),
      status: "sent"
    };
  }
}

export default VoiceUploadService;
