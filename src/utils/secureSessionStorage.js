import { encryptData, decryptData } from './encryption';

export const secureSessionStorage = {
    setItem: (key, value) => {
        const encryptedValue = encryptData(value);
        if (encryptedValue) {
            sessionStorage.setItem(key, encryptedValue);
        }
    },

    getItem: (key) => {
        const encryptedValue = sessionStorage.getItem(key);
        if (!encryptedValue) return null;
        return decryptData(encryptedValue);
    },

    removeItem: (key) => {
        sessionStorage.removeItem(key);
    },

    clear: () => {
        sessionStorage.clear();
    }
};
