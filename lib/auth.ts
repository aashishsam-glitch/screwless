import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// In-memory OTP store (fine for MVP, use Redis in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>()

export interface SessionPayload {
  userId: string
  role: string
}

/**
 * Generate a 6-digit OTP for the given identifier (email or phone).
 * Logs the OTP to the console instead of sending via SMS/email.
 */
export function generateOTP(identifier: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore.set(identifier, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  })

  // Mock OTP delivery — log to console
  console.log('\n╔══════════════════════════════════════╗')
  console.log('║         📱 MOCK OTP DELIVERY          ║')
  console.log('╠══════════════════════════════════════╣')
  console.log(`║  To: ${identifier.padEnd(31)}║`)
  console.log(`║  OTP: ${code}                         ║`)
  console.log(`║  Expires in 5 minutes                ║`)
  console.log('╚══════════════════════════════════════╝\n')

  return code
}

/**
 * Verify the OTP for the given identifier.
 * Returns true if valid, false otherwise.
 */
export function verifyOTP(identifier: string, code: string): boolean {
  const stored = otpStore.get(identifier)
  if (!stored) return false
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier)
    return false
  }
  if (stored.code !== code) return false
  otpStore.delete(identifier) // One-time use
  return true
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
 * Returns null if no valid session exists.
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
 * Returns the full User object or null.
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
