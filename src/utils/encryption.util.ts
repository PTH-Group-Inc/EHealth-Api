import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const TAG_LENGTH = 16;

export class EncryptionUtil {
    /**
     * Encrypts a plaintext string using AES-256-GCM.
     * @param text The plaintext string to encrypt.
     * @param key The 32-byte hex key (default to env.encryption.currentKey).
     * @returns A string in the format: iv:tag:ciphertext
     */
    static encrypt(text: string, keyString: string = env.encryption.currentKey): string {
        if (!text) return text;
        if (!keyString || keyString.length !== 64) {
            throw new Error('Encryption key must be a 64-character hex string (32 bytes).');
        }

        const key = Buffer.from(keyString, 'hex');
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypts a ciphertext string back to plaintext.
     * @param encryptedData The string in the format: iv:tag:ciphertext
     * @param keyString The 32-byte hex key (default to env.encryption.currentKey). If decryption fails, it will attempt using previousKey.
     * @returns The decrypted plaintext string.
     */
    static decrypt(encryptedData: string, keyString: string = env.encryption.currentKey): string {
        if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

        try {
            return this.decryptWithKey(encryptedData, keyString);
        } catch (error) {
            // Attempt key rotation if previous key exists
            if (keyString === env.encryption.currentKey && env.encryption.previousKey) {
                try {
                    return this.decryptWithKey(encryptedData, env.encryption.previousKey);
                } catch (fallbackError) {
                    throw new Error('Failed to decrypt data with current and previous keys.');
                }
            }
            throw new Error('Failed to decrypt data.');
        }
    }

    private static decryptWithKey(encryptedData: string, keyString: string): string {
        if (!keyString || keyString.length !== 64) {
            throw new Error('Encryption key must be a 64-character hex string (32 bytes).');
        }

        const key = Buffer.from(keyString, 'hex');
        const [ivHex, tagHex, encryptedHex] = encryptedData.split(':');

        if (!ivHex || !tagHex || !encryptedHex) {
            throw new Error('Invalid encrypted data format.');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
