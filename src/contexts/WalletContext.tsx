
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as XMTP from "@xmtp/xmtp-js";
import { 
  Wallet, 
  EncryptedWallet, 
  createWallet, 
  decryptWallet, 
  getWalletFromStorage, 
  hasWalletInStorage, 
  saveWalletToStorage, 
  encryptWallet, 
  createXmtpClient 
} from "@/lib/web3/wallet";
import { 
  Conversation, 
  listConversations, 
  MessageStatus,
  MessagingPreferences,
  DEFAULT_MESSAGING_PREFERENCES
} from "@/lib/web3/messaging/index";

interface WalletContextType {
  // Wallet state
  wallet: Wallet | null;
  isWalletLoaded: boolean;
  isWalletLocked: boolean;
  hasWalletInStorage: () => boolean;
  
  // XMTP client
  xmtpClient: XMTP.Client | null;
  isXmtpConnected: boolean;
  
  // Conversations
  conversations: Conversation[];
  
  // Messaging preferences
  messagingPreferences: MessagingPreferences;
  updateMessagingPreferences: (preferences: Partial<MessagingPreferences>) => void;
  
  // User data
  blockedUsers: string[];
  reportedUsers: string[];
  
  // Actions
  createNewWallet: (password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  lockWallet: () => void;
  loadConversations: () => Promise<void>;
  blockUser: (address: string) => void;
  unblockUser: (address: string) => void;
  reportUser: (address: string, reason: string) => void;
  
  // Offline queue
  offlineQueue: {
    address: string;
    content: string;
    attachments?: File[];
    timestamp: number;
  }[];
  addToOfflineQueue: (address: string, content: string, attachments?: File[]) => void;
  clearOfflineQueue: () => void;
  
  // Errors
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isWalletLoaded, setIsWalletLoaded] = useState(false);
  const [isWalletLocked, setIsWalletLocked] = useState(true);
  const [xmtpClient, setXmtpClient] = useState<XMTP.Client | null>(null);
  const [isXmtpConnected, setIsXmtpConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagingPreferences, setMessagingPreferences] = useState<MessagingPreferences>(DEFAULT_MESSAGING_PREFERENCES);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reportedUsers, setReportedUsers] = useState<string[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<{
    address: string;
    content: string;
    attachments?: File[];
    timestamp: number;
  }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet exists on mount
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const hasWallet = hasWalletInStorage();
        setIsWalletLocked(hasWallet);
        setIsWalletLoaded(true);
      } catch (err) {
        setError("Failed to check wallet status");
        console.error(err);
      }
    };

    checkWallet();
  }, []);

  // Initialize XMTP client when wallet is unlocked
  useEffect(() => {
    const initXmtp = async () => {
      if (wallet && !xmtpClient) {
        try {
          const client = await createXmtpClient(wallet);
          if (client) {
            setXmtpClient(client);
            setIsXmtpConnected(true);
          } else {
            // Messaging temporarily disabled
            setIsXmtpConnected(false);
          }
        } catch (err) {
          setError("Failed to connect to messaging service");
          console.error(err);
        }
      }
    };

    initXmtp();
  }, [wallet, xmtpClient]);

  // Load saved preferences and blocked users
  useEffect(() => {
    if (wallet) {
      try {
        // Load messaging preferences
        const savedPreferences = localStorage.getItem(`trustnet-messaging-prefs-${wallet.address}`);
        if (savedPreferences) {
          setMessagingPreferences(JSON.parse(savedPreferences));
        }
        
        // Load blocked users
        const savedBlockedUsers = localStorage.getItem(`trustnet-blocked-users-${wallet.address}`);
        if (savedBlockedUsers) {
          setBlockedUsers(JSON.parse(savedBlockedUsers));
        }
        
        // Load reported users
        const savedReportedUsers = localStorage.getItem(`trustnet-reported-users-${wallet.address}`);
        if (savedReportedUsers) {
          setReportedUsers(JSON.parse(savedReportedUsers));
        }
        
        // Load offline queue
        const savedOfflineQueue = localStorage.getItem(`trustnet-offline-queue-${wallet.address}`);
        if (savedOfflineQueue) {
          // Note: We can't directly restore File objects from localStorage
          // This is just a placeholder. In a real app, you'd need a more sophisticated approach
          setOfflineQueue(JSON.parse(savedOfflineQueue));
        }
      } catch (err) {
        console.error("Failed to load saved preferences:", err);
      }
    }
  }, [wallet]);

  const createNewWallet = async (password: string): Promise<void> => {
    try {
      setError(null);
      
      // Create new wallet
      const newWallet = createWallet();
      
      // Encrypt and save wallet
      const encryptedWallet = await encryptWallet(newWallet, password);
      saveWalletToStorage(encryptedWallet);
      
      // Set wallet as unlocked
      setWallet(newWallet);
      setIsWalletLocked(false);
      
      // Initialize with default preferences
      setMessagingPreferences(DEFAULT_MESSAGING_PREFERENCES);
      localStorage.setItem(
        `trustnet-messaging-prefs-${newWallet.address}`,
        JSON.stringify(DEFAULT_MESSAGING_PREFERENCES)
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create wallet";
      setError(errorMessage);
      throw err;
    }
  };

  const unlockWallet = async (password: string): Promise<boolean> => {
    try {
      setError(null);
      
      const encryptedWallet = getWalletFromStorage();
      if (!encryptedWallet) {
        setError("No wallet found");
        return false;
      }
      
      const decryptedWallet = await decryptWallet(encryptedWallet, password);
      setWallet(decryptedWallet);
      setIsWalletLocked(false);
      
      return true;
    } catch (err) {
      setError("Invalid password");
      return false;
    }
  };

  const lockWallet = (): void => {
    setWallet(null);
    setIsWalletLocked(true);
    setXmtpClient(null);
    setIsXmtpConnected(false);
    setConversations([]);
  };

  const loadConversations = async (): Promise<void> => {
    if (!xmtpClient) {
      setError("Messaging service not connected");
      return;
    }

    try {
      setError(null);
      let convs = await listConversations(xmtpClient);
      
      // Apply blocked users filter
      convs = convs.map(conv => ({
        ...conv,
        isBlocked: blockedUsers.includes(conv.peerAddress)
      }));
      
      setConversations(convs);
    } catch (err) {
      setError("Failed to load conversations");
      console.error(err);
    }
  };

  const updateMessagingPreferences = (preferences: Partial<MessagingPreferences>): void => {
    if (!wallet) return;
    
    const updatedPreferences = { ...messagingPreferences, ...preferences };
    setMessagingPreferences(updatedPreferences);
    
    // Save to localStorage
    localStorage.setItem(
      `trustnet-messaging-prefs-${wallet.address}`,
      JSON.stringify(updatedPreferences)
    );
  };

  const blockUser = (address: string): void => {
    if (!wallet || blockedUsers.includes(address)) return;
    
    const updatedBlockedUsers = [...blockedUsers, address];
    setBlockedUsers(updatedBlockedUsers);
    
    // Update conversations to reflect blocked status
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.peerAddress === address 
          ? { ...conv, isBlocked: true } 
          : conv
      )
    );
    
    // Save to localStorage
    localStorage.setItem(
      `trustnet-blocked-users-${wallet.address}`,
      JSON.stringify(updatedBlockedUsers)
    );
  };

  const unblockUser = (address: string): void => {
    if (!wallet) return;
    
    const updatedBlockedUsers = blockedUsers.filter(user => user !== address);
    setBlockedUsers(updatedBlockedUsers);
    
    // Update conversations to reflect unblocked status
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.peerAddress === address 
          ? { ...conv, isBlocked: false } 
          : conv
      )
    );
    
    // Save to localStorage
    localStorage.setItem(
      `trustnet-blocked-users-${wallet.address}`,
      JSON.stringify(updatedBlockedUsers)
    );
  };

  const reportUser = (address: string, reason: string): void => {
    if (!wallet) return;
    
    const reportInfo = {
      address,
      reason,
      timestamp: Date.now(),
      reporterAddress: wallet.address
    };
    
    const updatedReportedUsers = [...reportedUsers, address];
    setReportedUsers(updatedReportedUsers);
    
    // Save to localStorage
    localStorage.setItem(
      `trustnet-reported-users-${wallet.address}`,
      JSON.stringify(updatedReportedUsers)
    );
    
    // In a real app, you would send this report to your backend
    console.log("User reported:", reportInfo);
  };

  const addToOfflineQueue = (address: string, content: string, attachments?: File[]): void => {
    if (!wallet) return;
    
    const queueItem = {
      address,
      content,
      attachments,
      timestamp: Date.now()
    };
    
    const updatedQueue = [...offlineQueue, queueItem];
    setOfflineQueue(updatedQueue);
    
    // In a real app, you would have a more sophisticated way to store the queue
    // including the file attachments which can't be directly stored in localStorage
    try {
      // Store queue without attachments
      const queueForStorage = updatedQueue.map(item => ({
        address: item.address,
        content: item.content,
        timestamp: item.timestamp,
        hasAttachments: !!item.attachments?.length
      }));
      
      localStorage.setItem(
        `trustnet-offline-queue-${wallet.address}`,
        JSON.stringify(queueForStorage)
      );
    } catch (err) {
      console.error("Failed to save offline queue:", err);
    }
  };

  const clearOfflineQueue = (): void => {
    if (!wallet) return;
    
    setOfflineQueue([]);
    localStorage.removeItem(`trustnet-offline-queue-${wallet.address}`);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: WalletContextType = {
    wallet,
    isWalletLoaded,
    isWalletLocked,
    hasWalletInStorage,
    xmtpClient,
    isXmtpConnected,
    conversations,
    messagingPreferences,
    updateMessagingPreferences,
    blockedUsers,
    reportedUsers,
    createNewWallet,
    unlockWallet,
    lockWallet,
    loadConversations,
    blockUser,
    unblockUser,
    reportUser,
    offlineQueue,
    addToOfflineQueue,
    clearOfflineQueue,
    error,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
