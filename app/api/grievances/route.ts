import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    let grievances

    if (user.role === 'officer') {
      // Officers see grievances for their department or state-level tier_2 grievances
      grievances = await prisma.grievance.findMany({
        where: {
          OR: [
            {
              application: {
                assignedOfficerDept: user.officerDepartment || undefined,
              },
            },
            {
              tier: 'tier_2_state',
            },
          ],
        },
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
    const { applicationId, subject, description, requestedTier } = body

    if (!applicationId || !subject || !description || !subject.trim() || !description.trim()) {
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

    // Server-enforced tier calculation:
    // Check if a Tier 1 grievance already exists for this application
    const existingTier1 = await prisma.grievance.findFirst({
      where: {
        applicationId,
        tier: 'tier_1_district',
      },
      orderBy: { createdAt: 'desc' },
    })

    let assignedTier: 'tier_1_district' | 'tier_2_state' = 'tier_1_district'

    if (requestedTier === 'tier_2_state') {
      // Client explicitly requested escalation to Tier 2
      if (!existingTier1) {
        return NextResponse.json(
          {
            error:
              'Invalid escalation: A Tier 1 District grievance must be submitted first before escalating to Tier 2 State.',
          },
          { status: 422 }
        )
      }
      if (existingTier1.status === 'pending' || existingTier1.status === 'under_review') {
        // Allow escalation only if Tier 1 has been pending for over 7 days or is explicitly unresolved/rejected
        const daysPending = (Date.now() - existingTier1.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysPending < 7) {
          return NextResponse.json(
            {
              error:
                'Tier 1 District grievance is currently active. Escalation to Tier 2 is allowed only after 7 days without resolution or upon rejection.',
            },
            { status: 422 }
          )
        }
      }
      assignedTier = 'tier_2_state'
    }

    const grievance = await prisma.grievance.create({
      data: {
        applicationId,
        applicantId: user.id,
        subject: subject.trim(),
        description: description.trim(),
        tier: assignedTier,
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
