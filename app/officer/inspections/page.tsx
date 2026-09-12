'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Inspection {
  id: string
  scheduledDate: string
  status: string
  findings: string | null
  application: {
    id: string
    approvalType: {
      name: string
      department: string
    }
    applicant: {
      name: string | null
      email: string | null
      phone: string | null
    }
  }
  officers: Array<{
    id: string
    department: string
    officer: {
      name: string | null
    }
  }>
}

export default function OfficerInspectionsPage() {
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [reportModalId, setReportModalId] = useState<string | null>(null)
  const [findingsText, setFindingsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/inspections')
      if (res.status === 401 || res.status === 403) {
        router.push('/login')
        return
      }
      if (!res.ok) throw new Error('Failed to load inspections')
      const data = await res.json()
      setInspections(data.inspections || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInspections()
  }, [])

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportModalId || !findingsText.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/inspections/${reportModalId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings: findingsText.trim(), status: 'completed' }),
      })
      if (!res.ok) throw new Error('Failed to submit report')
      setReportModalId(null)
      setFindingsText('')
      fetchInspections()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-6 text-white shadow-md">
        <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30">
          State Scrutiny Officer Portal
        </span>
        <h1 className="text-2xl font-bold mt-2">Central Inspection System (CIS) Management</h1>
        <p className="text-gray-300 text-sm mt-1 max-w-2xl leading-relaxed">
          Coordinate synchronized physical site visits, eliminate multiple regulatory visits, and publish standardized Common Inspection Reports within 48 hours.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm">No joint site inspections assigned to your department.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                    {insp.application.approvalType.name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      insp.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {insp.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Applicant: {insp.application.applicant.name || 'Industrial Applicant'} ({insp.application.applicant.phone || insp.application.applicant.email})
                </h3>
                <p className="text-xs text-gray-500">
                  📅 Coordinated Visit Date:{' '}
                  <span className="font-semibold text-gray-800">
                    {new Date(insp.scheduledDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </p>

                {insp.findings && (
                  <p className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-700">
                    <strong>Report:</strong> "{insp.findings}"
                  </p>
                )}
              </div>

              <div>
                {insp.status !== 'completed' ? (
                  <button
                    onClick={() => {
                      setReportModalId(insp.id)
                      setFindingsText(insp.findings || '')
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  >
                    📝 Upload Inspection Findings (CIR)
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    ✓ Report Published
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CIR Findings Modal */}
      {reportModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Publish Common Inspection Report</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter the consolidated physical observation remarks for environmental, fire and structural compliances.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <textarea
                value={findingsText}
                onChange={(e) => setFindingsText(e.target.value)}
                rows={4}
                required
                placeholder="E.g., Site visited with Fire & Pollution officers. Effluent treatment plant layout verified. Adequate emergency exits confirmed."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-gray-900"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalId(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish CIR Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
