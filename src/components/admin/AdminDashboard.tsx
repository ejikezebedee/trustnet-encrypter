import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Flag, 
  CheckCircle, 
  XCircle,
  Eye,
  Ban,
  Unlock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Job, JobStatus, JobCategory } from '@/lib/web3/marketplace/types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const flaggedJobs: Job[] = [
    {
      id: '1',
      title: 'Disputed Delivery Service',
      description: 'Package delivery that was marked as incomplete',
      category: JobCategory.DELIVERY,
      budget: 25,
      currency: 'USD',
      location: 'Downtown',
      posterAddress: '0x123...',
      posterTrustScore: 75,
      posterTrustBadge: 'Verified Seller',
      requiredTrustScore: 60,
      status: JobStatus.DISPUTED,
      completionTime: '2 hours',
      deliveryMethod: 'in-person',
      createdAt: new Date(),
      applicants: []
    }
  ];

  const flaggedUsers = [
    {
      id: '1',
      address: '0x456...',
      email: 'suspicious@example.com',
      trustScore: 25,
      reason: 'Multiple dispute reports',
      reportCount: 3
    }
  ];

  const handleReleaseEscrow = (jobId: string) => {
    console.log('Releasing escrow for job:', jobId);
    // Implement escrow release logic
  };

  const handleBanUser = (userId: string) => {
    console.log('Banning user:', userId);
    // Implement user ban logic
  };

  const handleVerifyUser = (userId: string) => {
    console.log('Verifying user:', userId);
    // Implement user verification logic
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username}
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <Shield className="w-4 h-4 mr-1" />
          Admin Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flagged-jobs">Flagged Jobs</TabsTrigger>
          <TabsTrigger value="flagged-users">Flagged Users</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +20 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">
                  +12 today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Needs review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escrow Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,350</div>
                <p className="text-xs text-muted-foreground">
                  In held escrow
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have 3 items requiring immediate attention: 1 disputed job and 2 flagged users.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="flagged-jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Jobs</CardTitle>
              <CardDescription>
                Jobs that have been reported or are in dispute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flaggedJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="destructive">Disputed</Badge>
                        <span className="text-sm text-muted-foreground">
                          Posted by: {job.posterAddress}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${job.budget}</div>
                      <div className="text-sm text-muted-foreground">Budget</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" onClick={() => handleReleaseEscrow(job.id)}>
                      <Unlock className="w-4 h-4 mr-1" />
                      Release Escrow
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="w-4 h-4 mr-1" />
                      Close Job
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Users</CardTitle>
              <CardDescription>
                Users reported for suspicious activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flaggedUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{user.email}</h4>
                      <p className="text-sm text-muted-foreground">
                        Address: {user.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="destructive">
                          Trust Score: {user.trustScore}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {user.reportCount} reports
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {user.reason}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    <Button size="sm" onClick={() => handleVerifyUser(user.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verify User
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBanUser(user.id)}>
                      <Ban className="w-4 h-4 mr-1" />
                      Ban User
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Management</CardTitle>
              <CardDescription>
                Manage held funds and manual releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Escrow Management</h3>
                <p className="text-muted-foreground">
                  Advanced escrow management features will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};