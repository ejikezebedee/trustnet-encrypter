
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  ShieldCheck, 
  Lock, 
  User, 
  Settings,
  Clock,
  AlertTriangle,
  Ban,
  Bell,
  BellOff
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress, isValidAddress } from "@/lib/web3/wallet";
import { Conversation, canInitiateConversation, TrustBadge, getTrustBadgeFromScore } from "@/lib/web3/messaging";
import { useToast } from "@/hooks/use-toast";
import { UserTrustIndicator } from "./UserTrustIndicator";
import { PrivacySettings } from "./PrivacySettings";

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversation?: Conversation;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  onSelectConversation,
  selectedConversation,
}) => {
  const { 
    conversations, 
    loadConversations, 
    xmtpClient, 
    wallet, 
    lockWallet,
    messagingPreferences,
    blockedUsers
  } = useWallet();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (xmtpClient) {
      loadConversations();
    }
  }, [xmtpClient, loadConversations]);

  // Filter conversations based on search and blocked status
  const filteredConversations = conversations
    .filter((conv) => 
      conv.peerAddress.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by last message time (newest first)
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    });

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
      
      // Generate a random trust score for demo purposes
      // In a real app, this would come from a trust scoring service
      const randomTrustScore = Math.floor(Math.random() * 100);
      
      // Check if user meets trust threshold
      if (!canInitiateConversation(randomTrustScore, messagingPreferences)) {
        toast({
          title: "Trust Score Too Low",
          description: `This user's trust score (${randomTrustScore}) is below your threshold (${messagingPreferences.trustScoreThreshold}).`,
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
        isBlocked: blockedUsers.includes(newAddress),
        isVerified: Math.random() > 0.7, // Random for demo
        trustScore: randomTrustScore,
        trustBadge: getTrustBadgeFromScore(randomTrustScore) as TrustBadge,
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


  if (showSettings) {
    return <PrivacySettings onBack={() => setShowSettings(false)} />;
  }

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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={lockWallet}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <Lock className="w-4 h-4" />
            </Button>
          </div>
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

        {/* Messaging preferences info */}
        <div className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <div className="flex items-center gap-1">
              {messagingPreferences.allowMessagesFrom === "everyone" ? (
                <Bell className="w-3 h-3" />
              ) : (
                <BellOff className="w-3 h-3" />
              )}
              <span>
                {messagingPreferences.allowMessagesFrom === "everyone"
                  ? "All messages allowed"
                  : `Trust threshold: ${messagingPreferences.trustScoreThreshold}+`}
              </span>
            </div>
          </div>
        </div>

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
                } ${conversation.isBlocked ? "opacity-60" : ""}`}
                onClick={() => onSelectConversation(conversation)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        {conversation.profilePhoto ? (
                          <img 
                            src={conversation.profilePhoto} 
                            alt={formatAddress(conversation.peerAddress)}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {conversation.isVerified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-verified rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-3 h-3 text-verified-foreground" />
                        </div>
                      )}
                      {conversation.isBlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                          <Ban className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-foreground truncate">
                            {formatAddress(conversation.peerAddress)}
                          </p>
                          <UserTrustIndicator 
                            trustScore={conversation.trustScore || 0}
                            trustBadge={conversation.trustBadge}
                            isVerified={conversation.isVerified}
                            size="sm"
                            language={messagingPreferences.language}
                          />
                        </div>
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
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {formatLastMessage(conversation)}
                        </p>
                        {/* Offline indicator for messages that weren't sent */}
                        {conversation.messages.length > 0 && 
                          conversation.messages[conversation.messages.length - 1].isOfflineQueued && (
                          <Clock className="w-3 h-3 text-warning flex-shrink-0" />
                        )}
                      </div>
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
