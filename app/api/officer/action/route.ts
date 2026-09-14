import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationStatus } from '@prisma/client'
import { getDocumentStatus } from '@/lib/documents'

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
      include: {
        approvalType: {
          include: {
            documentRequirements: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const assignedDept = application.assignedOfficerDept || application.approvalType.department
    if (user.officerDepartment !== assignedDept) {
      return NextResponse.json(
        { error: 'Forbidden: This application is not assigned to your department' },
        { status: 403 }
      )
    }

    // Enforcement: Check mandatory document readiness and verification before allowing approval
    if (action === 'approve') {
      const mandatoryReqs = application.approvalType.documentRequirements.filter((r) => r.isMandatory)

      const appDocs = await prisma.applicationDocument.findMany({
        where: { applicationId },
        include: { document: true },
      })

      const unverifiedList: string[] = []

      for (const req of mandatoryReqs) {
        const matchingDoc = appDocs.find((d) => d.documentType === req.documentType)

        if (!matchingDoc || matchingDoc.status === 'missing') {
          unverifiedList.push(`${req.documentType} (missing)`)
        } else if (matchingDoc.status === 'rejected') {
          unverifiedList.push(`${req.documentType} (rejected)`)
        } else if (matchingDoc.status !== 'verified') {
          unverifiedList.push(`${req.documentType} (pending verification)`)
        } else if (matchingDoc.document?.expiryDate) {
          const statusInfo = getDocumentStatus(matchingDoc.document.expiryDate)
          if (statusInfo.status === 'expired') {
            unverifiedList.push(`${req.documentType} (expired)`)
          }
        }
      }

      if (unverifiedList.length > 0) {
        return NextResponse.json(
          {
            error: 'Application cannot be approved until all mandatory documents are verified.',
            detail: `Unverified mandatory documents: ${unverifiedList.join(', ')}`,
            unverifiedDocuments: unverifiedList,
          },
          { status: 422 }
        )
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

    console.log(
      `\n📝 Officer ${user.name} ${action}d application ${applicationId} (${updated.approvalType.name} for ${updated.applicant.name})\n`
    )

    return NextResponse.json({ application: updated })
  } catch (error) {
    console.error('Officer action error:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
