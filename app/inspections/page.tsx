'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Inspection {
  id: string
  scheduledDate: string
  status: string
  findings: string | null
  reportUrl: string | null
  application: {
    id: string
    approvalType: {
      name: string
      department: string
    }
  }
  officers: Array<{
    id: string
    department: string
    officer: {
      name: string | null
      officerDepartment: string | null
    }
  }>
}

export default function InspectionsPage() {
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/inspections')
      .then((res) => {
        if (res.status === 401) {
          router.push('/login')
          return null
        }
        if (!res.ok) throw new Error('Failed to load inspections')
        return res.json()
      })
      .then((data) => {
        if (data?.inspections) setInspections(data.inspections)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="bg-blue-500/30 text-blue-100 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-400/30">
              Central Inspection System (CIS)
            </span>
            <h1 className="text-2xl font-bold mt-2">Joint Site Inspections</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Coordinated physical inspections across multiple regulatory bodies (MPCB, DISH, Fire Department, Labour) under Maharashtra’s Ease of Doing Business framework.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl text-center border border-white/20">
            <p className="text-3xl font-extrabold">{inspections.length}</p>
            <p className="text-xs text-blue-200 uppercase tracking-wide mt-0.5">Scheduled Visits</p>
          </div>
        </div>
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
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
            🔍
          </div>
          <h3 className="text-base font-semibold text-gray-900">No Joint Inspections Scheduled</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Once your statutory applications are submitted, departments coordinate a single joint site inspection date to prevent repeated site disruptions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inspections.map((insp) => {
            const dateStr = new Date(insp.scheduledDate).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const isCompleted = insp.status === 'completed'

            return (
              <div
                key={insp.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      {insp.application.approvalType.name}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                      📅 Scheduled Date: {dateStr}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {insp.status}
                  </span>
                </div>

                {/* Participating Regulatory Departments */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span>🏢</span> Participating Scrutiny Officers ({insp.officers.length})
                  </p>
                  <div className="space-y-1.5">
                    {insp.officers.map((off) => (
                      <div
                        key={off.id}
                        className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-gray-200"
                      >
                        <span className="font-medium text-gray-800">
                          {off.officer.name || 'Department Reviewer'}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded">
                          {off.department.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Inspection Report (CIR) Findings */}
                {insp.findings ? (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-950">
                    <p className="font-bold mb-1 flex items-center gap-1">
                      <span>📄</span> Common Inspection Report (CIR) Protocol:
                    </p>
                    <p className="leading-relaxed text-blue-900">{insp.findings}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Inspection report will be uploaded within 48 hours of joint site visit.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
