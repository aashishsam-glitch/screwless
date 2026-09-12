import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    let grievances

    if (user.role === 'officer') {
      // Officers see grievances across the state/department
      grievances = await prisma.grievance.findMany({
        include: {
          application: {
            include: {
              approvalType: true,
              applicant: { select: { name: true, email: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Applicants see only grievances they filed
      grievances = await prisma.grievance.findMany({
        where: { applicantId: user.id },
        include: {
          application: {
            include: {
              approvalType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ grievances })
  } catch (error) {
    console.error('List grievances error:', error)
    return NextResponse.json({ error: 'Failed to fetch grievances' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const { applicationId, subject, description, tier } = body

    if (!applicationId || !subject || !description) {
      return NextResponse.json(
        { error: 'applicationId, subject, and description are required' },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!app || app.applicantId !== user.id) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 })
    }

    const grievance = await prisma.grievance.create({
      data: {
        applicationId,
        applicantId: user.id,
        subject,
        description,
        tier: tier || 'tier_1_district',
        status: 'pending',
      },
      include: {
        application: { include: { approvalType: true } },
      },
    })

    return NextResponse.json({ grievance }, { status: 201 })
  } catch (error) {
    console.error('File grievance error:', error)
    return NextResponse.json({ error: 'Failed to submit grievance' }, { status: 500 })
  }
}
