import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Briefcase, 
  User, 
  Settings, 
  Shield, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { MessagingApp } from '@/components/messaging/MessagingApp';
import { MarketplaceTab } from '@/components/marketplace/MarketplaceTab';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const MainApp: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('messaging');

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">TrustNet ID</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {user?.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Trust: {user?.trustScore}
            </Badge>
            {isAdmin && (
              <Badge variant="default" className="text-xs bg-primary/10 text-primary">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab Navigation */}
          <TabsList className="grid grid-cols-4 h-auto rounded-none border-b">
            <TabsTrigger value="messaging" className="flex-col gap-1 h-16">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex-col gap-1 h-16">
              <Briefcase className="w-5 h-5" />
              <span className="text-xs">Marketplace</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex-col gap-1 h-16">
                <Shield className="w-5 h-5" />
                <span className="text-xs">Admin</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="flex-col gap-1 h-16">
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="messaging" className="h-full m-0">
              <WalletProvider>
                <MessagingApp />
              </WalletProvider>
            </TabsContent>

            <TabsContent value="marketplace" className="h-full m-0">
              <MarketplaceTab language="en" />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="h-full m-0 overflow-auto">
                <AdminDashboard />
              </TabsContent>
            )}

            <TabsContent value="profile" className="h-full m-0 p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{user?.username}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="secondary">
                      Trust Score: {user?.trustScore}
                    </Badge>
                    {user?.isVerified && (
                      <Badge variant="default">Verified</Badge>
                    )}
                    {isAdmin && (
                      <Badge variant="default" className="bg-primary/10 text-primary">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Information</h3>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Account Type</span>
                      <Badge variant={isAdmin ? 'default' : 'secondary'}>
                        {isAdmin ? 'Administrator' : 'Standard User'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Member Since</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Verification Status</span>
                      <Badge variant={user?.isVerified ? 'default' : 'secondary'}>
                        {user?.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator Notice
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      This is a temporary demo admin account. You can change your password 
                      or manage users through the Admin tab.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};