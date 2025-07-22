import CryptoJS from 'crypto-js';
import * as bip39 from 'bip39';

export interface RecoveryCode {
  code: string;
  encryptedData: string;
  salt: string;
  iv: string;
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
}

export interface WalletRecovery {
  seedPhrase: string;
  encryptedData: string;
  salt: string;
  iv: string;
  createdAt: number;
}

// Generate a secure recovery code in format PX7Z-L38Q-KD91
export const generateRecoveryCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
};

// Generate 12-word seed phrase for wallet recovery
export const generateSeedPhrase = (): string => {
  return bip39.generateMnemonic();
};

// Validate seed phrase
export const validateSeedPhrase = (seedPhrase: string): boolean => {
  return bip39.validateMnemonic(seedPhrase);
};

// Encrypt user data with recovery code
export const createRecoveryData = async (userData: any, recoveryCode: string): Promise<RecoveryCode> => {
  const salt = CryptoJS.lib.WordArray.random(256/8).toString();
  const iv = CryptoJS.lib.WordArray.random(128/8).toString();
  
  // Derive key from recovery code
  const key = CryptoJS.PBKDF2(recoveryCode, salt, {
    keySize: 256/32,
    iterations: 10000
  });
  
  // Encrypt user data
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(userData), key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    code: recoveryCode,
    encryptedData: encrypted.toString(),
    salt,
    iv,
    createdAt: Date.now(),
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    isUsed: false
  };
};

// Decrypt data with recovery code
export const recoverUserData = async (recoveryData: RecoveryCode, recoveryCode: string): Promise<any> => {
  if (recoveryData.isUsed) {
    throw new Error('Recovery code has already been used');
  }
  
  if (Date.now() > recoveryData.expiresAt) {
    throw new Error('Recovery code has expired');
  }
  
  if (recoveryData.code !== recoveryCode) {
    throw new Error('Invalid recovery code');
  }
  
  try {
    // Derive key from recovery code
    const key = CryptoJS.PBKDF2(recoveryCode, recoveryData.salt, {
      keySize: 256/32,
      iterations: 10000
    });
    
    // Decrypt data
    const decrypted = CryptoJS.AES.decrypt(recoveryData.encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(recoveryData.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      throw new Error('Failed to decrypt data');
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    throw new Error('Invalid recovery code or corrupted data');
  }
};

// Create wallet recovery data
export const createWalletRecovery = async (walletData: any, seedPhrase: string): Promise<WalletRecovery> => {
  const salt = CryptoJS.lib.WordArray.random(256/8).toString();
  const iv = CryptoJS.lib.WordArray.random(128/8).toString();
  
  // Derive key from seed phrase
  const key = CryptoJS.PBKDF2(seedPhrase, salt, {
    keySize: 256/32,
    iterations: 10000
  });
  
  // Encrypt wallet data
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(walletData), key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    seedPhrase,
    encryptedData: encrypted.toString(),
    salt,
    iv,
    createdAt: Date.now()
  };
};

// Recover wallet from seed phrase
export const recoverWalletFromSeed = async (recovery: WalletRecovery, seedPhrase: string): Promise<any> => {
  if (!validateSeedPhrase(seedPhrase)) {
    throw new Error('Invalid seed phrase');
  }
  
  if (recovery.seedPhrase !== seedPhrase) {
    throw new Error('Seed phrase does not match');
  }
  
  try {
    // Derive key from seed phrase
    const key = CryptoJS.PBKDF2(seedPhrase, recovery.salt, {
      keySize: 256/32,
      iterations: 10000
    });
    
    // Decrypt wallet data
    const decrypted = CryptoJS.AES.decrypt(recovery.encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(recovery.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      throw new Error('Failed to decrypt wallet data');
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    throw new Error('Invalid seed phrase or corrupted wallet data');
  }
};

// Save recovery data to localStorage
export const saveRecoveryData = (userId: string, recoveryData: RecoveryCode): void => {
  localStorage.setItem(`trustnet-recovery-${userId}`, JSON.stringify(recoveryData));
};

// Get recovery data from localStorage
export const getRecoveryData = (userId: string): RecoveryCode | null => {
  const data = localStorage.getItem(`trustnet-recovery-${userId}`);
  return data ? JSON.parse(data) : null;
};

// Mark recovery code as used
export const markRecoveryCodeUsed = (userId: string): void => {
  const recoveryData = getRecoveryData(userId);
  if (recoveryData) {
    recoveryData.isUsed = true;
    saveRecoveryData(userId, recoveryData);
  }
};

// Save wallet recovery data
export const saveWalletRecovery = (walletAddress: string, recovery: WalletRecovery): void => {
  // Don't store the actual seed phrase in localStorage for security
  const safeRecovery = {
    ...recovery,
    seedPhrase: '' // Remove seed phrase from storage
  };
  localStorage.setItem(`trustnet-wallet-recovery-${walletAddress}`, JSON.stringify(safeRecovery));
};

// Get wallet recovery data
export const getWalletRecovery = (walletAddress: string): Omit<WalletRecovery, 'seedPhrase'> | null => {
  const data = localStorage.getItem(`trustnet-wallet-recovery-${walletAddress}`);
  return data ? JSON.parse(data) : null;
};