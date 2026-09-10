import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get the 32-byte encryption key from environment.
 * IMPORTANT: In production, use a proper key management system (AWS KMS, HashiCorp Vault, etc.)
 */
function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a combined string: base64(iv):base64(authTag):base64(ciphertext)
 * 
 * SECURITY: Never log the plaintext value of Aadhar/PAN numbers.
 */
export function encryptField(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt an encrypted string produced by encryptField().
 * Returns the original plaintext.
 * 
 * SECURITY: Only call this when the user explicitly requests to reveal.
 * Never log the decrypted value.
 */
export function decryptField(encrypted: string): string {
  const key = getKey()
  const [ivBase64, authTagBase64, ciphertext] = encrypted.split(':')
  
  if (!ivBase64 || !authTagBase64 || !ciphertext) {
    throw new Error('Invalid encrypted field format')
  }
  
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Mask an Aadhar number to show only last 4 digits.
 * Input: encrypted string from DB
 * Output: "XXXX XXXX 1234"
 */
export function maskAadhar(encrypted: string | null): string | null {
  if (!encrypted) return null
  try {
    const plain = decryptField(encrypted)
    const last4 = plain.slice(-4)
    return `XXXX XXXX ${last4}`
  } catch {
    return 'XXXX XXXX XXXX'
  }
}

/**
 * Mask a PAN number to show only last 4 characters.
 * Input: encrypted string from DB
 * Output: "XXXXXX1234"
 */
export function maskPan(encrypted: string | null): string | null {
  if (!encrypted) return null
  try {
    const plain = decryptField(encrypted)
    const last4 = plain.slice(-4)
    return `XXXXXX${last4}`
  } catch {
    return 'XXXXXXXXXX'
  }
}

/**
 * Validate Aadhar number format: exactly 12 digits.
 */
export function validateAadhar(aadhar: string): boolean {
  return /^\d{12}$/.test(aadhar.replace(/\s/g, ''))
}

/**
 * Validate PAN number format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F).
 */
export function validatePan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase())
}
