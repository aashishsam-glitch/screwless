import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createApplicationForUser } from '@/lib/applications'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const applications = await prisma.application.findMany({
      where: { applicantId: user.id },
      include: { approvalType: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json({ error: 'Failed to get applications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { approvalTypeId } = await request.json()
    if (!approvalTypeId) {
      return NextResponse.json({ error: 'approvalTypeId is required' }, { status: 400 })
    }

    const result = await createApplicationForUser(user.id, approvalTypeId)

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          missingDocuments: result.missingDocuments,
        },
        { status: result.statusCode || 400 }
      )
    }

    return NextResponse.json({ application: result.application }, { status: 201 })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
