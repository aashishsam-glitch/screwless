'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'

interface ApprovalCardProps {
  approval: {
    approvalType: {
      id: string
      name: string
      department: string
      description: string
      dependsOnId: string | null
      dependsOn?: { id: string; name: string } | null
    }
    isSelfCertifiable: boolean
    dependsOnName: string | null
    application?: {
      id: string
      status: string
      updatedAt: string
    } | null
  }
  isDependencyMet: boolean
  onSubmit: (approvalTypeId: string) => Promise<void>
}

const DEPARTMENT_LABELS: Record<string, string> = {
  fire_dept: 'Fire Department',
  mpcb: 'MPCB (Pollution Control)',
  dish: 'DISH (Industrial Safety)',
  municipal_corp: 'Municipal Corporation',
  labour_dept: 'Labour Department',
  midc: 'MIDC',
  msedcl: 'MSEDCL (Electricity)',
  water_resources: 'Water Resources Dept',
  tax_dept: 'Tax Department',
}

export default function ApprovalCard({ approval, isDependencyMet, onSubmit }: ApprovalCardProps) {
  const [loading, setLoading] = useState(false)
  const { approvalType, isSelfCertifiable, dependsOnName, application } = approval
  const status = application?.status || 'not_started'
  const isLocked = !isDependencyMet && status === 'not_started'
  const isCompleted = status === 'approved' || status === 'rejected'

  const handleSubmit = async () => {
    if (loading || isLocked) return
    setLoading(true)
    try {
      await onSubmit(approvalType.id)
    } finally {
      setLoading(false)
    }
  }

  // Renewal date for approved applications (Phase 4 placeholder)
  const renewalDate = application?.status === 'approved' && application?.updatedAt
    ? new Date(new Date(application.updatedAt).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className={`bg-white rounded-lg border shadow-sm transition-all ${
      isLocked ? 'opacity-60 border-gray-200' : 
      status === 'approved' ? 'border-green-200 ring-1 ring-green-100' :
      status === 'rejected' ? 'border-red-200 ring-1 ring-red-100' :
      'border-gray-200 hover:border-blue-200 hover:shadow-md'
    }`}>
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <a
              href={`/dashboard/application/${application?.id || approvalType.id}`}
              className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate block transition-colors"
              title="Click to view details, flowchart and document readiness"
            >
              {isLocked && <span className="mr-1">🔒</span>}
              {approvalType.name} ↗
            </a>
            <p className="text-sm text-gray-500 mt-0.5">
              {DEPARTMENT_LABELS[approvalType.department] || approvalType.department}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {approvalType.description}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {isSelfCertifiable && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Self-Certifiable
            </span>
          )}
          {isLocked && dependsOnName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200" title={`Complete "${dependsOnName}" first`}>
              ⚠ Requires: {dependsOnName}
            </span>
          )}
        </div>

        {/* Renewal date for approved */}
        {renewalDate && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            📅 Renewal due: {renewalDate}
          </div>
        )}

        {/* Action button */}
        {status === 'not_started' && (
          <button
            onClick={handleSubmit}
            disabled={loading || isLocked}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            }`}
            title={isLocked ? `Complete "${dependsOnName}" first` : 'Submit this application'}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : isLocked ? (
              '🔒 Prerequisite Required'
            ) : (
              'Submit Application →'
            )}
          </button>
        )}

        {status === 'info_requested' && (
          <button
            onClick={handleSubmit}
            disabled={true}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-default"
          >
            ⚠ Additional Information Requested by Officer
          </button>
        )}
      </div>
    </div>
  )
}
