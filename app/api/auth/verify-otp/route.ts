import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP, createSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { identifier, code, name } = await request.json()

    if (!identifier || !code) {
      return NextResponse.json(
        { error: 'Identifier and OTP code are required' },
        { status: 400 }
      )
    }

    const isValid = verifyOTP(identifier.trim(), code.trim())
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@')
    const whereClause = isEmail
      ? { email: identifier.trim() }
      : { phone: identifier.trim() }

    // Find or create user
    let user = await prisma.user.findFirst({ where: whereClause })

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...whereClause,
          name: name || null,
          role: 'applicant', // Default role for new signups
        },
      })
    }

    // Check if user has a profile
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
    })

    // Create session
    await createSession(user.id, user.role)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        officerDepartment: user.officerDepartment,
      },
      hasProfile: !!profile,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
