import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get the approval type to find the department
    const approvalType = await prisma.approvalType.findUnique({
      where: { id: approvalTypeId },
    })
    if (!approvalType) {
      return NextResponse.json({ error: 'Approval type not found' }, { status: 404 })
    }

    // Check if application already exists
    const existing = await prisma.application.findFirst({
      where: {
        applicantId: user.id,
        approvalTypeId,
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Application already submitted for this approval type' },
        { status: 409 }
      )
    }

    // Get applicant's risk category from profile
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile required' }, { status: 400 })
    }

    // Check dependency: if this approval depends on another, that must be approved first
    if (approvalType.dependsOnId) {
      const prerequisite = await prisma.application.findFirst({
        where: {
          applicantId: user.id,
          approvalTypeId: approvalType.dependsOnId,
          status: 'approved',
        },
      })
      if (!prerequisite) {
        const depType = await prisma.approvalType.findUnique({
          where: { id: approvalType.dependsOnId },
        })
        return NextResponse.json(
          { error: `Prerequisite not met: "${depType?.name}" must be approved first` },
          { status: 422 }
        )
      }
    }

    const application = await prisma.application.create({
      data: {
        applicantId: user.id,
        approvalTypeId,
        status: 'submitted',
        riskCategory: profile.riskCategory,
        assignedOfficerDept: approvalType.department,
      },
      include: { approvalType: true },
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
