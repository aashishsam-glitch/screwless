'use client'

import { useState } from 'react'
import RiskBadge from './RiskBadge'
import StatusBadge from './StatusBadge'

interface Application {
  id: string
  status: string
  riskCategory: string
  createdAt: string
  slaDueDate?: string | null
  approvalType: {
    id: string
    name: string
    department: string
  }
  applicant: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    profile: {
      sector: string
      scale: string
      locationDistrict: string
      riskCategory: string
      stage: string
    } | null
  }
}

interface OfficerQueueRowProps {
  application: Application
  onAction: (applicationId: string, action: string) => Promise<void>
}

function formatEnum(value: string): string {
  return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function OfficerQueueRow({ application, onAction }: OfficerQueueRowProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const { applicant, approvalType, riskCategory, status, createdAt } = application
  const profile = applicant.profile

  const handleAction = async (action: string) => {
    setLoadingAction(action)
    try {
      await onAction(application.id, action)
    } finally {
      setLoadingAction(null)
    }
  }

  const submittedDate = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Top row: applicant info + risk badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {applicant.name || applicant.email || applicant.phone || 'Unknown Applicant'}
            </h3>
            <p className="text-sm text-gray-500">
              {applicant.email || applicant.phone}
            </p>
          </div>
          <RiskBadge riskCategory={riskCategory} />
        </div>

        {/* Approval type */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Approval:</span>
            <span className="text-sm text-gray-900 font-semibold">{approvalType.name}</span>
          </div>
        </div>

        {/* Business details grid */}
        {profile && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <span className="text-gray-500">Sector:</span>{' '}
              <span className="font-medium text-gray-700">{formatEnum(profile.sector)}</span>
            </div>
            <div>
              <span className="text-gray-500">Scale:</span>{' '}
              <span className="font-medium text-gray-700">{formatEnum(profile.scale)}</span>
            </div>
            <div>
              <span className="text-gray-500">District:</span>{' '}
              <span className="font-medium text-gray-700">{profile.locationDistrict}</span>
            </div>
            <div>
              <span className="text-gray-500">Stage:</span>{' '}
              <span className="font-medium text-gray-700">{formatEnum(profile.stage)}</span>
            </div>
          </div>
        )}

        {/* Status + date */}
        <div className="flex items-center justify-between mb-2">
          <StatusBadge status={status} />
          <span className="text-xs text-gray-400">Submitted: {submittedDate}</span>
        </div>

        {/* SLA Countdown */}
        {application.slaDueDate && status !== 'approved' && status !== 'rejected' && (
          (() => {
            const diffDays = Math.ceil(
              (new Date(application.slaDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const isOverdue = diffDays < 0
            return (
              <div
                className={`mb-3 p-2 rounded text-xs flex items-center justify-between border ${
                  isOverdue
                    ? 'bg-red-50 text-red-700 border-red-200 font-semibold animate-pulse'
                    : diffDays <= 5
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                <span>⏱️ Citizen's Charter SLA:</span>
                <span>
                  {isOverdue
                    ? `⚠️ Overdue by ${Math.abs(diffDays)} days (Breach)`
                    : `${diffDays} days remaining`}
                </span>
              </div>
            )
          })()
        )}

        {/* Detailed Review link */}
        <div className="mb-3">
          <a
            href={`/officer/application/${application.id}`}
            className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-blue-200"
          >
            <span>🔍 Review Attached Documents & Verify</span> →
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('approve')}
            disabled={loadingAction !== null}
            className="flex-1 py-2.5 px-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            {loadingAction === 'approve' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '✓'
            )}
            Approve
          </button>
          <button
            onClick={() => handleAction('request_info')}
            disabled={loadingAction !== null}
            className="flex-1 py-2.5 px-3 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            {loadingAction === 'request_info' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '?'
            )}
            Request Info
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={loadingAction !== null}
            className="flex-1 py-2.5 px-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            {loadingAction === 'reject' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '✗'
            )}
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
