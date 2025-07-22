import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, Eye, EyeOff } from 'lucide-react';
import { getRecoveryData, recoverUserData, markRecoveryCodeUsed } from '@/lib/recovery';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AccountRecoveryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AccountRecovery: React.FC<AccountRecoveryProps> = ({ onSuccess, onCancel }) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveredUser, setRecoveredUser] = useState<any>(null);

  const formatRecoveryCode = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Format as XXXX-XXXX-XXXX
    const formatted = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
    
    // Limit to 14 characters (XXXX-XXXX-XXXX)
    return formatted.slice(0, 14);
  };

  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRecoveryCode(e.target.value);
    setRecoveryCode(formatted);
    setError('');
  };

  const handleVerifyRecoveryCode = async () => {
    if (!recoveryCode || recoveryCode.length < 14) {
      setError('Please enter a complete recovery code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // For demo purposes, we'll check all possible user IDs
      // In a real app, you'd have a better way to match recovery codes
      const possibleUserIds = ['admin-001', 'user-' + Date.now()]; // Add more as needed
      let recoveryData = null;
      let userId = '';

      // Try to find recovery data for any user
      for (const id of possibleUserIds) {
        const data = getRecoveryData(id);
        if (data && data.code === recoveryCode) {
          recoveryData = data;
          userId = id;
          break;
        }
      }

      // If not found in predefined IDs, try to find in localStorage by scanning all keys
      if (!recoveryData) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('trustnet-recovery-')) {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.code === recoveryCode) {
              recoveryData = data;
              userId = key.replace('trustnet-recovery-', '');
              break;
            }
          }
        }
      }

      if (!recoveryData) {
        setError('Invalid or expired recovery code');
        return;
      }

      // Recover user data
      const userData = await recoverUserData(recoveryData, recoveryCode);
      setRecoveredUser(userData);
      setStep('password');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify recovery code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!recoveredUser) {
      setError('No user data recovered');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Mark recovery code as used
      markRecoveryCodeUsed(recoveredUser.userId);

      // Log in the user with their email and new password
      const success = await login(recoveredUser.email, newPassword);
      
      if (success) {
        toast({
          title: "Account Recovered",
          description: "Your account has been successfully recovered with a new password",
        });
        onSuccess();
      } else {
        setError('Failed to log in with new password');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to set new password');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Recover Your Account</CardTitle>
          <CardDescription>
            Enter your recovery code to regain access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recoveryCode">Recovery Code</Label>
            <Input
              id="recoveryCode"
              type="text"
              placeholder="XXXX-XXXX-XXXX"
              value={recoveryCode}
              onChange={handleRecoveryCodeChange}
              className="text-center font-mono text-lg"
            />
            <p className="text-sm text-muted-foreground">
              Enter the 12-character recovery code you saved when setting up your account
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyRecoveryCode} 
              disabled={isLoading || !recoveryCode}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'password') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            Welcome back, {recoveredUser?.username}! Please set a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your recovery code will be marked as used after setting this password. 
              You'll need to generate a new recovery code from your account settings.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSetNewPassword} 
            disabled={isLoading || !newPassword || !confirmPassword}
            className="w-full"
          >
            {isLoading ? 'Setting Password...' : 'Set New Password & Login'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};