import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDocumentReadiness } from '@/lib/documents'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await context.params

    // 1. Find existing application by Application.id
    let application: any = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessInfo: true,
            personalInfo: true,
          },
        },
        approvalType: {
          include: {
            dependsOn: true,
          },
        },
        applicationDocuments: {
          include: {
            document: true,
            comments: {
              include: {
                officer: {
                  select: { name: true, officerDepartment: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    // 2. If not found by application.id, check if id is an approvalTypeId for this user
    if (!application) {
      const approvalType = await prisma.approvalType.findUnique({
        where: { id },
        include: { dependsOn: true },
      })

      if (approvalType) {
        // Search if user has an existing submitted application for this approval type
        const existingApp = await prisma.application.findFirst({
          where: {
            applicantId: user.id,
            approvalTypeId: approvalType.id,
          },
          include: {
            approvalType: { include: { dependsOn: true } },
            applicationDocuments: {
              include: {
                document: true,
                comments: {
                  include: {
                    officer: { select: { name: true, officerDepartment: true } },
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        })

        if (existingApp) {
          application = existingApp
        } else {
          // Pre-application view: Do NOT auto-create application in database
          const readiness = await getDocumentReadiness(approvalType.id, user.id)
          const unsubmittedApp = {
            id: approvalType.id,
            applicantId: user.id,
            approvalTypeId: approvalType.id,
            status: 'not_started',
            assignedOfficerDept: approvalType.department,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvalType,
            applicationDocuments: [],
          }
          return NextResponse.json({ application: unsubmittedApp, readiness })
        }
      }
    }

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (user.role !== 'officer' && application.applicantId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get document readiness
    const readiness = await getDocumentReadiness(application.approvalTypeId, application.applicantId, application.id)

    return NextResponse.json({ application, readiness })
  } catch (error) {
    console.error('Get application detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}
