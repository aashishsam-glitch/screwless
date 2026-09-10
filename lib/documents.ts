import { prisma } from './prisma'
import type { Document, DocumentType } from '@prisma/client'

export type DocumentStatusValue = 'valid' | 'expiring_soon' | 'expired' | 'not_applicable'

export interface DocumentStatusInfo {
  status: DocumentStatusValue
  label: string
  daysUntilExpiry: number | null
}

/**
 * Pure function: compute document status from expiry date.
 * - No expiry_date → "not_applicable"
 * - More than 30 days away → "valid"
 * - Within 30 days → "expiring_soon"
 * - Past → "expired"
 * 
 * This is computed at READ TIME, never stored.
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
 * Used by the dashboard alert widget.
 * // V3: add notification delivery (email/SMS) for expiry reminders
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
      // Expired first, then by days until expiry
      if (a.statusInfo.status === 'expired' && b.statusInfo.status !== 'expired') return -1
      if (a.statusInfo.status !== 'expired' && b.statusInfo.status === 'expired') return 1
      return (a.statusInfo.daysUntilExpiry ?? 0) - (b.statusInfo.daysUntilExpiry ?? 0)
    })
}

/**
 * Get document readiness for a specific approval type.
 * Cross-references the applicant's document vault against the approval's document requirements.
 * Returns two lists: "have" (vault docs matching a requirement) and "need" (requirements with no matching vault doc).
 */
export async function getDocumentReadiness(
  approvalTypeId: string,
  userId: string
) {
  // Get requirements for this approval type
  const requirements = await prisma.approvalTypeDocumentRequirement.findMany({
    where: { approvalTypeId },
  })

  // Get user's vault documents
  const userDocs = await prisma.document.findMany({
    where: { userId },
  })

  const have: Array<{
    requirement: typeof requirements[0]
    document: typeof userDocs[0]
    statusInfo: DocumentStatusInfo
  }> = []

  const need: Array<{
    requirement: typeof requirements[0]
  }> = []

  for (const req of requirements) {
    const matchingDoc = userDocs.find(doc => doc.documentType === req.documentType)
    if (matchingDoc) {
      have.push({
        requirement: req,
        document: matchingDoc,
        statusInfo: getDocumentStatus(matchingDoc.expiryDate),
      })
    } else {
      need.push({ requirement: req })
    }
  }

  return { have, need, requirements }
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
