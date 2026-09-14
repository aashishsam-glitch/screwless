'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'

interface RequirementItem {
  id: string
  documentType: string
  formattedName: string
  isMandatory: boolean
  isReady: boolean
  readinessStatus: string
  reason?: string
}

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
      slaDueDate?: string | null
    } | null
    readiness?: {
      totalRequired: number
      readyCount: number
      readinessPct: number
      isReadyToApply: boolean
      missingDocuments: string[]
      requirements: RequirementItem[]
    }
  }
  isDependencyMet: boolean
  onSubmit: (approvalTypeId: string) => Promise<void>
  onUploadClick?: (documentType: string) => void
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

export default function ApprovalCard({
  approval,
  isDependencyMet,
  onSubmit,
  onUploadClick,
}: ApprovalCardProps) {
  const [loading, setLoading] = useState(false)
  const { approvalType, isSelfCertifiable, dependsOnName, application, readiness } = approval
  const status = application?.status || 'not_started'
  const isLocked = !isDependencyMet && status === 'not_started'
  const isCompleted = status === 'approved' || status === 'rejected'
  const isReadyToApply = readiness ? readiness.isReadyToApply : true
  const missingCount = readiness?.missingDocuments?.length || 0

  const handleSubmit = async () => {
    if (loading || isLocked || !isReadyToApply) return
    setLoading(true)
    try {
      await onSubmit(approvalType.id)
    } finally {
      setLoading(false)
    }
  }

  // Renewal date for approved applications (Phase 4 placeholder)
  const renewalDate =
    application?.status === 'approved' && application?.updatedAt
      ? new Date(
          new Date(application.updatedAt).getTime() + 365 * 24 * 60 * 60 * 1000
        ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm transition-all flex flex-col justify-between ${
        isLocked
          ? 'opacity-60 border-gray-200'
          : status === 'approved'
          ? 'border-green-200 ring-1 ring-green-100'
          : status === 'rejected'
          ? 'border-red-200 ring-1 ring-red-100'
          : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
      }`}
    >
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
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
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{approvalType.description}</p>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {isSelfCertifiable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Self-Certifiable
              </span>
            )}
            {isLocked && dependsOnName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                title={`Complete "${dependsOnName}" first`}
              >
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

          {/* Statutory SLA Countdown (Citizen's Charter) */}
          {application?.slaDueDate &&
            status !== 'approved' &&
            status !== 'rejected' &&
            status !== 'not_started' &&
            (() => {
              const diffDays = Math.ceil(
                (new Date(application.slaDueDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
              const isOverdue = diffDays < 0
              return (
                <div
                  className={`mb-3 p-2 rounded text-xs flex items-center justify-between border ${
                    isOverdue
                      ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
                      : diffDays <= 5
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <span>⏱️ RTSA Statutory SLA:</span>
                  <span>
                    {isOverdue
                      ? `⚠️ Overdue by ${Math.abs(diffDays)} days`
                      : `${diffDays} days remaining`}
                  </span>
                </div>
              )
            })()}

          {/* Document Readiness Checklist & Progress (For unsubmitted applications) */}
          {status === 'not_started' && readiness && readiness.requirements.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-medium text-gray-700 pb-1 border-b border-gray-200">
                <span>Required Documents</span>
                <span
                  className={
                    readiness.isReadyToApply
                      ? 'text-emerald-700 font-semibold'
                      : 'text-amber-700 font-semibold'
                  }
                >
                  {readiness.readyCount} / {readiness.totalRequired} ready ({readiness.readinessPct}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    readiness.isReadyToApply ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${readiness.readinessPct}%` }}
                />
              </div>

              {/* Requirements list */}
              <div className="space-y-1.5 pt-1">
                {readiness.requirements.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={req.isReady ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {req.isReady ? '✓' : '✗'}
                      </span>
                      <span className={`truncate ${req.isReady ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {req.formattedName}
                      </span>
                      {req.isMandatory && (
                        <span className="text-[9px] px-1 py-0.2 bg-red-50 text-red-600 rounded border border-red-200 shrink-0">
                          Req
                        </span>
                      )}
                    </div>
                    {!req.isReady && onUploadClick && (
                      <button
                        type="button"
                        onClick={() => onUploadClick(req.documentType)}
                        className="px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded shrink-0 hover:bg-blue-50 transition-colors"
                      >
                        Upload ⇡
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div>
          {status === 'not_started' && (
            <button
              onClick={handleSubmit}
              disabled={loading || isLocked || !isReadyToApply}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : !isReadyToApply
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 cursor-not-allowed opacity-90 font-medium'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs'
              }`}
              title={
                isLocked
                  ? `Complete "${dependsOnName}" first`
                  : !isReadyToApply
                  ? `Upload all mandatory documents before applying`
                  : 'Submit this application'
              }
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : isLocked ? (
                '🔒 Prerequisite Required'
              ) : !isReadyToApply ? (
                `Complete required documents before applying (${missingCount} remaining)`
              ) : (
                'Apply for Approval →'
              )}
            </button>
          )}

          {status === 'info_requested' && (
            <button
              disabled={true}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-default"
            >
              ⚠ Additional Information Requested by Officer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
