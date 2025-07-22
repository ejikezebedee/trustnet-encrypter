import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as XMTP from "@xmtp/xmtp-js";
import { Wallet, EncryptedWallet, createWallet, decryptWallet, getWalletFromStorage, hasWalletInStorage, saveWalletToStorage, encryptWallet, createXmtpClient } from "@/lib/web3/wallet";
import { Conversation, listConversations } from "@/lib/web3/messaging";

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
  
  // Actions
  createNewWallet: (password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  lockWallet: () => void;
  loadConversations: () => Promise<void>;
  
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
          setXmtpClient(client);
          setIsXmtpConnected(true);
        } catch (err) {
          setError("Failed to connect to messaging service");
          console.error(err);
        }
      }
    };

    initXmtp();
  }, [wallet, xmtpClient]);

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
      const convs = await listConversations(xmtpClient);
      setConversations(convs);
    } catch (err) {
      setError("Failed to load conversations");
      console.error(err);
    }
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
    createNewWallet,
    unlockWallet,
    lockWallet,
    loadConversations,
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