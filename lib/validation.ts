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

export function normalizeSector(value: any): Sector | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (SECTOR_VALUES.includes(clean as Sector)) return clean as Sector
  if (clean.includes('manufactur')) return Sector.manufacturing
  if (clean.includes('chem')) return Sector.chemical
  if (clean.includes('food')) return Sector.food_processing
  if (clean.includes('textil')) return Sector.textiles
  if (clean.includes('pharm')) return Sector.pharma
  if (clean.includes('other')) return Sector.other
  return null
}

export function normalizeScale(value: any): Scale | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (SCALE_VALUES.includes(clean as Scale)) return clean as Scale
  if (clean.startsWith('micro')) return Scale.micro
  if (clean.startsWith('small')) return Scale.small
  if (clean.startsWith('medium')) return Scale.medium
  if (clean.startsWith('large')) return Scale.large
  return null
}

export function normalizeRiskCategory(value: any): RiskCategory | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (RISK_CATEGORY_VALUES.includes(clean as RiskCategory)) return clean as RiskCategory
  if (clean.startsWith('green')) return RiskCategory.green
  if (clean.startsWith('white')) return RiskCategory.white
  if (clean.startsWith('orange')) return RiskCategory.orange
  if (clean.startsWith('red')) return RiskCategory.red
  return null
}

export function normalizeStage(value: any): Stage | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().toLowerCase().replace(/[\s—–-]+/g, '_')
  if (STAGE_VALUES.includes(clean as Stage)) return clean as Stage
  if (clean.includes('new_unit') || clean.startsWith('new')) return Stage.new_unit
  if (clean.includes('expansion') || clean.startsWith('exp')) return Stage.expansion
  if (clean.includes('operational') || clean.startsWith('oper')) return Stage.operational
  return null
}
