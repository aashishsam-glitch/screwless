import {
  Sector,
  Scale,
  RiskCategory,
  Stage,
  BusinessType,
  DocumentType,
  ApplicationStatus,
  InspectionStatus,
  GrievanceTier,
  GrievanceStatus,
} from '@prisma/client'

const SECTOR_VALUES = Object.values(Sector)
const SCALE_VALUES = Object.values(Scale)
const RISK_CATEGORY_VALUES = Object.values(RiskCategory)
const STAGE_VALUES = Object.values(Stage)
const BUSINESS_TYPE_VALUES = Object.values(BusinessType)
const DOCUMENT_TYPE_VALUES = Object.values(DocumentType)
const APPLICATION_STATUS_VALUES = Object.values(ApplicationStatus)
const INSPECTION_STATUS_VALUES = Object.values(InspectionStatus)
const GRIEVANCE_TIER_VALUES = Object.values(GrievanceTier)
const GRIEVANCE_STATUS_VALUES = Object.values(GrievanceStatus)

export function isValidSector(value: any): value is Sector {
  return typeof value === 'string' && SECTOR_VALUES.includes(value as Sector)
}

export function isValidScale(value: any): value is Scale {
  return typeof value === 'string' && SCALE_VALUES.includes(value as Scale)
}

export function isValidRiskCategory(value: any): value is RiskCategory {
  return typeof value === 'string' && RISK_CATEGORY_VALUES.includes(value as RiskCategory)
}

export function isValidStage(value: any): value is Stage {
  return typeof value === 'string' && STAGE_VALUES.includes(value as Stage)
}

export function isValidBusinessType(value: any): value is BusinessType {
  return typeof value === 'string' && BUSINESS_TYPE_VALUES.includes(value as BusinessType)
}

export function isValidDocumentType(value: any): value is DocumentType {
  return typeof value === 'string' && DOCUMENT_TYPE_VALUES.includes(value as DocumentType)
}

export function isValidApplicationStatus(value: any): value is ApplicationStatus {
  return typeof value === 'string' && APPLICATION_STATUS_VALUES.includes(value as ApplicationStatus)
}

export function isValidInspectionStatus(value: any): value is InspectionStatus {
  return typeof value === 'string' && INSPECTION_STATUS_VALUES.includes(value as InspectionStatus)
}

export function isValidGrievanceTier(value: any): value is GrievanceTier {
  return typeof value === 'string' && GRIEVANCE_TIER_VALUES.includes(value as GrievanceTier)
}

export function isValidGrievanceStatus(value: any): value is GrievanceStatus {
  return typeof value === 'string' && GRIEVANCE_STATUS_VALUES.includes(value as GrievanceStatus)
}
