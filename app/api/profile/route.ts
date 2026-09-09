import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if profile already exists
    const existing = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists. Use PUT to update.' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const { sector, scale, locationDistrict, inNotifiedIndustrialZone, riskCategory, stage } = body

    // Validate required fields
    if (!sector || !scale || !locationDistrict || inNotifiedIndustrialZone === undefined || !riskCategory || !stage) {
      return NextResponse.json(
        { error: 'All profile fields are required' },
        { status: 400 }
      )
    }

    const profile = await prisma.applicantProfile.create({
      data: {
        userId: user.id,
        sector,
        scale,
        locationDistrict,
        inNotifiedIndustrialZone: Boolean(inNotifiedIndustrialZone),
        riskCategory,
        stage,
      },
    })

    // Also update user name if provided
    if (body.name && !user.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name },
      })
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
