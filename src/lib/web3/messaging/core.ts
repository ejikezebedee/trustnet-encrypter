
import * as XMTP from "@xmtp/xmtp-js";
import { Wallet } from "../wallet";
import { 
  Message, 
  Conversation, 
  MessageAttachment,
  DeliveryStatus,
  TrustBadge
} from "./types";
import { MessageStatus } from "./status";
import { compressImage } from "./fileHandling";

/**
 * Checks if an Ethereum address can receive messages via XMTP
 * @param client The XMTP client
 * @param address The recipient address to check
 * @returns True if the address can receive messages
 */
export const canMessageAddress = async (
  client: XMTP.Client,
  address: string
): Promise<boolean> => {
  try {
    return await client.canMessage(address);
  } catch (error) {
    console.error("Error checking if can message address:", error);
    return false;
  }
};

/**
 * Starts a new conversation with an address
 * @param client The XMTP client
 * @param address The recipient address
 * @returns The conversation or null if cannot start
 */
export const startConversation = async (
  client: XMTP.Client,
  address: string
): Promise<XMTP.Conversation | null> => {
  try {
    if (!(await canMessageAddress(client, address))) {
      return null;
    }
    
    return await client.conversations.newConversation(address);
  } catch (error) {
    console.error("Error starting conversation:", error);
    return null;
  }
};

/**
 * Lists all conversations for the current user
 * @param client The XMTP client
 * @returns Array of conversations
 */
export const listConversations = async (
  client: XMTP.Client
): Promise<Conversation[]> => {
  try {
    const xmtpConversations = await client.conversations.list();
    
    return await Promise.all(
      xmtpConversations.map(async (conv) => {
        const messages = await loadMessages(conv);
        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          peerAddress: conv.peerAddress,
          messages: messages,
          lastMessageTime: lastMsg ? (lastMsg.sentAt || lastMsg.timestamp) : new Date(),
          unreadCount: 0, // Would need to implement read tracking
          isBlocked: false, // Would be tracked in a separate service
          isVerified: false, // Would need verification logic
          trustScore: Math.floor(Math.random() * 100), // Placeholder - would need real implementation
          trustBadge: getTrustBadgeFromScore(Math.floor(Math.random() * 100)), // Placeholder
        };
      })
    );
  } catch (error) {
    console.error("Error listing conversations:", error);
    return [];
  }
};

/**
 * Loads messages from a conversation
 * @param conversation The XMTP conversation
 * @returns Array of messages
 */
export const loadMessages = async (
  conversation: XMTP.Conversation
): Promise<Message[]> => {
  try {
    const xmtpMessages = await conversation.messages();
    
    return xmtpMessages.map((msg) => ({
      id: msg.id,
      senderAddress: msg.senderAddress,
      recipientAddress: conversation.peerAddress,
      content: msg.content as string,
      timestamp: msg.sent,
      sentAt: msg.sent,
      status: MessageStatus.DELIVERED, // Simplified for now
      attachments: [], // Would need additional parsing for attachments
    }));
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
};

/**
 * Sends a message in a conversation
 * @param conversation The XMTP conversation
 * @param content The message content
 * @returns The sent message or null if failed
 */
export const sendMessage = async (
  conversation: XMTP.Conversation,
  content: string
): Promise<Message | null> => {
  try {
    const xmtpMessage = await conversation.send(content);
    
    return {
      id: xmtpMessage.id,
      senderAddress: xmtpMessage.senderAddress,
      recipientAddress: conversation.peerAddress,
      content: xmtpMessage.content as string,
      timestamp: xmtpMessage.sent,
      sentAt: xmtpMessage.sent,
      status: MessageStatus.SENT,
      attachments: [],
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

/**
 * Sends a message with attachment
 * @param conversation The XMTP conversation
 * @param content Message content
 * @param attachments Array of attachments to send
 * @returns The sent message or null if failed
 */
export const sendMessageWithAttachments = async (
  conversation: XMTP.Conversation,
  content: string,
  attachments: File[]
): Promise<Message | null> => {
  try {
    // Process attachments (compress if needed, encode, etc.)
    const processedAttachments: MessageAttachment[] = await Promise.all(
      attachments.map(async (file, index) => {
        let processedFile = file;
        
        // Compress images if they're too large
        if (file.type.startsWith('image/') && file.size > 500000) {
          processedFile = await compressImage(file);
        }
        
        // Create attachment object
        // In a real implementation, you'd upload to IPFS or another decentralized storage
        const url = URL.createObjectURL(processedFile);
        
        return {
          id: `attachment-${Date.now()}-${index}`,
          type: file.type,
          url: url,
          name: file.name,
          size: processedFile.size,
          contentType: file.type,
        };
      })
    );
    
    // For a real implementation, you would encode the attachments within the message
    // or store them separately (like in IPFS) and include references
    const messageWithAttachments = {
      content,
      attachments: processedAttachments,
    };
    
    // Convert to string for XMTP
    const messageString = JSON.stringify(messageWithAttachments);
    
    const xmtpMessage = await conversation.send(messageString);
    
    return {
      id: xmtpMessage.id,
      senderAddress: xmtpMessage.senderAddress,
      recipientAddress: conversation.peerAddress,
      content,
      timestamp: xmtpMessage.sent,
      sentAt: xmtpMessage.sent,
      status: MessageStatus.SENT,
      attachments: processedAttachments,
    };
  } catch (error) {
    console.error("Error sending message with attachments:", error);
    return null;
  }
};

/**
 * Creates a listener for new messages in a conversation
 * @param conversation The XMTP conversation
 * @param onMessageReceived Callback for when a message is received
 * @returns A function to stop listening
 */
export const createMessageListener = async (
  conversation: XMTP.Conversation,
  onMessageReceived: (message: Message) => void
): Promise<() => void> => {
  const stream = await conversation.streamMessages();
  
  const onMessage = async (xmtpMessage: XMTP.DecodedMessage) => {
    try {
      // Check if the message contains attachments
      let content = xmtpMessage.content as string;
      let attachments: MessageAttachment[] = [];
      
      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.content && parsedContent.attachments) {
          content = parsedContent.content;
          attachments = parsedContent.attachments;
        }
      } catch (e) {
        // Not a JSON string, treat as plain text message
      }
      
      const message: Message = {
        id: xmtpMessage.id,
        senderAddress: xmtpMessage.senderAddress,
        recipientAddress: conversation.peerAddress,
        content: content,
        timestamp: xmtpMessage.sent,
        sentAt: xmtpMessage.sent,
        status: MessageStatus.DELIVERED,
        attachments: attachments,
      };
      
      onMessageReceived(message);
    } catch (error) {
      console.error("Error processing received message:", error);
    }
  };
  
  // For async iterator
  (async () => {
    try {
      for await (const message of stream) {
        await onMessage(message);
      }
    } catch (error) {
      console.error("Stream error:", error);
    }
  })();
  
  // Return a cleanup function
  return () => {
    // Stream cleanup handled automatically by async iterator
  };
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
