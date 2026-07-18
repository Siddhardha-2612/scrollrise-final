import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceMessageMetadata } from '../types/voice';
import { VoiceUploadService } from '../services/voiceUploadService';

export function useVoiceUploader(
  onUploadSuccess?: (metadata: VoiceMessageMetadata) => void,
  onUploadFailed?: (messageId: string, error: string) => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [id: string]: number }>({});

  const uploadVoiceMessage = useCallback(async (
    blob: Blob,
    duration: number,
    senderId: string,
    receiverId: string,
    providedMessageId?: string
  ) => {
    const messageId = providedMessageId || "vm_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    setIsUploading(true);
    try {
      const result = await VoiceUploadService.uploadOriginalBlob(
        blob,
        {
          messageId,
          senderId,
          receiverId,
          duration
        },
        (prog) => {
          setUploadProgress(prev => ({
            ...prev,
            [messageId]: prog.percent
          }));
        }
      );

      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      return messageId;
    } catch (err: any) {
      console.error(`[useVoiceUploader] Upload failed for ${messageId}:`, err);
      if (onUploadFailed) {
        onUploadFailed(messageId, err.message || "Failed to upload voice message");
      }
      return messageId;
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess, onUploadFailed]);

  return {
    isUploading,
    uploadProgress,
    uploadVoiceMessage,
  };
}

export default useVoiceUploader;
