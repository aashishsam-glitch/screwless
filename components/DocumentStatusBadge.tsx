'use client'

import { DocumentStatusValue } from '@/lib/documents'

interface DocumentStatusBadgeProps {
  status: DocumentStatusValue
  label?: string
}

const STATUS_CONFIG: Record<
  DocumentStatusValue,
  { defaultLabel: string; bgColor: string; textColor: string; dotColor: string }
> = {
  valid: {
    defaultLabel: 'Valid',
    bgColor: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  expiring_soon: {
    defaultLabel: 'Expiring Soon',
    bgColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-800',
    dotColor: 'bg-amber-500 animate-pulse',
  },
  expired: {
    defaultLabel: 'Expired',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  not_applicable: {
    defaultLabel: 'N/A',
    bgColor: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-600',
    dotColor: 'bg-gray-400',
  },
}

export default function DocumentStatusBadge({ status, label }: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_applicable
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {label || config.defaultLabel}
    </span>
  )
}
