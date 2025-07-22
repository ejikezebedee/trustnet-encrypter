import { ethers } from "ethers";
import * as XMTP from "@xmtp/xmtp-js";

// Interface for a simplified wallet
export interface Wallet {
  address: string;
  privateKey: string;
}

// Interface for encrypted wallet storage
export interface EncryptedWallet {
  encryptedData: string;
  salt: string;
  iv: string;
}

/**
 * Creates a new Ethereum wallet
 * @returns A new wallet instance with address and private key
 */
export const createWallet = (): Wallet => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

/**
 * Import wallet from private key
 * @param privateKey The private key to import
 * @returns The wallet instance
 */
export const importWalletFromPrivateKey = (privateKey: string): Wallet => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error("Failed to import wallet:", error);
    throw new Error("Invalid private key provided");
  }
};

/**
 * Encrypts a wallet with a password
 * @param wallet The wallet to encrypt
 * @param password The password to encrypt with
 * @returns The encrypted wallet data
 */
export const encryptWallet = async (
  wallet: Wallet,
  password: string
): Promise<EncryptedWallet> => {
  try {
    // Generate a salt for key derivation
    const salt = ethers.utils.randomBytes(16);
    const saltHex = ethers.utils.hexlify(salt);
    
    // Generate an initialization vector for encryption
    const iv = ethers.utils.randomBytes(16);
    const ivHex = ethers.utils.hexlify(iv);
    
    // Convert password to a key using PBKDF2
    const keyBuffer = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(ethers.utils.arrayify(saltHex)),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    
    // Encrypt the wallet data
    const walletData = JSON.stringify(wallet);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(ethers.utils.arrayify(ivHex)),
      },
      derivedKey,
      new TextEncoder().encode(walletData)
    );
    
    return {
      encryptedData: ethers.utils.hexlify(new Uint8Array(encryptedData)),
      salt: saltHex,
      iv: ivHex,
    };
  } catch (error) {
    console.error("Failed to encrypt wallet:", error);
    throw new Error("Wallet encryption failed");
  }
};

/**
 * Decrypts a wallet with a password
 * @param encryptedWallet The encrypted wallet data
 * @param password The password to decrypt with
 * @returns The decrypted wallet
 */
export const decryptWallet = async (
  encryptedWallet: EncryptedWallet,
  password: string
): Promise<Wallet> => {
  try {
    // Import the password as a key
    const keyBuffer = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    // Derive the key using the same parameters as during encryption
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(ethers.utils.arrayify(encryptedWallet.salt)),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    // Decrypt the wallet data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(ethers.utils.arrayify(encryptedWallet.iv)),
      },
      derivedKey,
      new Uint8Array(ethers.utils.arrayify(encryptedWallet.encryptedData))
    );
    
    // Parse the decrypted wallet data
    const walletData = new TextDecoder().decode(decryptedData);
    return JSON.parse(walletData) as Wallet;
  } catch (error) {
    console.error("Failed to decrypt wallet:", error);
    throw new Error("Incorrect password or corrupted data");
  }
};

/**
 * Saves an encrypted wallet to local storage
 * @param encryptedWallet The encrypted wallet to save
 */
export const saveWalletToStorage = (encryptedWallet: EncryptedWallet): void => {
  localStorage.setItem("trustnet-wallet", JSON.stringify(encryptedWallet));
};

/**
 * Retrieves an encrypted wallet from local storage
 * @returns The encrypted wallet or null if not found
 */
export const getWalletFromStorage = (): EncryptedWallet | null => {
  const walletData = localStorage.getItem("trustnet-wallet");
  if (!walletData) return null;
  
  try {
    return JSON.parse(walletData) as EncryptedWallet;
  } catch {
    return null;
  }
};

/**
 * Checks if a wallet exists in storage
 * @returns True if a wallet exists in storage
 */
export const hasWalletInStorage = (): boolean => {
  return localStorage.getItem("trustnet-wallet") !== null;
};

/**
 * Creates a signing client with XMTP for messaging
 * @param wallet The wallet to use for signing
 * @returns The XMTP client
 */
export const createXmtpClient = async (wallet: Wallet): Promise<XMTP.Client> => {
  try {
    const ethersWallet = new ethers.Wallet(wallet.privateKey);
    const client = await XMTP.Client.create(ethersWallet, { env: "dev" });
    return client;
  } catch (error) {
    console.error("Failed to create XMTP client:", error);
    throw new Error("Failed to initialize messaging client");
  }
};

/**
 * Formats an address for display
 * @param address The address to format
 * @returns The formatted address (e.g., 0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Checks if an address is valid
 * @param address The address to check
 * @returns True if the address is valid
 */
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch {
    return false;
  }
};