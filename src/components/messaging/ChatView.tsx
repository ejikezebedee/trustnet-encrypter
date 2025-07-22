import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, ShieldCheck, User, Paperclip } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/web3/wallet";
import { Conversation, Message, sendMessage, loadMessages, createMessageListener } from "@/lib/web3/messaging";
import { useToast } from "@/hooks/use-toast";

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack }) => {
  const { xmtpClient, wallet } = useWallet();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (!xmtpClient) return;

      setIsLoading(true);
      try {
        const xmtpConversation = await xmtpClient.conversations.newConversation(
          conversation.peerAddress
        );
        const loadedMessages = await loadMessages(xmtpConversation);
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast({
          title: "Failed to Load Messages",
          description: "Could not load conversation messages.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConversationMessages();
  }, [conversation.peerAddress, xmtpClient, toast]);

  // Set up message listener
  useEffect(() => {
    if (!xmtpClient) return;

    let cleanup: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const xmtpConversation = await xmtpClient.conversations.newConversation(
          conversation.peerAddress
        );
        
        cleanup = await createMessageListener(xmtpConversation, (message) => {
          setMessages((prev) => [...prev, message]);
        });
      } catch (error) {
        console.error("Failed to set up message listener:", error);
      }
    };

    setupListener();

    return () => {
      if (cleanup) cleanup();
    };
  }, [conversation.peerAddress, xmtpClient]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !xmtpClient || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const xmtpConversation = await xmtpClient.conversations.newConversation(
        conversation.peerAddress
      );
      
      const sentMessage = await sendMessage(xmtpConversation, messageContent);
      
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
        toast({
          title: "Message Sent",
          description: "Your message has been encrypted and sent.",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
      // Restore message content on failure
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatMessageDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = message.sentAt.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="relative">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            {conversation.isVerified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-verified rounded-full flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-verified-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground truncate">
                {formatAddress(conversation.peerAddress)}
              </p>
              {conversation.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              End-to-end encrypted
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-2">Start a secure conversation</p>
              <p className="text-sm text-muted-foreground">
                Messages are end-to-end encrypted with XMTP
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
            <div key={dateKey} className="space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <p className="text-xs text-muted-foreground">
                    {formatMessageDate(new Date(dateKey))}
                  </p>
                </div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((message) => {
                const isOwnMessage = message.senderAddress === wallet?.address;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-message-sent text-message-sent-foreground"
                          : "bg-message-received text-message-received-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage
                            ? "text-message-sent-foreground/70"
                            : "text-message-received-foreground/70"
                        }`}
                      >
                        {formatMessageTime(message.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="resize-none"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🔒 Messages are end-to-end encrypted
        </p>
      </div>
    </div>
  );
};