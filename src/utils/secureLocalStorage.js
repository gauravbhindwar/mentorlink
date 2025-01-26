import { encryptData, decryptData } from './encryption';

export const secureLocalStorage = {
    setItem: (key, value) => {
        const encryptedValue = encryptData(value);
        if (encryptedValue) {
            localStorage.setItem(key, encryptedValue);
        }
    },

    getItem: (key) => {
        const encryptedValue = localStorage.getItem(key);
        if (!encryptedValue) return null;
        return decryptData(encryptedValue);
    },

    removeItem: (key) => {
        localStorage.removeItem(key);
    },

    clear: () => {
        localStorage.clear();
    }
};
