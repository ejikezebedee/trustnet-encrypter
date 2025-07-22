import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Copy, Download, AlertTriangle } from 'lucide-react';
import { generateRecoveryCode, generateSeedPhrase, createRecoveryData, saveRecoveryData } from '@/lib/recovery';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RecoverySetupProps {
  onComplete: () => void;
}

export const RecoverySetup: React.FC<RecoverySetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'generate' | 'display' | 'confirm'>('generate');
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleGenerateRecovery = async () => {
    if (!user) return;

    try {
      // Generate recovery code and seed phrase
      const code = generateRecoveryCode();
      const seed = generateSeedPhrase();
      
      setRecoveryCode(code);
      setSeedPhrase(seed);

      // Create encrypted recovery data
      const recoveryData = await createRecoveryData({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }, code);

      // Save recovery data
      saveRecoveryData(user.id, recoveryData);

      setStep('display');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate recovery data",
        variant: "destructive"
      });
    }
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
    });
  };

  const handleDownloadRecovery = () => {
    const recoveryData = `TrustNet Recovery Information
Generated: ${new Date().toLocaleString()}

Recovery Code: ${recoveryCode}
(Use this to recover your account if you forget your password)

Wallet Seed Phrase: ${seedPhrase}
(Use this to recover your wallet and funds)

IMPORTANT SECURITY NOTES:
- Store this information in a secure location
- Never share your recovery code or seed phrase with anyone
- TrustNet will never ask for your recovery information
- These codes expire after 30 days if unused
- Write them down on paper as a backup

If you lose access to your account, visit the TrustNet login page and select "Recover Account" to use this information.`;

    const blob = new Blob([recoveryData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustnet-recovery-${user?.username}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Recovery information saved to file",
    });
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    onComplete();
    toast({
      title: "Recovery Setup Complete",
      description: "Your account recovery has been configured successfully",
    });
  };

  if (step === 'generate') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Setup Account Recovery</CardTitle>
          <CardDescription>
            Secure your account with recovery options in case you forget your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              We'll generate a recovery code and wallet seed phrase. Store them safely - we cannot recover them if lost.
            </AlertDescription>
          </Alert>
          
          <Button onClick={handleGenerateRecovery} className="w-full">
            Generate Recovery Information
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'display') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Save Your Recovery Information</CardTitle>
          <CardDescription>
            Store this information securely - you'll need it to recover your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recovery Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Account Recovery Code</h3>
              <Badge variant="secondary">For account access</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-lg font-mono">{recoveryCode}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyToClipboard(recoveryCode, 'Recovery code')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this code to recover your account if you forget your password
            </p>
          </div>

          {/* Seed Phrase */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Wallet Seed Phrase</h3>
              <Badge variant="secondary">For wallet recovery</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
              {seedPhrase.split(' ').map((word, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-6">{index + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyToClipboard(seedPhrase, 'Seed phrase')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Seed Phrase
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this 12-word phrase to recover your wallet and funds
            </p>
          </div>

          {/* Security Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Security Warning:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Write down this information on paper and store it securely</li>
                <li>Never share your recovery code or seed phrase with anyone</li>
                <li>TrustNet cannot recover this information if you lose it</li>
                <li>Anyone with access to this information can access your account</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownloadRecovery} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download as File
            </Button>
            <Button onClick={() => setStep('confirm')} className="flex-1">
              I've Saved This Information
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'confirm') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Confirm Recovery Setup</CardTitle>
          <CardDescription>
            Please confirm that you have securely stored your recovery information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By proceeding, you confirm that you have securely stored both your recovery code and seed phrase. 
              TrustNet cannot help you recover your account without this information.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('display')} className="flex-1">
              Go Back
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};