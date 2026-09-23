import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  normalizeSector,
  normalizeScale,
  normalizeRiskCategory,
  normalizeStage,
} from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          ...profile,
          name: profile.user?.name || user.name || '',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid profile data' },
        { status: 400 }
      )
    }

    const {
      name,
      sector,
      scale,
      locationDistrict,
      inNotifiedIndustrialZone,
      riskCategory,
      stage,
    } = body

    // Validate required fields presence
    if (
      !sector ||
      !scale ||
      !locationDistrict ||
      inNotifiedIndustrialZone === undefined ||
      !riskCategory ||
      !stage
    ) {
      return NextResponse.json(
        { success: false, error: 'All profile fields are required' },
        { status: 400 }
      )
    }

    // Normalize and validate enum values (handles case insensitivity, labels, and enums)
    const normalizedSector = normalizeSector(sector)
    if (!normalizedSector) {
      return NextResponse.json(
        { success: false, error: `Invalid sector: "${sector}"` },
        { status: 400 }
      )
    }

    const normalizedScale = normalizeScale(scale)
    if (!normalizedScale) {
      return NextResponse.json(
        { success: false, error: `Invalid scale: "${scale}"` },
        { status: 400 }
      )
    }

    const normalizedRisk = normalizeRiskCategory(riskCategory)
    if (!normalizedRisk) {
      return NextResponse.json(
        { success: false, error: `Invalid riskCategory: "${riskCategory}"` },
        { status: 400 }
      )
    }

    const normalizedStage = normalizeStage(stage)
    if (!normalizedStage) {
      return NextResponse.json(
        { success: false, error: `Invalid stage: "${stage}"` },
        { status: 400 }
      )
    }

    const isZone =
      inNotifiedIndustrialZone === true ||
      inNotifiedIndustrialZone === 'true' ||
      inNotifiedIndustrialZone === 'Enabled' ||
      inNotifiedIndustrialZone === 'enabled' ||
      inNotifiedIndustrialZone === 1

    const districtStr = String(locationDistrict).trim()
    if (!districtStr) {
      return NextResponse.json(
        { success: false, error: 'District is required' },
        { status: 400 }
      )
    }

    // Upsert profile (creates if not existing, updates if already existing)
    const profile = await prisma.applicantProfile.upsert({
      where: { userId: user.id },
      update: {
        sector: normalizedSector,
        scale: normalizedScale,
        locationDistrict: districtStr,
        inNotifiedIndustrialZone: isZone,
        riskCategory: normalizedRisk,
        stage: normalizedStage,
      },
      create: {
        userId: user.id,
        sector: normalizedSector,
        scale: normalizedScale,
        locationDistrict: districtStr,
        inNotifiedIndustrialZone: isZone,
        riskCategory: normalizedRisk,
        stage: normalizedStage,
      },
    })

    // Update user name if provided
    const enterpriseName = typeof name === 'string' ? name.trim() : ''
    if (enterpriseName) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: enterpriseName },
      })
    }

    // Automatically synchronize company & industrial profile details into Personal Information
    const formattedAddress = `${districtStr}${isZone ? ', Notified Industrial Zone (MIDC)' : ''}, Maharashtra`

    // 1. Synchronize PersonalInfo without overwriting unrelated fields
    const existingPersonal = await prisma.personalInfo.findUnique({
      where: { userId: user.id },
    })

    if (existingPersonal) {
      await prisma.personalInfo.update({
        where: { userId: user.id },
        data: {
          fullName: enterpriseName || existingPersonal.fullName || user.name || 'Applicant',
          contactEmail: existingPersonal.contactEmail || user.email || null,
          contactPhone: existingPersonal.contactPhone || user.phone || null,
          address: formattedAddress,
        },
      })
    } else {
      await prisma.personalInfo.create({
        data: {
          userId: user.id,
          fullName: enterpriseName || user.name || 'Applicant',
          contactEmail: user.email || null,
          contactPhone: user.phone || null,
          address: formattedAddress,
        },
      })
    }

    // 2. Synchronize BusinessInfo without overwriting unrelated fields
    const existingBusiness = await prisma.businessInfo.findUnique({
      where: { userId: user.id },
    })

    const detectBusinessType = (bizName: string): 'proprietorship' | 'partnership' | 'pvt_ltd' | 'llp' | 'other' => {
      const lower = bizName.toLowerCase()
      if (lower.includes('pvt') || lower.includes('private limited')) return 'pvt_ltd'
      if (lower.includes('llp')) return 'llp'
      if (lower.includes('partnership')) return 'partnership'
      if (lower.includes('proprietor')) return 'proprietorship'
      return 'pvt_ltd'
    }

    const resolvedBizName = enterpriseName || existingBusiness?.businessName || user.name || 'Enterprise'
    const resolvedBizType = existingBusiness?.businessType || detectBusinessType(resolvedBizName)

    if (existingBusiness) {
      await prisma.businessInfo.update({
        where: { userId: user.id },
        data: {
          businessName: enterpriseName || existingBusiness.businessName,
        },
      })
    } else {
      await prisma.businessInfo.create({
        data: {
          userId: user.id,
          businessName: resolvedBizName,
          businessType: resolvedBizType,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile saved successfully',
        profile: {
          ...profile,
          name: enterpriseName || user.name || '',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Save profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}
