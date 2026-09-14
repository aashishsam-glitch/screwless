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

    const verification = verifyOTP(identifier, code)
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    const cleanId = identifier.trim()
    const isEmail = cleanId.includes('@')
    const whereClause = isEmail
      ? { email: cleanId.toLowerCase() }
      : { phone: cleanId }

    let user = await prisma.user.findFirst({ where: whereClause })

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...whereClause,
          name: name ? name.trim() : null,
          role: 'applicant',
        },
      })
    }

    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
    })

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
