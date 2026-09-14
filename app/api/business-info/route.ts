import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidBusinessType } from '@/lib/validation'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const info = await prisma.businessInfo.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ businessInfo: info })
  } catch (error) {
    console.error('Get business info error:', error)
    return NextResponse.json({ error: 'Failed to get business info' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const { businessName, businessType, gstin, udyamRegistrationNumber, incorporationDate } = body

    if (!businessName || !businessType) {
      return NextResponse.json({ error: 'Business name and type are required' }, { status: 400 })
    }

    if (!isValidBusinessType(businessType)) {
      return NextResponse.json({ error: `Invalid businessType: "${businessType}"` }, { status: 400 })
    }

    // Validate GSTIN format if provided (15 chars)
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid GSTIN format' }, { status: 400 })
    }

    const info = await prisma.businessInfo.upsert({
      where: { userId: user.id },
      update: {
        businessName,
        businessType,
        gstin: gstin || null,
        udyamRegistrationNumber: udyamRegistrationNumber || null,
        incorporationDate: incorporationDate || null,
      },
      create: {
        userId: user.id,
        businessName,
        businessType,
        gstin: gstin || null,
        udyamRegistrationNumber: udyamRegistrationNumber || null,
        incorporationDate: incorporationDate || null,
      },
    })

    return NextResponse.json({ businessInfo: info }, { status: 201 })
  } catch (error) {
    console.error('Save business info error:', error)
    return NextResponse.json({ error: 'Failed to save business info' }, { status: 500 })
  }
}
