import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, Upload, Eye, EyeOff } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { importWalletFromPrivateKey } from "@/lib/web3/wallet";

export const WalletSetup: React.FC = () => {
  const { createNewWallet, error, clearError } = useWallet();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      return;
    }

    if (password.length < 8) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await createNewWallet(password);
    } catch (err) {
      console.error("Failed to create wallet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!privateKey || password !== confirmPassword || password.length < 8) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      // Validate private key first
      importWalletFromPrivateKey(privateKey);
      await createNewWallet(password);
    } catch (err) {
      console.error("Failed to import wallet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center animate-pulse-encryption">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl text-foreground">TrustNet ID</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up your secure Web3 wallet for encrypted messaging
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
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

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleCreateWallet}
                  disabled={isLoading || password !== confirmPassword || password.length < 8}
                  className="w-full"
                >
                  {isLoading ? "Creating Wallet..." : "Create Wallet"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input
                    id="privateKey"
                    type="password"
                    placeholder="Enter your private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="importPassword">Password</Label>
                  <Input
                    id="importPassword"
                    type="password"
                    placeholder="Enter a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="importConfirmPassword">Confirm Password</Label>
                  <Input
                    id="importConfirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleImportWallet}
                  disabled={
                    isLoading ||
                    !privateKey ||
                    password !== confirmPassword ||
                    password.length < 8
                  }
                  className="w-full"
                >
                  {isLoading ? "Importing Wallet..." : "Import Wallet"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Your wallet is encrypted and stored locally. Only you have access to your private keys.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};