import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletSetup } from "./WalletSetup";
import { WalletUnlock } from "./WalletUnlock";
import { ConversationsList } from "./ConversationsList";
import { ChatView } from "./ChatView";
import { Conversation } from "@/lib/web3/messaging";

export const MessagingApp: React.FC = () => {
  const { isWalletLoaded, isWalletLocked, hasWalletInStorage } = useWallet();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

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
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
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
              <div className="text-center">
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
                  Welcome to TrustNet ID
                </h3>
                <p className="text-muted-foreground">
                  Select a conversation to start messaging securely
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full">
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