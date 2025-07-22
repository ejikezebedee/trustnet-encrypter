import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  getDocs,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { encryptMessage, decryptMessage, generateSharedKey, encryptFile } from './encryption';
import { Message, Conversation, MessageAttachment } from '@/lib/web3/messaging/types';
import { MessageStatus } from '@/lib/web3/messaging/status';

export interface FirebaseMessage {
  id: string;
  conversationId: string;
  senderAddress: string;
  recipientAddress: string;
  encryptedContent: string;
  timestamp: Timestamp;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  readAt?: Timestamp;
  isDeleted?: boolean;
}

export interface FirebaseConversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime: Timestamp;
  createdAt: Timestamp;
  isBlocked?: boolean;
}

/**
 * Generates a conversation ID from two participant addresses
 */
export const generateConversationId = (address1: string, address2: string): string => {
  const sortedAddresses = [address1, address2].sort();
  return sortedAddresses.join('_');
};

/**
 * Creates or gets an existing conversation
 */
export const createOrGetConversation = async (
  senderAddress: string, 
  recipientAddress: string
): Promise<string> => {
  const conversationId = generateConversationId(senderAddress, recipientAddress);
  
  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('id', '==', conversationId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return conversationId;
    }
    
    // Create new conversation
    const conversationData: Omit<FirebaseConversation, 'id'> = {
      participants: [senderAddress, recipientAddress],
      lastMessageTime: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      isBlocked: false
    };
    
    await addDoc(conversationsRef, { ...conversationData, id: conversationId });
    return conversationId;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }
};

/**
 * Sends a message to a conversation
 */
export const sendMessage = async (
  senderAddress: string,
  recipientAddress: string,
  content: string,
  attachments: File[] = []
): Promise<Message> => {
  try {
    const conversationId = await createOrGetConversation(senderAddress, recipientAddress);
    const sharedKey = generateSharedKey(senderAddress, recipientAddress);
    const encryptedContent = encryptMessage(content, sharedKey);
    
    // Process attachments
    const processedAttachments: MessageAttachment[] = [];
    for (const file of attachments) {
      const attachmentId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageRef = ref(storage, `attachments/${conversationId}/${attachmentId}`);
      
      // Encrypt file before upload
      const encryptedFileData = await encryptFile(file, sharedKey);
      const encryptedBlob = new Blob([encryptedFileData], { type: 'application/octet-stream' });
      
      const uploadResult = await uploadBytes(storageRef, encryptedBlob);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      processedAttachments.push({
        id: attachmentId,
        type: file.type,
        url: downloadURL,
        name: file.name,
        size: file.size,
        contentType: file.type
      });
    }
    
    // Add message to Firestore
    const messagesRef = collection(db, 'messages');
    const messageData: Omit<FirebaseMessage, 'id'> = {
      conversationId,
      senderAddress,
      recipientAddress,
      encryptedContent,
      timestamp: serverTimestamp() as Timestamp,
      status: MessageStatus.SENT,
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update conversation's last message
    const conversationsRef = collection(db, 'conversations');
    const conversationQuery = query(conversationsRef, where('id', '==', conversationId));
    const conversationSnapshot = await getDocs(conversationQuery);
    
    if (!conversationSnapshot.empty) {
      const conversationDoc = conversationSnapshot.docs[0];
      await updateDoc(conversationDoc.ref, {
        lastMessage: encryptedContent.substring(0, 100) + '...',
        lastMessageTime: serverTimestamp()
      });
    }
    
    // Return decrypted message for local display
    return {
      id: docRef.id,
      senderAddress,
      recipientAddress,
      content,
      timestamp: new Date(),
      sentAt: new Date(),
      status: MessageStatus.SENT,
      attachments: processedAttachments
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

/**
 * Sends a message with attachments (alias for sendMessage)
 */
export const sendMessageWithAttachments = async (
  senderAddress: string,
  recipientAddress: string,
  content: string,
  attachments: File[]
): Promise<Message> => {
  return sendMessage(senderAddress, recipientAddress, content, attachments);
};

/**
 * Loads messages for a conversation
 */
export const loadMessages = async (
  conversationId: string,
  userAddress: string,
  lastMessage?: string
): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, 'messages');
    let q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    if (lastMessage) {
      // Pagination support
      q = query(q, startAfter(lastMessage));
    }
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    // Determine the other participant to generate shared key
    const [address1, address2] = conversationId.split('_');
    const otherAddress = address1 === userAddress ? address2 : address1;
    const sharedKey = generateSharedKey(userAddress, otherAddress);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseMessage;
      try {
        const decryptedContent = decryptMessage(data.encryptedContent, sharedKey);
        
        messages.push({
          id: doc.id,
          senderAddress: data.senderAddress,
          recipientAddress: data.recipientAddress,
          content: decryptedContent,
          timestamp: data.timestamp.toDate(),
          sentAt: data.timestamp.toDate(),
          status: data.status,
          attachments: data.attachments,
          readAt: data.readAt?.toDate()
        });
      } catch (error) {
        console.error('Error decrypting message:', error);
        // Skip messages that can't be decrypted
      }
    });
    
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

/**
 * Sets up a real-time listener for new messages
 */
export const listenToMessages = (
  conversationId: string,
  userAddress: string,
  onNewMessage: (message: Message) => void
): (() => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  
  // Determine the other participant to generate shared key
  const [address1, address2] = conversationId.split('_');
  const otherAddress = address1 === userAddress ? address2 : address1;
  const sharedKey = generateSharedKey(userAddress, otherAddress);
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as FirebaseMessage;
        try {
          const decryptedContent = decryptMessage(data.encryptedContent, sharedKey);
          
          const message: Message = {
            id: change.doc.id,
            senderAddress: data.senderAddress,
            recipientAddress: data.recipientAddress,
            content: decryptedContent,
            timestamp: data.timestamp.toDate(),
            sentAt: data.timestamp.toDate(),
            status: data.status,
            attachments: data.attachments,
            readAt: data.readAt?.toDate()
          };
          
          onNewMessage(message);
        } catch (error) {
          console.error('Error decrypting real-time message:', error);
        }
      }
    });
  });
};

