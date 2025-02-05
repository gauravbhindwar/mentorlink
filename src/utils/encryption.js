// utils/storageEncryption.js
import CryptoJS from 'crypto-js'; // or use Web Crypto API

// Use a secure key (avoid hardcoding in production)
const SECRET_KEY = process.env.STORAGE_SECRET_KEY || 'my-unsafe-secret-key';

// Encrypt data
const encrypt = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// Encrypt key
const encryptKey = (key) => {
  return CryptoJS.SHA256(key).toString();
};

// Decrypt data
const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// utils/storageEncryption.js
export const initializeEncryptedStorage = () => {
    if (typeof window === 'undefined') return; // Skip on server
  
    // Override for localStorage
    const localStorageProto = Object.getPrototypeOf(window.localStorage);
    const originalLocalSet = localStorageProto.setItem;
    const originalLocalGet = localStorageProto.getItem;
  
    localStorageProto.setItem = function (key, value) {
      const encryptedKey = encryptKey(key);
      const encryptedValue = encrypt(value);
      originalLocalSet.call(this, encryptedKey, encryptedValue);
    };
  
    localStorageProto.getItem = function (key) {
      const encryptedKey = encryptKey(key);
      const encryptedValue = originalLocalGet.call(this, encryptedKey);
      try {
        return encryptedValue ? decrypt(encryptedValue) : null;
      } catch (e) {
        console.log('Error decrypting:', e);
        return encryptedValue; // Fallback for unencrypted data
      }
    };
  
    // Repeat for sessionStorage
    const sessionStorageProto = Object.getPrototypeOf(window.sessionStorage);
    const originalSessionSet = sessionStorageProto.setItem;
    const originalSessionGet = sessionStorageProto.getItem;
  
    sessionStorageProto.setItem = function (key, value) {
      const encryptedKey = encryptKey(key);
      const encryptedValue = encrypt(value);
      originalSessionSet.call(this, encryptedKey, encryptedValue);
    };
  
    sessionStorageProto.getItem = function (key) {
      const encryptedKey = encryptKey(key);
      const encryptedValue = originalSessionGet.call(this, encryptedKey);
      try {
        return encryptedValue ? decrypt(encryptedValue) : null;
      } catch (e) {
        console.log('Error decrypting:', e);
        return encryptedValue; // Fallback for unencrypted data
      }
    };
  };