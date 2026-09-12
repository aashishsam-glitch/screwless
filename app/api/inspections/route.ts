import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    let inspections

    if (user.role === 'officer') {
      // Officer sees inspections where their department or user is assigned
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
              officer: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      })
    } else {
      // Applicant sees inspections for their applications
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

    if (!applicationId || !scheduledDate || !departments || departments.length === 0) {
      return NextResponse.json(
        { error: 'applicationId, scheduledDate, and at least one department are required' },
        { status: 400 }
      )
    }

    // Find officer accounts corresponding to the requested departments
    const assignedOfficers = await prisma.user.findMany({
      where: {
        role: 'officer',
        officerDepartment: { in: departments },
      },
    })

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
