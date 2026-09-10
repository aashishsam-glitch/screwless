'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import RiskBadge from '@/components/RiskBadge'
import OfficerDocumentReview from '@/components/OfficerDocumentReview'

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
  const { approvalType, applicationDocuments } = application

  // Check if mandatory documents have any rejections or are missing
  const mandatoryDocs = readiness.requirements.filter((r: any) => r.isMandatory)
  const missingOrRejectedMandatory = mandatoryDocs.filter((r: any) => {
    const doc = applicationDocuments.find((ad: any) => ad.documentType === r.documentType)
    return !doc || doc.status === 'missing' || doc.status === 'rejected'
  })

  const canApprove = missingOrRejectedMandatory.length === 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900">{approvalType.name}</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">Application ID: {application.id}</p>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{approvalType.description}</p>
      </div>

      {/* Document Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Document Verification & Audit</h2>
            <p className="text-xs text-gray-500">
              Inspect submitted files, record comments, and confirm statutory readiness.
            </p>
          </div>
          {!canApprove && (
            <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              ⚠️ {missingOrRejectedMandatory.length} Mandatory Document(s) Unresolved
            </span>
          )}
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

      {/* Statutory Decision Action Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Statutory Decision</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1" title={!canApprove ? 'Resolve all mandatory documents to approve' : ''}>
            <button
              onClick={() => handleDecision('approve')}
              disabled={acting || !canApprove || application.status === 'approved'}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${
                canApprove && application.status !== 'approved'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              ✓ Approve Application
            </button>
            {!canApprove && (
              <p className="text-[11px] text-red-600 mt-1 text-center">
                All mandatory documents must be attached & verified before approving.
              </p>
            )}
          </div>

          <button
            onClick={() => handleDecision('request_info')}
            disabled={acting}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            ? Request More Info
          </button>

          <button
            onClick={() => handleDecision('reject')}
            disabled={acting}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            ✕ Reject Application
          </button>
        </div>
      </div>
    </div>
  )
}
