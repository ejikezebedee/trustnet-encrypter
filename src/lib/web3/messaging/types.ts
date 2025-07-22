
import { MessageStatus } from "./status";

// Interface for a message
export interface Message {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  content: string;
  sentAt: Date;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  isOfflineQueued?: boolean;
  readAt?: Date;
}

// Interface for message attachment
export interface MessageAttachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
  ipfsHash?: string;
}

// Interface for conversation
export interface Conversation {
  peerAddress: string;
  messages: Message[];
  lastMessageTime: Date;
  unreadCount: number;
  isBlocked: boolean;
  isVerified: boolean;
  trustScore?: number;
  trustBadge?: TrustBadge;
  profilePhoto?: string;
  isTyping?: boolean;
}

// Trust badge levels
export enum TrustBadge {
  NONE = "none",
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  LEGEND = "legend"
}

// Message delivery status
export enum DeliveryStatus {
  QUEUED = "queued",
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed"
}

// User messaging preferences
export interface MessagingPreferences {
  allowMessagesFrom: "everyone" | "trusted";
  trustScoreThreshold: number;
  showReadReceipts: boolean;
  showTypingStatus: boolean;
  backupMessages: boolean;
  language: "en" | "es" | "ig" | "sw" | "hi";
}

// Default messaging preferences
export const DEFAULT_MESSAGING_PREFERENCES: MessagingPreferences = {
  allowMessagesFrom: "trusted",
  trustScoreThreshold: 50,
  showReadReceipts: true,
  showTypingStatus: true,
  backupMessages: false,
  language: "en"
};
