import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationStatus } from '@prisma/client'

const ACTION_STATUS_MAP: Record<string, ApplicationStatus> = {
  approve: 'approved',
  reject: 'rejected',
  request_info: 'info_requested',
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { applicationId, action } = await request.json()

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'applicationId and action are required' },
        { status: 400 }
      )
    }

    const newStatus = ACTION_STATUS_MAP[action]
    if (!newStatus) {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve, reject, or request_info' },
        { status: 400 }
      )
    }

    // Verify the application belongs to this officer's department
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { approvalType: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.assignedOfficerDept !== user.officerDepartment) {
      return NextResponse.json(
        { error: 'This application is not assigned to your department' },
        { status: 403 }
      )
    }

    // Phase 9 Enforcement: Check mandatory document readiness before allowing approval
    if (action === 'approve') {
      const mandatoryReqs = await prisma.approvalTypeDocumentRequirement.findMany({
        where: {
          approvalTypeId: application.approvalTypeId,
          isMandatory: true,
        },
      })

      const appDocs = await prisma.applicationDocument.findMany({
        where: { applicationId },
      })

      for (const req of mandatoryReqs) {
        const matchingDoc = appDocs.find((d) => d.documentType === req.documentType)
        if (!matchingDoc || matchingDoc.status === 'missing') {
          return NextResponse.json(
            {
              error: `Cannot approve: Mandatory document "${req.documentType}" has not been attached by applicant.`,
            },
            { status: 400 }
          )
        }
        if (matchingDoc.status === 'rejected') {
          return NextResponse.json(
            {
              error: `Cannot approve: Mandatory document "${req.documentType}" has been rejected. It must be re-submitted and verified.`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Update application status
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus },
      include: {
        approvalType: true,
        applicant: { select: { name: true, email: true } },
      },
    })

    console.log(`\n📝 Officer ${user.name} ${action}d application ${applicationId} (${updated.approvalType.name} for ${updated.applicant.name})\n`)

    return NextResponse.json({ application: updated })
  } catch (error) {
    console.error('Officer action error:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
