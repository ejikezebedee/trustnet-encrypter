
// Firebase-based messaging implementation
import { 
  sendMessage as firebaseSendMessage,
  loadMessages as firebaseLoadMessages,
  getUserConversations,
  listenToMessages,
  createOrGetConversation,
  markMessageAsRead as firebaseMarkMessageAsRead,
  blockUser
} from "@/lib/messaging/firebase";
import { 
  Message, 
  Conversation, 
  MessageAttachment,
  TrustBadge
} from "./types";
import { MessageStatus } from "./status";
import { compressImage } from "./fileHandling";

/**
 * Checks if an address can receive messages (always true for Firebase implementation)
 * @param userAddress The current user's address
 * @param address The recipient address to check
 * @returns True if the address can receive messages
 */
export const canMessageAddress = async (
  userAddress: string,
  address: string
): Promise<boolean> => {
  // In Firebase implementation, any valid address can receive messages
  return true;
};

/**
 * Starts a new conversation with an address
 * @param senderAddress The sender's address
 * @param recipientAddress The recipient address
 * @returns The conversation ID or null if cannot start
 */
export const startConversation = async (
  senderAddress: string,
  recipientAddress: string
): Promise<string | null> => {
  try {
    const conversationId = await createOrGetConversation(senderAddress, recipientAddress);
    return conversationId;
  } catch (error) {
    console.error("Error starting conversation:", error);
    return null;
  }
};

/**
 * Lists all conversations for the current user
 * @param userAddress The user's address
 * @returns Array of conversations
 */
export const listConversations = async (
  userAddress: string
): Promise<Conversation[]> => {
  try {
    return await getUserConversations(userAddress);
  } catch (error) {
    console.error("Error listing conversations:", error);
    return [];
  }
};

/**
 * Loads messages from a conversation
 * @param conversationId The conversation ID
 * @param userAddress The user's address
 * @returns Array of messages
 */
export const loadMessages = async (
  conversationId: string,
  userAddress: string
): Promise<Message[]> => {
  try {
    return await firebaseLoadMessages(conversationId, userAddress);
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
};

/**
 * Sends a message in a conversation
 * @param senderAddress The sender's address
 * @param recipientAddress The recipient's address
 * @param content The message content
 * @returns The sent message or null if failed
 */
export const sendMessage = async (
  senderAddress: string,
  recipientAddress: string,
  content: string
): Promise<Message | null> => {
  try {
    return await firebaseSendMessage(senderAddress, recipientAddress, content);
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

/**
 * Sends a message with attachment
 * @param senderAddress The sender's address
 * @param recipientAddress The recipient's address
 * @param content Message content
 * @param attachments Array of attachments to send
 * @returns The sent message or null if failed
 */
export const sendMessageWithAttachments = async (
  senderAddress: string,
  recipientAddress: string,
  content: string,
  attachments: File[]
): Promise<Message | null> => {
  try {
    // Process attachments (compress if needed)
    const processedAttachments: File[] = await Promise.all(
      attachments.map(async (file) => {
        // Compress images if they're too large
        if (file.type.startsWith('image/') && file.size > 500000) {
          return await compressImage(file);
        }
        return file;
      })
    );
    
    return await firebaseSendMessage(senderAddress, recipientAddress, content, processedAttachments);
  } catch (error) {
    console.error("Error sending message with attachments:", error);
    return null;
  }
};

/**
 * Creates a listener for new messages in a conversation
 * @param conversationId The conversation ID
 * @param userAddress The user's address
 * @param onMessageReceived Callback for when a message is received
 * @returns A function to stop listening
 */
export const createMessageListener = (
  conversationId: string,
  userAddress: string,
  onMessageReceived: (message: Message) => void
): (() => void) => {
  return listenToMessages(conversationId, userAddress, onMessageReceived);
};

/**
 * Get trust badge based on trust score
 * @param score The trust score (0-100)
 * @returns The appropriate trust badge
 */
export const getTrustBadgeFromScore = (score: number): TrustBadge => {
  if (score >= 90) return "legend";
  if (score >= 75) return "gold";
  if (score >= 50) return "silver";
  if (score >= 25) return "bronze";
  return "none";
};

/**
 * Determine if a user can initiate a conversation based on trust settings
 * @param senderScore Trust score of the sender (0-100)
 * @param recipientPreferences Messaging preferences of the recipient
 * @returns Whether the sender can message the recipient
 */
export const canInitiateConversation = (
  senderScore: number,
  recipientPreferences: { allowMessagesFrom: 'everyone' | 'trusted', trustScoreThreshold: number }
): boolean => {
  if (recipientPreferences.allowMessagesFrom === 'everyone') {
    return true;
  }
  
  return senderScore >= recipientPreferences.trustScoreThreshold;
};

/**
 * Mark a message as read
 * @param message The message to mark as read
 * @returns The updated message
 */
export const markMessageAsRead = (message: Message): Message => {
  if (message.status !== MessageStatus.READ) {
    return {
      ...message,
      status: MessageStatus.READ,
      readAt: new Date()
    };
  }
  return message;
};

/**
 * Updates all unread messages in a conversation to read status
 * @param conversation The conversation to update
 * @returns The updated conversation
 */
export const markConversationAsRead = (conversation: Conversation): Conversation => {
  const updatedMessages = conversation.messages.map(message => {
    if (message.status !== MessageStatus.READ && 
        message.senderAddress !== conversation.peerAddress) {
      return markMessageAsRead(message);
    }
    return message;
  });
  
  return {
    ...conversation,
    messages: updatedMessages,
    unreadCount: 0
  };
};
