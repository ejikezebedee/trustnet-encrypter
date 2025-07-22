import CryptoJS from 'crypto-js';

/**
 * Encrypts text using AES encryption with the provided key
 */
export const encryptMessage = (text: string, key: string): string => {
  try {
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypts text using AES decryption with the provided key
 */
export const decryptMessage = (encryptedText: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Generates a shared encryption key based on two addresses
 */
export const generateSharedKey = (address1: string, address2: string): string => {
  // Sort addresses to ensure consistent key generation regardless of order
  const sortedAddresses = [address1, address2].sort();
  return CryptoJS.SHA256(sortedAddresses.join('|')).toString();
};

/**
 * Encrypts file data for secure sharing
 */
export const encryptFile = async (file: File, key: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
        resolve(encrypted);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Decrypts file data
 */
export const decryptFile = (encryptedData: string, key: string): Uint8Array => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const typedArray = new Uint8Array(bytes.sigBytes);
    for (let i = 0; i < bytes.sigBytes; i++) {
      typedArray[i] = (bytes.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return typedArray;
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw new Error('Failed to decrypt file');
  }
};