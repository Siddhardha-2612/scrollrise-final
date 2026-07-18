export interface VoiceMessageMetadata {
  messageId: string;
  senderId: string;
  receiverId: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  timestamp: number | string;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  mimeType: string;
}
