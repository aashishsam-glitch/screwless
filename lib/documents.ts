import { prisma } from './prisma'
import type { Document, DocumentType, DocStatus } from '@prisma/client'

export type DocumentStatusValue = 'valid' | 'expiring_soon' | 'expired' | 'not_applicable'

export interface DocumentStatusInfo {
  status: DocumentStatusValue
  label: string
  daysUntilExpiry: number | null
}

export type DetailedReadinessStatus =
  | 'verified'
  | 'attached_unverified'
  | 'valid_in_vault'
  | 'expiring_soon'
  | 'expired'
  | 'rejected'
  | 'missing'

/**
 * Pure function: compute document status from expiry date.
 */
export function getDocumentStatus(expiryDate: Date | null): DocumentStatusInfo {
  if (!expiryDate) {
    return { status: 'not_applicable', label: 'N/A', daysUntilExpiry: null }
  }

  const now = new Date()
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'expired', label: 'Expired', daysUntilExpiry: diffDays }
  }
  if (diffDays <= 30) {
    return { status: 'expiring_soon', label: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`, daysUntilExpiry: diffDays }
  }
  return { status: 'valid', label: 'Valid', daysUntilExpiry: diffDays }
}

/**
 * Get documents with alerts (expiring_soon or expired) for a user.
 */
export async function getDocumentAlerts(userId: string) {
  const documents = await prisma.document.findMany({
    where: { userId },
  })

  return documents
    .map(doc => ({
      ...doc,
      statusInfo: getDocumentStatus(doc.expiryDate),
    }))
    .filter(doc => doc.statusInfo.status === 'expiring_soon' || doc.statusInfo.status === 'expired')
    .sort((a, b) => {
      if (a.statusInfo.status === 'expired' && b.statusInfo.status !== 'expired') return -1
      if (a.statusInfo.status !== 'expired' && b.statusInfo.status === 'expired') return 1
      return (a.statusInfo.daysUntilExpiry ?? 0) - (b.statusInfo.daysUntilExpiry ?? 0)
    })
}

export interface DocumentRequirementItem {
  id: string
  documentType: DocumentType
  formattedName: string
  isMandatory: boolean
  isReady: boolean
  readinessStatus: DetailedReadinessStatus
  statusInfo: DocumentStatusInfo
  document?: Document | null
  reason?: string
}

export interface ApprovalReadinessSummary {
  totalRequired: number
  readyCount: number
  readinessPct: number
  isReadyToApply: boolean
  missingDocuments: string[]
  requirements: DocumentRequirementItem[]
}

/**
 * Pure function: compute approval readiness summary from document requirements,
 * user vault documents, and optional application document attachments.
 */
export function computeApprovalReadiness(
  requirements: Array<{ id: string; documentType: DocumentType; isMandatory: boolean }>,
  userDocs: Array<{ id: string; documentType: DocumentType; expiryDate: Date | null; [key: string]: any }>,
  appDocs: Array<{ documentType: DocumentType; status: DocStatus }> = []
): ApprovalReadinessSummary {
  const reqItems: DocumentRequirementItem[] = []

  for (const req of requirements) {
    const matchingVaultDoc = userDocs.find(doc => doc.documentType === req.documentType) as Document | undefined
    const matchingAppDoc = appDocs.find(ad => ad.documentType === req.documentType)

    const statusInfo = getDocumentStatus(matchingVaultDoc?.expiryDate ?? null)

    let readinessStatus: DetailedReadinessStatus = 'missing'
    let isReady = false

    if (matchingVaultDoc) {
      if (statusInfo.status === 'expired') {
        readinessStatus = 'expired'
      } else if (matchingAppDoc?.status === 'rejected') {
        readinessStatus = 'rejected'
      } else if (matchingAppDoc?.status === 'verified') {
        readinessStatus = 'verified'
        isReady = true
      } else if (matchingAppDoc?.status === 'attached') {
        readinessStatus = 'attached_unverified'
        isReady = true
      } else {
        readinessStatus = statusInfo.status === 'expiring_soon' ? 'expiring_soon' : 'valid_in_vault'
        isReady = true
      }
    }

    if (readinessStatus === 'expired' || readinessStatus === 'rejected' || readinessStatus === 'missing') {
      isReady = false
    }

    let reason: string | undefined = undefined
    if (!isReady) {
      reason =
        readinessStatus === 'expired'
          ? 'Uploaded document has expired'
          : readinessStatus === 'rejected'
          ? 'Previously attached document was rejected'
          : 'Document not found in vault'
    }

    reqItems.push({
      id: req.id,
      documentType: req.documentType,
      formattedName: formatDocumentType(req.documentType),
      isMandatory: req.isMandatory,
      isReady,
      readinessStatus,
      statusInfo,
      document: matchingVaultDoc || null,
      reason,
    })
  }

  const mandatoryReqs = reqItems.filter(r => r.isMandatory)
  const totalRequired = mandatoryReqs.length
  const readyCount = mandatoryReqs.filter(r => r.isReady).length
  const isReadyToApply = totalRequired === 0 || readyCount === totalRequired
  const readinessPct = totalRequired > 0 ? Math.round((readyCount / totalRequired) * 100) : 100
  const missingDocuments = mandatoryReqs.filter(r => !r.isReady).map(r => r.formattedName)

  return {
    totalRequired,
    readyCount,
    readinessPct,
    isReadyToApply,
    missingDocuments,
    requirements: reqItems,
  }
}

/**
 * Get document readiness for a specific approval type and user.
 * Cross-references vault documents & application attachment verification status.
 * Distinguishes: missing, attached, verified, rejected, expired, expiring_soon.
 */
export async function getDocumentReadiness(
  approvalTypeId: string,
  userId: string,
  applicationId?: string
) {
  const requirements = await prisma.approvalTypeDocumentRequirement.findMany({
    where: { approvalTypeId },
  })

  const userDocs = await prisma.document.findMany({
    where: { userId },
  })

  let appDocs: Array<{
    id: string
    documentType: DocumentType
    status: DocStatus
    documentId: string | null
  }> = []

  if (applicationId) {
    appDocs = await prisma.applicationDocument.findMany({
      where: { applicationId },
    })
  }

  const summary = computeApprovalReadiness(requirements, userDocs, appDocs)

  const have: Array<{
    requirement: typeof requirements[0]
    document: typeof userDocs[0]
    statusInfo: DocumentStatusInfo
    readinessStatus: DetailedReadinessStatus
    isReadyForApproval: boolean
  }> = []

  const need: Array<{
    requirement: typeof requirements[0]
    reason?: string
  }> = []

  for (const item of summary.requirements) {
    const req = requirements.find(r => r.id === item.id) || {
      id: item.id,
      approvalTypeId,
      documentType: item.documentType,
      isMandatory: item.isMandatory,
    }
    const matchingVaultDoc = userDocs.find(doc => doc.documentType === item.documentType)

    if (item.isReady && matchingVaultDoc) {
      have.push({
        requirement: req,
        document: matchingVaultDoc,
        statusInfo: item.statusInfo,
        readinessStatus: item.readinessStatus,
        isReadyForApproval: item.isReady,
      })
    } else {
      need.push({
        requirement: req,
        reason: item.reason,
      })
    }
  }

  return { have, need, requirements, summary }
}

/** Format a DocumentType enum value for display */
export function formatDocumentType(type: string): string {
  const map: Record<string, string> = {
    aadhar: 'Aadhar Card',
    pan: 'PAN Card',
    gstin_certificate: 'GSTIN Certificate',
    factory_layout_plan: 'Factory Layout Plan',
    land_ownership_proof: 'Land Ownership Proof',
    electricity_bill: 'Electricity Bill',
    building_plan_copy: 'Building Plan Copy',
    fire_safety_layout: 'Fire Safety Layout',
    pollution_control_cert: 'Pollution Control Certificate',
    water_usage_plan: 'Water Usage Plan',
    labour_license_copy: 'Labour License Copy',
    noc_previous: 'Previous NOC Copy',
    incorporation_cert: 'Certificate of Incorporation',
    udyam_certificate: 'Udyam Registration Certificate',
    other: 'Other Document',
  }
  return map[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
