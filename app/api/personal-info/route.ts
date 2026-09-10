import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptField, maskAadhar, maskPan, validateAadhar, validatePan, decryptField } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const info = await prisma.personalInfo.findUnique({ where: { userId: user.id } })
    if (!info) return NextResponse.json({ personalInfo: null })

    const reveal = request.nextUrl.searchParams.get('reveal') === 'true'

    return NextResponse.json({
      personalInfo: {
        ...info,
        aadhar: reveal && info.aadharEncrypted ? decryptField(info.aadharEncrypted) : maskAadhar(info.aadharEncrypted),
        pan: reveal && info.panEncrypted ? decryptField(info.panEncrypted) : maskPan(info.panEncrypted),
        aadharEncrypted: undefined, // Never send raw encrypted data to client
        panEncrypted: undefined,
      },
    })
  } catch (error) {
    console.error('Get personal info error:', error)
    return NextResponse.json({ error: 'Failed to get personal info' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const { fullName, dob, aadhar, pan, address, contactEmail, contactPhone, alternateContact } = body

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    // Validate Aadhar if provided
    if (aadhar && !validateAadhar(aadhar)) {
      return NextResponse.json({ error: 'Invalid Aadhar number. Must be 12 digits.' }, { status: 400 })
    }

    // Validate PAN if provided
    if (pan && !validatePan(pan)) {
      return NextResponse.json({ error: 'Invalid PAN number. Must be in format ABCDE1234F.' }, { status: 400 })
    }

    // Encrypt sensitive fields
    const aadharEncrypted = aadhar ? encryptField(aadhar.replace(/\s/g, '')) : undefined
    const panEncrypted = pan ? encryptField(pan.toUpperCase()) : undefined

    // Upsert - create or update
    const info = await prisma.personalInfo.upsert({
      where: { userId: user.id },
      update: {
        fullName,
        dob: dob || null,
        ...(aadharEncrypted !== undefined && { aadharEncrypted }),
        ...(panEncrypted !== undefined && { panEncrypted }),
        address: address || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        alternateContact: alternateContact || null,
      },
      create: {
        userId: user.id,
        fullName,
        dob: dob || null,
        aadharEncrypted: aadharEncrypted || null,
        panEncrypted: panEncrypted || null,
        address: address || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        alternateContact: alternateContact || null,
      },
    })

    // Also update user name if it's not set
    if (!user.name && fullName) {
      await prisma.user.update({ where: { id: user.id }, data: { name: fullName } })
    }

    return NextResponse.json({
      personalInfo: {
        ...info,
        aadhar: maskAadhar(info.aadharEncrypted),
        pan: maskPan(info.panEncrypted),
        aadharEncrypted: undefined,
        panEncrypted: undefined,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Save personal info error:', error)
    return NextResponse.json({ error: 'Failed to save personal info' }, { status: 500 })
  }
}
