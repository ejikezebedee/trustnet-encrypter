
import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletSetup } from "./WalletSetup";
import { WalletUnlock } from "./WalletUnlock";
import { ConversationsList } from "./ConversationsList";
import { ChatView } from "./ChatView";
import { Conversation } from "@/lib/web3/messaging";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

export const MessagingApp: React.FC = () => {
  const { isWalletLoaded, isWalletLocked, hasWalletInStorage, offlineQueue } = useWallet();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show loading state while checking wallet status
  if (!isWalletLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading TrustNet ID...</p>
        </div>
      </div>
    );
  }

  // Show wallet setup if no wallet exists
  if (!hasWalletInStorage()) {
    return <WalletSetup />;
  }

  // Show unlock screen if wallet is locked
  if (isWalletLocked) {
    return <WalletUnlock />;
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  return (
    <div className="h-screen bg-background">
      {/* Offline indicator */}
      {!isOnline && (
        <Alert variant="destructive" className="rounded-none">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            You are offline. Messages will be sent when you're back online.
            {offlineQueue.length > 0 && (
              <span className="font-medium">
                ({offlineQueue.length} message{offlineQueue.length !== 1 ? 's' : ''} queued)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Desktop Layout */}
      <div className={`hidden lg:flex h-full ${!isOnline ? 'h-[calc(100%-40px)]' : ''}`}>
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 border-r border-border">
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedConversation={selectedConversation || undefined}
          />
        </div>

        {/* Main Content - Chat View */}
        <div className="flex-1">
          {selectedConversation ? (
            <ChatView
              conversation={selectedConversation}
              onBack={handleBackToList}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center max-w-md p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Welcome to TrustNet ID Secure Messaging
                </h3>
                <p className="text-muted-foreground mb-4">
                  Select a conversation to start messaging securely with end-to-end encryption. 
                  Your messages are private and can only be read by you and the recipient.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-center">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Privacy First</div>
                    <p className="text-muted-foreground">End-to-end encrypted messages</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Trust Based</div>
                    <p className="text-muted-foreground">See trust scores of contacts</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Share Securely</div>
                    <p className="text-muted-foreground">Send encrypted files and voice</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Works Offline</div>
                    <p className="text-muted-foreground">Messages sync when online</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className={`lg:hidden h-full ${!isOnline ? 'h-[calc(100%-40px)]' : ''}`}>
        {showMobileChat && selectedConversation ? (
          <ChatView
            conversation={selectedConversation}
            onBack={handleBackToList}
          />
        ) : (
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedConversation={selectedConversation || undefined}
          />
        )}
      </div>
    </div>
  );
};
