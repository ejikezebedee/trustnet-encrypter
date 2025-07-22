import React from "react";
import { WalletProvider } from "@/contexts/WalletContext";
import { MessagingApp } from "@/components/messaging/MessagingApp";

const Index = () => {
  return (
    <WalletProvider>
      <MessagingApp />
    </WalletProvider>
  );
};

export default Index;
