import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()

    if (!identifier || identifier.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    const result = generateOTP(identifier.trim())
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully. Check the server console for the OTP code.',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
