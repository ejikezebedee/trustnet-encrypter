import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Search, ShieldCheck, Lock, User } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress, isValidAddress } from "@/lib/web3/wallet";
import { Conversation } from "@/lib/web3/messaging";
import { useToast } from "@/hooks/use-toast";

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversation?: Conversation;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  onSelectConversation,
  selectedConversation,
}) => {
  const { conversations, loadConversations, xmtpClient, wallet, lockWallet } = useWallet();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    if (xmtpClient) {
      loadConversations();
    }
  }, [xmtpClient]);

  const filteredConversations = conversations.filter((conv) =>
    conv.peerAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartNewChat = async () => {
    if (!isValidAddress(newAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        variant: "destructive",
      });
      return;
    }

    if (!xmtpClient) {
      toast({
        title: "Not Connected",
        description: "Messaging service not connected.",
        variant: "destructive",
      });
      return;
    }

    setIsStartingChat(true);

    try {
      // Check if user can receive messages
      const canMessage = await xmtpClient.canMessage(newAddress);
      if (!canMessage) {
        toast({
          title: "Cannot Message",
          description: "This address cannot receive messages yet.",
          variant: "destructive",
        });
        return;
      }

      // Start conversation
      const conversation = await xmtpClient.conversations.newConversation(newAddress);
      
      // Create a conversation object
      const newConversation: Conversation = {
        peerAddress: newAddress,
        messages: [],
        lastMessageTime: new Date(),
        unreadCount: 0,
        isBlocked: false,
        isVerified: false,
      };

      onSelectConversation(newConversation);
      setNewAddress("");
      setShowNewChat(false);
      
      toast({
        title: "Chat Started",
        description: `Started conversation with ${formatAddress(newAddress)}`,
      });

      // Reload conversations
      loadConversations();
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Failed to Start Chat",
        description: "Could not start conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  const formatLastMessage = (conversation: Conversation): string => {
    if (conversation.messages.length === 0) {
      return "No messages yet";
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage.content.length > 50 
      ? `${lastMessage.content.substring(0, 50)}...` 
      : lastMessage.content;
    
    return lastMessage.senderAddress === wallet?.address 
      ? `You: ${preview}` 
      : preview;
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Messages</h1>
              <p className="text-sm text-muted-foreground">
                {wallet ? formatAddress(wallet.address) : ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={lockWallet}
            className="text-muted-foreground hover:text-foreground"
          >
            <Lock className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* New Chat Section */}
      {showNewChat && (
        <div className="p-4 border-b border-border bg-card">
          <div className="space-y-3">
            <Input
              placeholder="Enter Ethereum address (0x...)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleStartNewChat}
                disabled={isStartingChat || !newAddress}
                className="flex-1"
              >
                {isStartingChat ? "Starting..." : "Start Chat"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewChat(false);
                  setNewAddress("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {/* New Chat Button */}
        {!showNewChat && (
          <div className="p-4 border-b border-border">
            <Button
              variant="outline"
              onClick={() => setShowNewChat(true)}
              className="w-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Start New Chat
            </Button>
          </div>
        )}

        {/* Conversation List */}
        <div className="space-y-1 p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a new chat to begin messaging
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <Card
                key={conversation.peerAddress}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedConversation?.peerAddress === conversation.peerAddress
                    ? "bg-accent"
                    : ""
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      {conversation.isVerified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-verified rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-3 h-3 text-verified-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">
                          {formatAddress(conversation.peerAddress)}
                        </p>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {formatLastMessage(conversation)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};