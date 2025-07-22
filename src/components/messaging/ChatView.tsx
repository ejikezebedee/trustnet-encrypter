
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Send, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Paperclip, 
  Image as ImageIcon,
  Mic, 
  FileText,
  Settings,
  X,
  Check,
  Clock
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { formatAddress } from "@/lib/web3/wallet";
import { 
  Conversation, 
  Message, 
  MessageStatus, 
  sendMessage, 
  loadMessages, 
  createMessageListener, 
  sendMessageWithAttachments,
  markMessageAsRead,
  validateFile,
  getTypingIndicatorText
} from "@/lib/web3/messaging";
import { useToast } from "@/hooks/use-toast";
import { UserTrustIndicator } from "./UserTrustIndicator";
import { UserActions } from "./UserActions";
import { RecordVoiceMessage } from "./RecordVoiceMessage";
import { FileAttachmentPreview } from "./FileAttachmentPreview";
import { MessageMediaTab } from "./MessageMediaTab";
import { PrivacySettings } from "./PrivacySettings";

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack }) => {
  const { xmtpClient, wallet, messagingPreferences, offlineQueue, addToOfflineQueue, clearOfflineQueue } = useWallet();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

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
        
        // Update messages with read status if read receipts are enabled
        const updatedMessages = loadedMessages.map(msg => {
          if (msg.senderAddress !== wallet?.address && messagingPreferences.showReadReceipts) {
            return markMessageAsRead(msg);
          }
          return msg;
        });
        
        setMessages(updatedMessages);
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
  }, [conversation.peerAddress, xmtpClient, toast, wallet?.address, messagingPreferences.showReadReceipts]);

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
          // If message is from the other person and read receipts are enabled, mark as read
          const updatedMessage = 
            message.senderAddress !== wallet?.address && messagingPreferences.showReadReceipts
              ? markMessageAsRead(message)
              : message;
              
          setMessages((prev) => [...prev, updatedMessage]);
        });
      } catch (error) {
        console.error("Failed to set up message listener:", error);
      }
    };

    setupListener();

    return () => {
      if (cleanup) cleanup();
    };
  }, [conversation.peerAddress, xmtpClient, wallet?.address, messagingPreferences.showReadReceipts]);

  // Handle typing status
  useEffect(() => {
    if (newMessage.length > 0 && messagingPreferences.showTypingStatus) {
      // Send typing indicator (would be implemented in real application)
      setIsTyping(true);
      
      // Clear previous timeout if exists
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to clear typing status after 3 seconds
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
      
      setTypingTimeout(timeout);
    }
    
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [newMessage, messagingPreferences.showTypingStatus]);

  // Process offline queue when connection is restored
  useEffect(() => {
    const processOfflineQueue = async () => {
      if (!xmtpClient || offlineQueue.length === 0) return;
      
      const conversationQueue = offlineQueue.filter(
        item => item.address === conversation.peerAddress
      );
      
      if (conversationQueue.length === 0) return;
      
      for (const item of conversationQueue) {
        try {
          const xmtpConversation = await xmtpClient.conversations.newConversation(
            item.address
          );
          
          if (item.attachments && item.attachments.length > 0) {
            await sendMessageWithAttachments(xmtpConversation, item.content, item.attachments);
          } else {
            await sendMessage(xmtpConversation, item.content);
          }
        } catch (error) {
          console.error("Failed to send queued message:", error);
        }
      }
      
      // Clear processed messages from queue
      clearOfflineQueue();
    };
    
    processOfflineQueue();
  }, [xmtpClient, offlineQueue, conversation.peerAddress, clearOfflineQueue]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !xmtpClient || isSending) return;
    
    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");
    
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);
    
    // Check if device is offline
    if (!navigator.onLine) {
      // Add to offline queue
      addToOfflineQueue(conversation.peerAddress, messageContent, filesToSend);
      
      // Show as pending in the UI
      const offlineMessage: Message = {
        id: `offline-${Date.now()}`,
        senderAddress: wallet?.address || "",
        recipientAddress: conversation.peerAddress,
        content: messageContent,
        timestamp: new Date(),
        sentAt: new Date(),
        status: MessageStatus.QUEUED,
        attachments: filesToSend.map((file, index) => ({
          id: `offline-attachment-${Date.now()}-${index}`,
          type: file.type,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          contentType: file.type,
        })),
        isOfflineQueued: true,
      };
      
      setMessages((prev) => [...prev, offlineMessage]);
      setIsSending(false);
      
      toast({
        title: "Message Queued",
        description: "Your message will be sent when you're back online.",
      });
      
      return;
    }

    try {
      const xmtpConversation = await xmtpClient.conversations.newConversation(
        conversation.peerAddress
      );
      
      let sentMessage: Message | null;
      
      if (filesToSend.length > 0) {
        sentMessage = await sendMessageWithAttachments(
          xmtpConversation, 
          messageContent, 
          filesToSend
        );
      } else {
        sentMessage = await sendMessage(xmtpConversation, messageContent);
      }
      
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
      setSelectedFiles(filesToSend);
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

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Validate each file
    const newFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (validation.valid) {
        newFiles.push(file);
      } else {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive",
        });
      }
    }
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    // Create a File object from the Blob
    const audioFile = new File(
      [audioBlob],
      `voice-${Date.now()}.webm`,
      { type: audioBlob.type }
    );
    
    setSelectedFiles(prev => [...prev, audioFile]);
    setShowVoiceRecorder(false);
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

  // Get status icon based on message status
  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.SENT:
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case MessageStatus.DELIVERED:
        return <Check className="w-3 h-3 text-primary" />;
      case MessageStatus.READ:
        return (
          <div className="flex">
            <Check className="w-3 h-3 text-primary -mr-1" />
            <Check className="w-3 h-3 text-primary" />
          </div>
        );
      case MessageStatus.PENDING:
        return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />;
      case MessageStatus.QUEUED:
        return <Clock className="w-3 h-3 text-warning" />;
      case MessageStatus.FAILED:
        return <X className="w-3 h-3 text-destructive" />;
      default:
        return null;
    }
  };

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
              {conversation.profilePhoto ? (
                <img 
                  src={conversation.profilePhoto} 
                  alt={formatAddress(conversation.peerAddress)}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground truncate">
                {formatAddress(conversation.peerAddress)}
              </p>
            </div>
            <UserTrustIndicator 
              trustScore={conversation.trustScore || 0} 
              trustBadge={conversation.trustBadge || "none"}
              isVerified={conversation.isVerified}
              size="sm"
              language={messagingPreferences.language}
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        {/* User Actions */}
        <div className="mt-3">
          <UserActions 
            address={conversation.peerAddress} 
            isBlocked={conversation.isBlocked}
            language={messagingPreferences.language} 
          />
        </div>
      </div>

      {showSettings ? (
        <PrivacySettings onBack={() => setShowSettings(false)} />
      ) : showMediaPanel ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shared Media</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMediaPanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <MessageMediaTab 
            conversation={conversation}
            language={messagingPreferences.language}
          />
        </div>
      ) : (
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="media" onClick={() => setShowMediaPanel(true)}>Media</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 overflow-y-auto p-4 space-y-4">
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
                          {/* Message content */}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => {
                                if (attachment.type.startsWith('image/')) {
                                  return (
                                    <div key={attachment.id} className="rounded-md overflow-hidden">
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-w-full"
                                      />
                                    </div>
                                  );
                                } else if (attachment.type.startsWith('audio/')) {
                                  return (
                                    <div key={attachment.id} className="rounded-md bg-background/50 p-2">
                                      <audio src={attachment.url} controls className="w-full" />
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={attachment.id} className="rounded-md bg-background/50 p-2 flex items-center gap-2">
                                      <FileText className="w-5 h-5" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">
                                          {attachment.name}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          )}
                          
                          {/* Message info */}
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOwnMessage
                                ? "text-message-sent-foreground/70 justify-end"
                                : "text-message-received-foreground/70"
                            }`}
                          >
                            <span className="text-xs">
                              {formatMessageTime(message.sentAt)}
                            </span>
                            
                            {isOwnMessage && (
                              <div className="ml-1">
                                {getStatusIcon(message.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            
            {/* Typing indicator */}
            {conversation.isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm ml-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "600ms" }}></div>
                </div>
                <span>{getTypingIndicatorText(messagingPreferences.language)}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </TabsContent>
        </Tabs>
      )}

      {/* File selection preview */}
      {selectedFiles.length > 0 && (
        <div className="p-2 border-t border-border bg-card max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <FileAttachmentPreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => handleRemoveFile(index)}
                language={messagingPreferences.language}
              />
            ))}
          </div>
        </div>
      )}

      {/* Voice recorder */}
      {showVoiceRecorder && (
        <div className="p-2 border-t border-border">
          <RecordVoiceMessage
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
            language={messagingPreferences.language}
          />
        </div>
      )}

      {/* Message Input */}
      {!showSettings && !showMediaPanel && !showVoiceRecorder && (
        <div className="p-4 border-t border-border bg-card">
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileButtonClick}
                  className="text-muted-foreground hover:text-foreground h-10 w-10 p-0"
                  disabled={conversation.isBlocked}
                >
                  <Paperclip className="w-5 h-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept="image/*,audio/*,application/pdf,text/plain"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="text-muted-foreground hover:text-foreground h-10 w-10 p-0"
                  disabled={conversation.isBlocked}
                >
                  <Mic className="w-5 h-5" />
                  <span className="sr-only">Record voice</span>
                </Button>
              </div>
              
              <div className="flex-1">
                <textarea
                  ref={messageInputRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending || conversation.isBlocked}
                  className="w-full resize-none border rounded-md p-2 h-10 min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={1}
                  style={{
                    height: 'auto',
                    overflowY: 'auto',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending || conversation.isBlocked}
                size="sm"
                className="h-10 w-10 p-0"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {conversation.isBlocked && (
              <div className="text-xs text-destructive text-center">
                This user is blocked. Unblock to send messages.
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              🔒 Messages are end-to-end encrypted
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
