import crypto from 'crypto';

/**
 * Encrypt sensitive data (e.g. gateway API keys) using AES-256-GCM.
 * Uses ENCRYPTION_KEY env var, falls back to SUPABASE_SERVICE_ROLE_KEY.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  // Derive a 32-byte key via SHA-256
  return crypto.createHash('sha256').update(raw).digest();
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: base64(iv + authTag + ciphertext)
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();
    const data = Buffer.from(ciphertext, 'base64');
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = data.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}
