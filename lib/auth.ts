import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production'
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000 // 30 seconds
const MAX_VERIFY_ATTEMPTS = 5

export interface OTPRecord {
  code: string
  createdAt: number
  expiresAt: number
  attempts: number
  lastSentAt: number
}

// Single persistent OTP store attached to globalThis (prevents module isolation issues across Next.js API route bundles)
const globalForOTP = globalThis as unknown as {
  otpStore: Map<string, OTPRecord> | undefined
}

export const otpStore = globalForOTP.otpStore ?? new Map<string, OTPRecord>()
if (process.env.NODE_ENV !== 'production') {
  globalForOTP.otpStore = otpStore
}

export interface SessionPayload {
  userId: string
  role: string
}

export type GenerateOTPResult =
  | { success: true; code: string }
  | { success: false; error: string; cooldownSeconds?: number }

/**
 * Generate a 6-digit cryptographically secure OTP for the given identifier.
 * Normalizes identifier and enforces a 30-second resend cooldown.
 */
export function generateOTP(identifier: string): GenerateOTPResult {
  const cleanId = identifier.trim().toLowerCase()
  const now = Date.now()
  const existing = otpStore.get(cleanId)

  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const cooldownSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000)
    return {
      success: false,
      error: `Please wait ${cooldownSeconds} seconds before requesting a new OTP.`,
      cooldownSeconds,
    }
  }

  // Generate cryptographically secure 6-digit OTP string
  const code = crypto.randomInt(100000, 1000000).toString()

  otpStore.set(cleanId, {
    code,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastSentAt: now,
  })

  // Console logging ONLY in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n╔══════════════════════════════════════╗')
    console.log('║         📱 MOCK OTP DELIVERY          ║')
    console.log('╠══════════════════════════════════════╣')
    console.log(`║  To: ${cleanId.padEnd(31)}║`)
    console.log(`║  OTP: ${code}                         ║`)
    console.log(`║  Expires in 5 minutes                ║`)
    console.log('╚══════════════════════════════════════╝\n')
  }

  return { success: true, code }
}

/**
 * Verify the OTP for the given identifier.
 * Enforces string normalization, 5-minute expiry, and a 5-attempt limit.
 * Does NOT delete the OTP before checking comparison.
 */
export function verifyOTP(identifier: string, inputCode: string): { valid: boolean; error?: string } {
  const cleanId = identifier.trim().toLowerCase()
  const enteredCode = String(inputCode).trim()

  const stored = otpStore.get(cleanId)
  if (!stored) {
    return { valid: false, error: 'OTP not found. Please request a new OTP.' }
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanId)
    return { valid: false, error: 'OTP has expired. Please request a new OTP.' }
  }

  if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(cleanId)
    return { valid: false, error: 'Too many attempts. Please request a new OTP.' }
  }

  if (stored.code !== enteredCode) {
    stored.attempts++
    if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
      otpStore.delete(cleanId)
      return { valid: false, error: 'Too many attempts. Please request a new OTP.' }
    }
    const remaining = MAX_VERIFY_ATTEMPTS - stored.attempts
    return {
      valid: false,
      error: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    }
  }

  // Consume OTP only on successful verification
  otpStore.delete(cleanId)
  return { valid: true }
}

/**
 * Create a JWT session token and set it as an HTTP-only cookie.
 */
export async function createSession(userId: string, role: string): Promise<string> {
  const token = jwt.sign(
    { userId, role } as SessionPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })

  return token
}

/**
 * Verify the session from cookies and return the payload.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload
    return payload
  } catch {
    return null
  }
}

/**
 * Get the current authenticated user from the session.
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  })

  return user
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