/**
 * Creates a message listener (alias for listenToMessages)
 */
export const createMessageListener = listenToMessages;

/**
 * Gets all conversations for a user
 */
export const getUserConversations = async (userAddress: string): Promise<Conversation[]> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userAddress),
      orderBy('lastMessageTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as FirebaseConversation;
      const otherParticipant = data.participants.find(p => p !== userAddress);
      
      if (otherParticipant) {
        // Load recent messages for the conversation
        const messages = await loadMessages(data.id, userAddress);
        const lastMessage = messages[messages.length - 1];
        
        conversations.push({
          peerAddress: otherParticipant,
          messages,
          lastMessageTime: data.lastMessageTime.toDate(),
          unreadCount: 0, // Would need to implement read tracking
          isBlocked: data.isBlocked || false,
          isVerified: false, // Would be implemented separately
          trustScore: Math.floor(Math.random() * 100), // Placeholder
          trustBadge: getTrustBadgeFromScore(Math.floor(Math.random() * 100)) // Placeholder
        });
      }
    }
    
    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
};

/**
 * Marks a message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      status: MessageStatus.READ,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Blocks a user in a conversation
 */
export const blockUser = async (userAddress: string, blockedAddress: string): Promise<void> => {
  try {
    const conversationId = generateConversationId(userAddress, blockedAddress);
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('id', '==', conversationId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const conversationDoc = querySnapshot.docs[0];
      await updateDoc(conversationDoc.ref, {
        isBlocked: true
      });
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw new Error('Failed to block user');
  }
};

// Helper function to get trust badge from score (imported from original messaging)
const getTrustBadgeFromScore = (score: number) => {
  if (score >= 90) return "legend";
  if (score >= 75) return "gold";
  if (score >= 50) return "silver";
  if (score >= 25) return "bronze";
  return "none";
};