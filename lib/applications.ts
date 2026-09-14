import { prisma } from './prisma'
import { getMatchingApprovals } from './matching'
import { computeApprovalReadiness } from './documents'
import type { Application } from '@prisma/client'

export interface CreateApplicationResult {
  success: boolean
  application?: Application & { approvalType: any }
  error?: string
  message?: string
  missingDocuments?: string[]
  statusCode?: number
}

/**
 * Centralized service function to create an application for a user.
 * Performs:
 * 1. Auth & profile check
 * 2. Duplicate submission check
 * 3. Matching engine validation (applies to applicant sector/scale/risk/zone)
 * 4. Prerequisite dependency validation
 * 5. Mandatory document readiness validation (returns HTTP 422 if mandatory docs incomplete)
 * 6. SLA duration & due date calculation
 * 7. Initial Application & ApplicationDocument record creation (attaches valid vault docs)
 */
export async function createApplicationForUser(
  userId: string,
  approvalTypeId: string
): Promise<CreateApplicationResult> {
  // 1. Fetch user & profile
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
  })

  if (!profile) {
    return {
      success: false,
      error: 'Applicant industrial profile required before creating applications',
      statusCode: 400,
    }
  }

  // 2. Fetch target approval type
  const approvalType = await prisma.approvalType.findUnique({
    where: { id: approvalTypeId },
    include: {
      dependsOn: true,
      documentRequirements: true,
    },
  })

  if (!approvalType) {
    return {
      success: false,
      error: 'Approval type not found',
      statusCode: 404,
    }
  }

  // 3. Duplicate submission check
  const existing = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      approvalTypeId,
    },
    include: { approvalType: true },
  })

  if (existing) {
    return {
      success: true,
      application: existing,
    }
  }

  // 4. Matching engine validation
  const matchedApprovals = await getMatchingApprovals(profile, userId)
  const matchesProfile = matchedApprovals.some((m) => m.approvalType.id === approvalTypeId)

  if (!matchesProfile) {
    return {
      success: false,
      error: `Approval "${approvalType.name}" does not apply to your business profile (${profile.sector}, ${profile.scale}, ${profile.riskCategory} risk)`,
      statusCode: 422,
    }
  }

  // 5. Prerequisite dependency validation
  if (approvalType.dependsOnId) {
    const prerequisite = await prisma.application.findFirst({
      where: {
        applicantId: userId,
        approvalTypeId: approvalType.dependsOnId,
        status: 'approved',
      },
    })

    if (!prerequisite) {
      const depType = await prisma.approvalType.findUnique({
        where: { id: approvalType.dependsOnId },
      })
      return {
        success: false,
        error: `Prerequisite not met: "${depType?.name || 'Prerequisite Approval'}" must be approved first`,
        statusCode: 422,
      }
    }
  }

  // 6. Mandatory Document Readiness Verification
  const userDocs = await prisma.document.findMany({
    where: { userId },
  })

  const readiness = computeApprovalReadiness(approvalType.documentRequirements, userDocs)

  if (!readiness.isReadyToApply) {
    return {
      success: false,
      error: 'Application is not ready',
      message: 'Complete all mandatory documents before applying.',
      missingDocuments: readiness.missingDocuments,
      statusCode: 422,
    }
  }

  // 7. SLA Duration & SLA Due Date Calculation (Bug 5)
  // Default SLA days: 30 days unless specific SLA duration configured
  const slaDays = 30
  const now = new Date()
  const slaDueDate = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000)

  // 8. Create application & populate initial document requirements with vault docs attached
  const application = await prisma.application.create({
    data: {
      applicantId: userId,
      approvalTypeId,
      status: 'submitted',
      riskCategory: profile.riskCategory,
      assignedOfficerDept: approvalType.department,
      slaDays,
      slaDueDate,
      applicationDocuments: {
        create: approvalType.documentRequirements.map((req) => {
          const reqItem = readiness.requirements.find((r) => r.id === req.id)
          const vaultDoc = reqItem?.isReady ? reqItem.document : null
          return {
            documentType: req.documentType,
            documentId: vaultDoc?.id || null,
            status: vaultDoc ? 'attached' : 'missing',
          }
        }),
      },
    },
    include: { approvalType: true },
  })

  return {
    success: true,
    application,
  }
}
