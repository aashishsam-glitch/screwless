'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatusBadge from '@/components/StatusBadge'
import ApprovalFlowchart from '@/components/ApprovalFlowchart'
import DocumentReadiness from '@/components/DocumentReadiness'

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/applications/${resolvedParams.id}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to load application details')
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
          onClick={() => router.push('/dashboard')}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-xs rounded-lg font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const { application, readiness } = data
  const { approvalType } = application

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <StatusBadge status={application.status} />
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{approvalType.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Department: {approvalType.department.toUpperCase()}</p>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{approvalType.description}</p>
          </div>
        </div>
      </div>

      {/* Visual Flowchart */}
      <ApprovalFlowchart
        currentStatus={application.status}
        dependsOnName={approvalType.dependsOn?.name}
        isDependencyMet={true}
      />

      {/* Steps to Complete Checklist (Multi-step Guidance Checklist) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>📋</span> Steps to Complete This Approval
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-900 mb-1">Step 1: Document Prep</p>
            <p className="text-gray-600 leading-relaxed">
              Verify that all mandatory documents below are in your vault and click "Attach".
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-900 mb-1">Step 2: Department Review</p>
            <p className="text-gray-600 leading-relaxed">
              {approvalType.department.toUpperCase()} scrutiny officer examines attachments and may add notes.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-900 mb-1">Step 3: Clearances & NOC</p>
            <p className="text-gray-600 leading-relaxed">
              Once verified, status updates to Approved and downstream dependent licenses unlock.
            </p>
          </div>
        </div>
      </div>

      {/* Document Readiness & Vault Attachments */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Document Compliance & Readiness</h2>
          <span className="text-xs text-gray-500">
            {readiness.have.length} of {readiness.requirements.length} required types available
          </span>
        </div>

        <DocumentReadiness
          applicationId={application.id}
          have={readiness.have}
          need={readiness.need}
          attachedDocs={application.applicationDocuments}
          onRefresh={fetchDetail}
        />
      </section>
    </div>
  )
}
