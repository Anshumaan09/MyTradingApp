// A-03: AES-256-GCM Encryption Utility
// Uses the Web Crypto API for browser-native encryption.
// Used to encrypt sensitive fields (PAN, bank account) before storing in DB.
// In production, encryption should happen server-side (Edge Function / backend).

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

/**
 * Derive an encryption key from a passphrase using PBKDF2
 * In production, use a env-based master key instead of passphrase.
 */
async function deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt plaintext string → base64 encoded ciphertext
 * @param {string} plaintext - Data to encrypt
 * @param {string} passphrase - Encryption key/passphrase
 * @returns {Promise<string>} base64(salt + iv + ciphertext)
 */
export async function encrypt(plaintext, passphrase) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(passphrase, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encoder.encode(plaintext)
    );

    // Combine: salt(16) + iv(12) + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt base64 ciphertext → plaintext string
 * @param {string} encryptedBase64 - base64(salt + iv + ciphertext)
 * @param {string} passphrase - Encryption key/passphrase
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(encryptedBase64, passphrase) {
    const combined = new Uint8Array(
        atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
    );

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const ciphertext = combined.slice(16 + IV_LENGTH);

    const key = await deriveKey(passphrase, salt);

    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Hash a value using SHA-256 (for PAN verification comparison)
 * @param {string} value
 * @returns {Promise<string>} hex hash
 */
export async function sha256(value) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for display
 * "ABCDE1234F" → "XXXXX1234F" (PAN)
 * "12345678901234" → "XXXXXXXXXX1234" (Bank Account)
 */
export function maskSensitive(value, visibleChars = 4) {
    if (!value || value.length <= visibleChars) return value;
    return 'X'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
}
