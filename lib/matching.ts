import { prisma } from './prisma'
import type { ApplicantProfile, ApprovalType, ApprovalRule, Scheme, Application } from '@prisma/client'
import { computeApprovalReadiness, type ApprovalReadinessSummary } from './documents'

export interface MatchedApproval {
  approvalType: ApprovalType & { dependsOn?: ApprovalType | null }
  isSelfCertifiable: boolean
  dependsOnName: string | null
  application?: Application | null // existing application if any
  readiness?: ApprovalReadinessSummary
}

export interface MatchedScheme {
  scheme: Scheme
  reason: string // human-readable "why you qualify" explanation
}

/**
 * Given an applicant profile, query ApprovalRule table and return matching
 * ApprovalType list, each annotated with self-certifiable status and dependency info.
 * 
 * Matching logic: A rule matches if ALL non-null rule fields match the profile.
 * A null field in the rule means "applies to all values".
 */
export async function getMatchingApprovals(
  profile: ApplicantProfile,
  userId: string
): Promise<MatchedApproval[]> {
  // Fetch all rules with their approval types, dependencies, and document requirements
  const rules = await prisma.approvalRule.findMany({
    include: {
      approvalType: {
        include: {
          dependsOn: true,
          documentRequirements: true,
        },
      },
    },
  })

  // Fetch existing applications for this user
  const existingApplications = await prisma.application.findMany({
    where: { applicantId: userId },
    include: { applicationDocuments: true },
  })

  // Fetch all user vault documents
  const userDocs = await prisma.document.findMany({
    where: { userId },
  })

  // Filter rules that match the profile
  const matchingRules = rules.filter((rule) => {
    // Sector check: null means "all sectors"
    if (rule.appliesToSector !== null && rule.appliesToSector !== profile.sector) {
      return false
    }
    // Scale check: null means "all scales"
    if (rule.appliesToScale !== null && rule.appliesToScale !== profile.scale) {
      return false
    }
    // Risk category check: null means "all risk categories"
    if (rule.appliesToRiskCategory !== null && rule.appliesToRiskCategory !== profile.riskCategory) {
      return false
    }
    // Zone check: null means "any zone"
    if (rule.appliesToZone !== null && rule.appliesToZone !== profile.inNotifiedIndustrialZone) {
      return false
    }
    return true
  })

  // Deduplicate by approval type, keeping the most relevant rule
  // If multiple rules match for the same approval type, prefer the more specific one
  // For self-certifiable: if ANY matching rule says false, the approval is not self-certifiable
  const approvalMap = new Map<string, MatchedApproval>()

  for (const rule of matchingRules) {
    const existing = approvalMap.get(rule.approvalTypeId)
    const application = existingApplications.find(
      (app) => app.approvalTypeId === rule.approvalTypeId
    )

    const readiness = computeApprovalReadiness(
      rule.approvalType.documentRequirements,
      userDocs,
      application?.applicationDocuments || []
    )

    if (!existing) {
      approvalMap.set(rule.approvalTypeId, {
        approvalType: rule.approvalType,
        isSelfCertifiable: rule.isSelfCertifiable,
        dependsOnName: rule.approvalType.dependsOn?.name ?? null,
        application: application ?? null,
        readiness,
      })
    } else {
      // If any rule says not self-certifiable, the approval is not self-certifiable
      if (!rule.isSelfCertifiable) {
        existing.isSelfCertifiable = false
      }
    }
  }

  return Array.from(approvalMap.values())
}

/**
 * Given an applicant profile, return matching government schemes with
 * human-readable explanations of why the applicant qualifies.
 *
 * Matching logic: A scheme matches if ALL non-null eligibility fields match.
 */
export async function getMatchingSchemes(
  profile: ApplicantProfile
): Promise<MatchedScheme[]> {
  const schemes = await prisma.scheme.findMany()

  return schemes
    .filter((scheme) => {
      if (scheme.eligibilitySector !== null && scheme.eligibilitySector !== profile.sector) {
        return false
      }
      if (scheme.eligibilityScale !== null && scheme.eligibilityScale !== profile.scale) {
        return false
      }
      if (scheme.eligibilityDistrict !== null && 
          scheme.eligibilityDistrict.toLowerCase() !== profile.locationDistrict.toLowerCase()) {
        return false
      }
      return true
    })
    .map((scheme) => ({
      scheme,
      reason: buildSchemeReason(scheme, profile),
    }))
}

/**
 * Build a human-readable "why you qualify" explanation for a scheme match.
 */
function buildSchemeReason(scheme: Scheme, profile: ApplicantProfile): string {
  const parts: string[] = []

  if (scheme.eligibilityScale) {
    parts.push(`you're a ${formatEnum(scheme.eligibilityScale)}-scale enterprise`)
  }
  if (scheme.eligibilitySector) {
    parts.push(`in the ${formatEnum(scheme.eligibilitySector)} sector`)
  }
  if (scheme.eligibilityDistrict) {
    parts.push(`located in ${scheme.eligibilityDistrict}`)
  }

  if (parts.length === 0) {
    return 'This scheme is available to all eligible industrial units in Maharashtra'
  }

  return `You qualify because ${parts.join(', ')}`
}

/** Format an enum value for display (e.g. 'food_processing' → 'Food Processing') */
function formatEnum(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
