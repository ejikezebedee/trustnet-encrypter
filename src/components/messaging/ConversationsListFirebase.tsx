import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Users,
  Filter,
  MoreVertical 
} from 'lucide-react';
import { Conversation } from '@/lib/web3/messaging/types';
import { getUserConversations } from '@/lib/messaging/firebase';
import { UserTrustIndicator } from './UserTrustIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';

interface ConversationsListFirebaseProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversation?: Conversation;
}

export const ConversationsListFirebase: React.FC<ConversationsListFirebaseProps> = ({
  onSelectConversation,
  selectedConversation
}) => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'trusted'>('all');

  const currentUserAddress = wallet?.address || user?.email || '';

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUserAddress) return;
      
      try {
        setIsLoading(true);
        const userConversations = await getUserConversations(currentUserAddress);
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [currentUserAddress]);

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!conversation.peerAddress.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Status filter
    switch (filter) {
      case 'unread':
        return conversation.unreadCount > 0;
      case 'trusted':
        return (conversation.trustScore || 0) >= 50;
      default:
        return true;
    }
  });

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          <Button
            variant={filter === 'trusted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('trusted')}
          >
            Trusted
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No conversations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'No conversations match your search.' : 'Start a conversation to begin messaging securely.'}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.peerAddress === conversation.peerAddress;
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              
              return (
                <div
                  key={conversation.peerAddress}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {conversation.peerAddress.slice(2, 4).toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground truncate">
                            {conversation.peerAddress.slice(0, 6)}...{conversation.peerAddress.slice(-4)}
                          </h4>
                          <UserTrustIndicator
                            trustScore={conversation.trustScore || 0}
                            trustBadge={conversation.trustBadge || 'none'}
                            isVerified={conversation.isVerified}
                            size="sm"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(conversation.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage?.content || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          {conversation.isBlocked && (
                            <Badge variant="destructive" className="h-5 text-xs">
                              Blocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredConversations.length} conversations</span>
          <span>{filteredConversations.filter(c => c.unreadCount > 0).length} unread</span>
        </div>
      </div>
    </div>
  );
};