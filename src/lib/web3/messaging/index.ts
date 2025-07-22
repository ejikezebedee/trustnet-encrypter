
// Re-export all messaging components for easier imports
export * from './types';
export * from './status';
export * from './core';
export * from './fileHandling';
export * from './encryption';

// Re-export specific functions with clear names
export { 
  sendMessageWithAttachments,
  markMessageAsRead,
  canInitiateConversation,
  getTrustBadgeFromScore,
  markConversationAsRead 
} from './core';

export { 
  validateFile, 
  getFileTypeCategory,
  compressImage,
  processVoiceRecording,
  generatePreviewUrl 
} from './fileHandling';

export { 
  getTypingIndicatorText,
  getMessageStatusText 
} from './status';
