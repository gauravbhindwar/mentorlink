import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'your-fallback-secret-key';
const SALT_LENGTH = process.env.NEXT_PUBLIC_SALT_LENGTH || 16;
const IV_LENGTH = process.env.NEXT_PUBLIC_IV_LENGTH || 16;

export const encryptData = (data) => {
    try {
        if (data === undefined || data === null) {
            throw new Error('Data cannot be null or undefined');
        }

        // Generate random salt and IV
        const salt = CryptoJS.lib.WordArray.random(SALT_LENGTH);
        const iv = CryptoJS.lib.WordArray.random(IV_LENGTH);

        // Generate key with salt
        const key = CryptoJS.PBKDF2(SECRET_KEY, salt, {
            keySize: 256 / 32,
            iterations: 1000
        });

        // Encrypt the data
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Combine salt, IV, and encrypted data
        const combined = salt.toString() + iv.toString() + encrypted.toString();
        return combined;
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

export const decryptData = (encryptedData) => {
    try {
        if (!encryptedData) {
            throw new Error('Encrypted data is required');
        }

        // Extract salt, IV, and encrypted data
        const saltStr = encryptedData.substr(0, SALT_LENGTH * 2);
        const ivStr = encryptedData.substr(SALT_LENGTH * 2, IV_LENGTH * 2);
        const encryptedStr = encryptedData.substr((SALT_LENGTH + IV_LENGTH) * 2);

        const salt = CryptoJS.enc.Hex.parse(saltStr);
        const iv = CryptoJS.enc.Hex.parse(ivStr);

        // Regenerate key with salt
        const key = CryptoJS.PBKDF2(SECRET_KEY, salt, {
            keySize: 256 / 32,
            iterations: 1000
        });

        // Decrypt the data
        const decrypted = CryptoJS.AES.decrypt(encryptedStr, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};
