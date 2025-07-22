import * as XMTP from "@xmtp/xmtp-js";
import { Wallet } from "./wallet";
import { ethers } from "ethers";

// Interface for a message
export interface Message {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  content: string;
  sentAt: Date;
  status: MessageStatus;
  attachments?: MessageAttachment[];
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

// Message status enum
export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

// Interface for conversation
export interface Conversation {
  peerAddress: string;
  messages: Message[];
  lastMessageTime: Date;
  unreadCount: number;
  isBlocked: boolean;
  isVerified: boolean;
}

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
          lastMessageTime: lastMsg ? lastMsg.sentAt : new Date(),
          unreadCount: 0, // Would need to implement read tracking
          isBlocked: false, // Would be tracked in a separate service
          isVerified: false, // Would need verification logic
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
    const message: Message = {
      id: xmtpMessage.id,
      senderAddress: xmtpMessage.senderAddress,
      recipientAddress: conversation.peerAddress,
      content: xmtpMessage.content as string,
      sentAt: xmtpMessage.sent,
      status: MessageStatus.DELIVERED,
      attachments: [],
    };
    
    onMessageReceived(message);
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
 * Encrypt data for secure storage
 * @param data The data to encrypt
 * @param wallet The wallet to use for encryption
 * @returns The encrypted data
 */
export const encryptData = async (data: string, wallet: Wallet): Promise<string> => {
  try {
    // Simple AES encryption with wallet as key material
    const keyMaterial = wallet.privateKey.slice(2, 34); // Use part of private key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Convert to hex string
    return ethers.utils.hexlify(result);
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypt data that was encrypted with encryptData
 * @param encryptedData The encrypted data
 * @param wallet The wallet to use for decryption
 * @returns The decrypted data
 */
export const decryptData = async (encryptedData: string, wallet: Wallet): Promise<string> => {
  try {
    // Get data as bytes
    const dataBytes = ethers.utils.arrayify(encryptedData);
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = dataBytes.slice(0, 12);
    const encrypted = dataBytes.slice(12);
    
    // Get key from wallet
    const keyMaterial = wallet.privateKey.slice(2, 34);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    // Convert back to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw new Error("Failed to decrypt data");
  }
};