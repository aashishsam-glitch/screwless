'use client'

interface StatusBadgeProps {
  status: string
}

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  not_started: { label: 'Not Started', bgColor: 'bg-gray-100', textColor: 'text-gray-700', dotColor: 'bg-gray-400' },
  submitted: { label: 'Submitted', bgColor: 'bg-blue-100', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
  in_review: { label: 'In Review', bgColor: 'bg-purple-100', textColor: 'text-purple-700', dotColor: 'bg-purple-500' },
  info_requested: { label: 'Info Requested', bgColor: 'bg-amber-100', textColor: 'text-amber-700', dotColor: 'bg-amber-500' },
  approved: { label: 'Approved', bgColor: 'bg-green-100', textColor: 'text-green-700', dotColor: 'bg-green-500' },
  rejected: { label: 'Rejected', bgColor: 'bg-red-100', textColor: 'text-red-700', dotColor: 'bg-red-500' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  )
}
