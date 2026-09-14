import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    let inspections

    if (user.role === 'officer') {
      inspections = await prisma.inspection.findMany({
        where: {
          officers: {
            some: {
              department: user.officerDepartment || undefined,
            },
          },
        },
        include: {
          application: {
            include: {
              approvalType: true,
              applicant: { select: { name: true, email: true, phone: true } },
            },
          },
          officers: {
            include: {
              officer: { select: { name: true, email: true, officerDepartment: true } },
            },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      })
    } else {
      inspections = await prisma.inspection.findMany({
        where: {
          application: {
            applicantId: user.id,
          },
        },
        include: {
          application: {
            include: {
              approvalType: true,
            },
          },
          officers: {
            include: {
              officer: { select: { name: true, officerDepartment: true } },
            },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      })
    }

    return NextResponse.json({ inspections })
  } catch (error) {
    console.error('List inspections error:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Unauthorized. Officers only.' }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, scheduledDate, departments, findings } = body

    if (!applicationId || !scheduledDate || !departments || !Array.isArray(departments) || departments.length === 0) {
      return NextResponse.json(
        { error: 'applicationId, scheduledDate, and at least one department are required' },
        { status: 400 }
      )
    }

    // BUG 14: Validate application existence and workflow status
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { approvalType: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status === 'approved' || application.status === 'rejected') {
      return NextResponse.json(
        { error: `Cannot schedule inspection for an application that is already ${application.status}` },
        { status: 400 }
      )
    }

    // BUG 16: Check for existing active/scheduled inspection for this application
    const existingActiveInspection = await prisma.inspection.findFirst({
      where: {
        applicationId,
        status: { in: ['scheduled', 'in_progress'] },
      },
    })

    if (existingActiveInspection) {
      return NextResponse.json(
        {
          error: 'Duplicate inspection prevented: An active inspection is already scheduled for this application.',
          inspectionId: existingActiveInspection.id,
        },
        { status: 409 }
      )
    }

    // BUG 15: Validate that an officer exists for EVERY requested department
    const assignedOfficers = await prisma.user.findMany({
      where: {
        role: 'officer',
        officerDepartment: { in: departments },
      },
    })

    const foundDepartments = new Set(assignedOfficers.map((o) => o.officerDepartment))
    const missingDepartments = departments.filter((dept: string) => !foundDepartments.has(dept))

    if (missingDepartments.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot create joint inspection: No active officer found for department(s): ${missingDepartments.join(', ')}`,
          missingDepartments,
        },
        { status: 400 }
      )
    }

    const inspection = await prisma.inspection.create({
      data: {
        applicationId,
        scheduledDate: new Date(scheduledDate),
        status: 'scheduled',
        findings: findings || null,
        officers: {
          create: assignedOfficers.map((off) => ({
            officerId: off.id,
            department: off.officerDepartment || 'general',
          })),
        },
      },
      include: {
        application: { include: { approvalType: true } },
        officers: { include: { officer: true } },
      },
    })

    return NextResponse.json({ inspection }, { status: 201 })
  } catch (error) {
    console.error('Create joint inspection error:', error)
    return NextResponse.json({ error: 'Failed to schedule joint inspection' }, { status: 500 })
  }
}
