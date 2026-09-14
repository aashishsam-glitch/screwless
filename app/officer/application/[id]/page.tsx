'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import RiskBadge from '@/components/RiskBadge'
import OfficerDocumentReview from '@/components/OfficerDocumentReview'
import { formatDocumentType } from '@/lib/documents'

export default function OfficerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/applications/${resolvedParams.id}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to load application')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [resolvedParams.id])

  const handleDecision = async (action: 'approve' | 'request_info' | 'reject') => {
    setActing(true)
    setShowConfirmModal(false)
    try {
      const res = await fetch('/api/officer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: resolvedParams.id, action }),
      })
      const result = await res.json()
      if (!res.ok) {
        alert(result.error || 'Action failed')
        return
      }
      alert(`Application marked as ${action}d!`)
      fetchDetail()
    } catch (err: any) {
      alert(err.message || 'Decision failed')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-red-700 text-sm">{error || 'Application not found'}</p>
        <button
          onClick={() => router.push('/officer')}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-xs rounded-lg font-medium"
        >
          Return to Queue
        </button>
      </div>
    )
  }

  const { application, readiness } = data
  const { approvalType, applicationDocuments, applicant } = application

  // Single Source of Truth for Verification:
  // Every mandatory document MUST have status === 'verified' and NOT be expired.
  const mandatoryDocs = readiness.requirements.filter((r: any) => r.isMandatory)
  const totalMandatory = mandatoryDocs.length

  const verifiedMandatory = mandatoryDocs.filter((r: any) => {
    const doc = applicationDocuments.find((ad: any) => ad.documentType === r.documentType)
    const isExpired = doc?.document?.expiryDate && new Date(doc.document.expiryDate) < new Date()
    return doc && doc.status === 'verified' && !isExpired
  })

  const unverifiedMandatory = mandatoryDocs.filter((r: any) => {
    const doc = applicationDocuments.find((ad: any) => ad.documentType === r.documentType)
    const isExpired = doc?.document?.expiryDate && new Date(doc.document.expiryDate) < new Date()
    return !doc || doc.status !== 'verified' || isExpired
  })

  const canApprove = totalMandatory > 0 && verifiedMandatory.length === totalMandatory
  const applicantDisplayName =
    applicant?.businessInfo?.businessName || applicant?.name || applicant?.email || 'Applicant'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/officer')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Application Queue
        </button>
        <div className="flex items-center gap-2">
          <RiskBadge riskCategory={application.riskCategory} />
          <StatusBadge status={application.status} />
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                ID: {application.id}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs font-semibold text-gray-700 uppercase">
                {approvalType.department.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{approvalType.name}</h1>
            <p className="text-sm font-medium text-gray-700 mt-1">
              Applicant: <span className="font-semibold text-gray-900">{applicantDisplayName}</span>
              {applicant?.email && <span className="text-gray-400 font-normal"> ({applicant.email})</span>}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed border-t border-gray-100 pt-3">
          {approvalType.description}
        </p>
      </div>

      {/* PROMINENT ACTION AREA — APPROVAL & DECISION BAR */}
      <div className="bg-white rounded-xl border-2 border-blue-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Statutory Approval Action
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              Document Verification: {verifiedMandatory.length}/{totalMandatory} Mandatory Verified
            </h3>
            <p
              className={`text-xs mt-1 font-medium ${
                canApprove ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {application.status === 'approved'
                ? '✓ This application has been approved.'
                : canApprove
                ? '✓ All mandatory documents verified. Application is ready for approval.'
                : `🔒 Approval locked: Verify all mandatory documents first (${unverifiedMandatory.length} remaining).`}
            </p>
          </div>

          {/* Verification Progress Pill */}
          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                canApprove
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {canApprove ? '🟢 Ready to Approve' : '🟡 Verification Incomplete'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={acting || !canApprove || application.status === 'approved'}
              className={`w-full py-3 px-5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
                canApprove && application.status !== 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
              title={
                !canApprove
                  ? 'All mandatory documents must be verified by officer before approving'
                  : 'Click to approve application'
              }
            >
              ✓ Approve Application
            </button>
            {!canApprove && application.status !== 'approved' && (
              <p className="text-[11px] text-amber-700 mt-1.5 text-center font-medium">
                Verify each mandatory document below to unlock approval.
              </p>
            )}
          </div>

          <button
            onClick={() => handleDecision('request_info')}
            disabled={acting || application.status === 'approved'}
            className="sm:w-44 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            ? Request Info
          </button>

          <button
            onClick={() => handleDecision('reject')}
            disabled={acting || application.status === 'approved'}
            className="sm:w-44 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            ✕ Reject Application
          </button>
        </div>
      </div>

      {/* DOCUMENT REVIEW & AUDIT SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Document Verification & Audit</h2>
            <p className="text-xs text-gray-500">
              Inspect submitted files, record comments, and confirm statutory verification.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {verifiedMandatory.length} of {totalMandatory} Mandatory Verified
          </span>
        </div>

        {readiness.requirements.map((req: any) => {
          const matchingAppDoc = applicationDocuments.find(
            (ad: any) => ad.documentType === req.documentType
          ) || {
            id: `temp_${req.id}`,
            documentType: req.documentType,
            status: 'missing',
            document: null,
            comments: [],
          }

          return (
            <OfficerDocumentReview
              key={req.id}
              appDoc={matchingAppDoc}
              isMandatory={req.isMandatory}
              onActionComplete={fetchDetail}
            />
          )
        })}
      </div>

      {/* APPROVAL CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h3 className="text-lg font-bold text-gray-900">Approve Application?</h3>
              <p className="text-sm text-gray-600 mt-2">
                All mandatory documents have been verified for <strong>{applicantDisplayName}</strong>.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to grant statutory approval for <strong>{approvalType.name}</strong>?
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={acting}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision('approve')}
                disabled={acting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {acting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Approving...
                  </>
                ) : (
                  'Confirm & Approve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
