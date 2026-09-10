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

    // Find application by ID or by approvalTypeId for current user
    let application = await prisma.application.findUnique({
      where: { id },
      include: {
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

    // If not found by application.id, check if id is an approvalTypeId for this user
    if (!application) {
      const approvalType = await prisma.approvalType.findUnique({
        where: { id },
        include: { dependsOn: true },
      })

      if (approvalType) {
        // Find or create application in not_started state
        let existingApp = await prisma.application.findFirst({
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

        if (!existingApp) {
          const profile = await prisma.applicantProfile.findUnique({
            where: { userId: user.id },
          })
          existingApp = await prisma.application.create({
            data: {
              applicantId: user.id,
              approvalTypeId: approvalType.id,
              status: 'not_started',
              riskCategory: profile?.riskCategory || 'green',
              assignedOfficerDept: approvalType.department,
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
        }
        application = existingApp
      }
    }

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (user.role !== 'officer' && application.applicantId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get document readiness
    const readiness = await getDocumentReadiness(application.approvalTypeId, application.applicantId)

    return NextResponse.json({ application, readiness })
  } catch (error) {
    console.error('Get application detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}
