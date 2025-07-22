import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Settings,
  Image as ImageIcon,
  File,
  Download
} from 'lucide-react';
import { 
  Message, 
  Conversation,
  MessageAttachment 
} from '@/lib/web3/messaging/types';
import { MessageStatus } from '@/lib/web3/messaging/status';
import { 
  sendMessage,
  sendMessageWithAttachments,
  loadMessages,
  createMessageListener,
  markMessageAsRead,
  generateConversationId
} from '@/lib/messaging/firebase';
import { UserTrustIndicator } from './UserTrustIndicator';
import { UserActions } from './UserActions';
import { PrivacySettings } from './PrivacySettings';
import { RecordVoiceMessage } from './RecordVoiceMessage';
import { FileAttachmentPreview } from './FileAttachmentPreview';
import { validateFile } from '@/lib/web3/messaging/fileHandling';
import { useToast } from '@/hooks/use-toast';

interface FirebaseChatViewProps {
  conversation: Conversation;
  currentUserAddress: string;
  onBack: () => void;
}

export const FirebaseChatView: React.FC<FirebaseChatViewProps> = ({
  conversation,
  currentUserAddress,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUserActions, setShowUserActions] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unsubscribeListener, setUnsubscribeListener] = useState<(() => void) | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const conversationId = generateConversationId(currentUserAddress, conversation.peerAddress);

  // Load messages and set up listener
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // Load existing messages
        const loadedMessages = await loadMessages(conversationId, currentUserAddress);
        setMessages(loadedMessages);

        // Set up real-time listener
        const unsubscribe = createMessageListener(
          conversationId,
          currentUserAddress,
          (newMessage: Message) => {
            // Only add if it's not from current user and not already in messages
            if (newMessage.senderAddress !== currentUserAddress) {
              setMessages(prev => {
                const exists = prev.some(m => m.id === newMessage.id);
                if (!exists) {
                  return [...prev, newMessage];
                }
                return prev;
              });
            }
          }
        );
        
        setUnsubscribeListener(() => unsubscribe);
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [conversationId, currentUserAddress]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if ((!messageInput.trim() && selectedFiles.length === 0) || isSending) return;

    setIsSending(true);
    try {
      let sentMessage: Message | null;

      if (selectedFiles.length > 0) {
        sentMessage = await sendMessageWithAttachments(
          currentUserAddress,
          conversation.peerAddress,
          messageInput,
          selectedFiles
        );
      } else {
        sentMessage = await sendMessage(
          currentUserAddress,
          conversation.peerAddress,
          messageInput
        );
      }

      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setMessageInput('');
        setSelectedFiles([]);
        
        toast({
          title: "Message sent",
          description: "Your message has been delivered securely"
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive"
        });
      }
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    // Create File object with proper browser compatibility
    const audioFile = Object.assign(audioBlob, {
      name: 'voice-message.webm',
      lastModified: Date.now()
    }) as File;
    setSelectedFiles(prev => [...prev, audioFile]);
    setShowVoiceRecording(false);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = message.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.SENT:
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case MessageStatus.DELIVERED:
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case MessageStatus.READ:
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case MessageStatus.PENDING:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
      case MessageStatus.FAILED:
        return <AlertTriangle className="w-3 h-3 text-destructive" />;
      default:
        return null;
    }
  };

  if (showVoiceRecording) {
    return (
      <RecordVoiceMessage
        onRecordingComplete={handleVoiceRecordingComplete}
        onCancel={() => setShowVoiceRecording(false)}
        language="en"
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs defaultValue="chat" className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {conversation.peerAddress.slice(2, 4).toUpperCase()}
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {conversation.peerAddress.slice(0, 6)}...{conversation.peerAddress.slice(-4)}
                  </h3>
                  <UserTrustIndicator 
                    trustScore={conversation.trustScore || 0}
                    trustBadge={conversation.trustBadge || 'none'}
                    isVerified={conversation.isVerified}
                  />
                </div>
                {conversation.isTyping && (
                  <p className="text-xs text-muted-foreground">Typing...</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
            </TabsList>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserActions(!showUserActions)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          {/* User Actions */}
          {showUserActions && (
            <UserActions
              address={conversation.peerAddress}
              isBlocked={conversation.isBlocked}
              language="en"
            />
          )}

          {/* Privacy Settings */}
          {showPrivacySettings && (
            <PrivacySettings
              onBack={() => setShowPrivacySettings(false)}
            />
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, dayMessages]) => (
                <div key={date} className="space-y-4">
                  {/* Date separator */}
                  <div className="flex items-center justify-center">
                    <div className="px-3 py-1 bg-muted rounded-full">
                      <span className="text-xs text-muted-foreground">
                        {formatMessageDate(new Date(date))}
                      </span>
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {dayMessages.map((message) => {
                    const isOwnMessage = message.senderAddress === currentUserAddress;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] space-y-1`}>
                          {/* Message bubble */}
                          <div
                            className={`p-3 rounded-lg ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {/* Message content */}
                            {message.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}

                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {message.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 bg-background/10 rounded"
                                  >
                                    {attachment.type.startsWith('image/') ? (
                                      <ImageIcon className="w-4 h-4" />
                                    ) : (
                                      <File className="w-4 h-4" />
                                    )}
                                    <span className="text-xs truncate flex-1">
                                      {attachment.name}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => window.open(attachment.url, '_blank')}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message info */}
                          <div
                            className={`flex items-center gap-1 text-xs text-muted-foreground ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {isOwnMessage && getStatusIcon(message.status)}
                          </div>
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
          <div className="border-t border-border p-4 space-y-3">
            {/* File previews */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <FileAttachmentPreview
                    key={index}
                    file={file}
                    onRemove={() => handleRemoveFile(index)}
                  />
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-[120px] resize-none"
                  disabled={isSending}
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileButtonClick}
                  disabled={isSending}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceRecording(true)}
                  disabled={isSending}
                >
                  <Mic className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && selectedFiles.length === 0) || isSending}
                  size="sm"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </TabsContent>

        <TabsContent value="media" className="flex-1 m-0">
          {/* Media tab content - would show shared files, images, etc. */}
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Media sharing coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};