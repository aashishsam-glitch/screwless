import { RiskCategory } from '@prisma/client'

export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface RiskBadge {
  level: RiskLevel
  color: string      // Tailwind color class
  bgColor: string    // Tailwind bg color class
  textColor: string  // Tailwind text color class
}

/**
 * Pure function: maps a pollution risk category to a display risk badge.
 * Green/White → Low (green), Orange → Medium (amber), Red → High (red)
 */
export function getRiskBadge(riskCategory: RiskCategory): RiskBadge {
  switch (riskCategory) {
    case 'green':
    case 'white':
      return {
        level: 'Low',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      }
    case 'orange':
      return {
        level: 'Medium',
        color: 'amber',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
      }
    case 'red':
      return {
        level: 'High',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
      }
    default:
      return {
        level: 'Low',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
      }
  }
}
