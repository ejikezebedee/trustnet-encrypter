
import { ethers } from "ethers";
import { Wallet } from "../wallet";

/**
 * Encrypt data for secure storage
 * @param data The data to encrypt
 * @param wallet The wallet to use for encryption
 * @returns The encrypted data
 */
export const encryptData = async (data: string, wallet: Wallet): Promise<string> => {
  try {
    // Simple AES encryption with wallet as key material
    const keyMaterial = wallet.privateKey.slice(2, 34); // Use part of private key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Convert to hex string
    return ethers.utils.hexlify(result);
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypt data that was encrypted with encryptData
 * @param encryptedData The encrypted data
 * @param wallet The wallet to use for decryption
 * @returns The decrypted data
 */
export const decryptData = async (encryptedData: string, wallet: Wallet): Promise<string> => {
  try {
    // Get data as bytes
    const dataBytes = ethers.utils.arrayify(encryptedData);
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = dataBytes.slice(0, 12);
    const encrypted = dataBytes.slice(12);
    
    // Get key from wallet
    const keyMaterial = wallet.privateKey.slice(2, 34);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    // Convert back to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw new Error("Failed to decrypt data");
  }
};

/**
 * Encrypt a message for IPFS backup
 * @param message The message to encrypt
 * @param wallet The wallet to use for encryption
 * @returns The encrypted message data
 */
export const encryptMessageForBackup = async (
  message: any,
  wallet: Wallet
): Promise<string> => {
  try {
    const messageString = JSON.stringify(message);
    return await encryptData(messageString, wallet);
  } catch (error) {
    console.error("Error encrypting message for backup:", error);
    throw new Error("Failed to encrypt message for backup");
  }
};

/**
 * Decrypt a message from IPFS backup
 * @param encryptedMessage The encrypted message data
 * @param wallet The wallet to use for decryption
 * @returns The decrypted message
 */
export const decryptMessageFromBackup = async (
  encryptedMessage: string,
  wallet: Wallet
): Promise<any> => {
  try {
    const decryptedString = await decryptData(encryptedMessage, wallet);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Error decrypting message from backup:", error);
    throw new Error("Failed to decrypt message from backup");
  }
};

/**
 * Save encrypted conversations for backup
 * @param conversations The conversations to encrypt and backup
 * @param wallet The wallet to use for encryption
 * @returns An object with encrypted data and metadata
 */
export const prepareConversationsForBackup = async (
  conversations: any[],
  wallet: Wallet
): Promise<{
  encryptedData: string;
  metadata: {
    createdAt: number;
    walletAddress: string;
    conversationCount: number;
  };
}> => {
  try {
    const conversationsString = JSON.stringify(conversations);
    const encryptedData = await encryptData(conversationsString, wallet);
    
    return {
      encryptedData,
      metadata: {
        createdAt: Date.now(),
        walletAddress: wallet.address,
        conversationCount: conversations.length,
      },
    };
  } catch (error) {
    console.error("Error preparing conversations for backup:", error);
    throw new Error("Failed to prepare conversations for backup");
  }
};

/**
 * Restore conversations from encrypted backup
 * @param encryptedBackup The encrypted backup data
 * @param wallet The wallet to use for decryption
 * @returns The restored conversations array
 */
export const restoreConversationsFromBackup = async (
  encryptedBackup: string,
  wallet: Wallet
): Promise<any[]> => {
  try {
    const decryptedString = await decryptData(encryptedBackup, wallet);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Error restoring conversations from backup:", error);
    throw new Error("Failed to restore conversations from backup");
  }
};
