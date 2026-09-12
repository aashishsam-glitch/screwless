'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Grievance {
  id: string
  subject: string
  description: string
  tier: 'tier_1_district' | 'tier_2_state'
  status: 'pending' | 'under_review' | 'resolved' | 'rejected'
  resolutionRemarks: string | null
  createdAt: string
  application: {
    id: string
    approvalType: {
      name: string
      department: string
    }
    applicant?: {
      name: string | null
      email: string | null
    }
  }
}

interface ApplicationOption {
  id: string
  approvalType: {
    name: string
  }
}

export default function GrievancesPage() {
  const router = useRouter()
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [userRole, setUserRole] = useState<'applicant' | 'officer'>('applicant')
  const [loading, setLoading] = useState(true)
  const [showFileModal, setShowFileModal] = useState(false)
  const [userApps, setUserApps] = useState<ApplicationOption[]>([])

  // Form states
  const [appId, setAppId] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState<'tier_1_district' | 'tier_2_state'>('tier_1_district')
  const [submitting, setSubmitting] = useState(false)

  // Resolve states
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveRemarks, setResolveRemarks] = useState('')
  const [resolveStatus, setResolveStatus] = useState<'resolved' | 'rejected'>('resolved')

  const loadData = async () => {
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }
      const authData = await authRes.json()
      setUserRole(authData.user.role)

      const res = await fetch('/api/grievances')
      if (res.ok) {
        const data = await res.json()
        setGrievances(data.grievances || [])
      }

      if (authData.user.role === 'applicant') {
        const appsRes = await fetch('/api/applications')
        if (appsRes.ok) {
          const appsData = await appsRes.json()
          setUserApps(appsData.applications || [])
          if (appsData.applications?.length > 0) {
            setAppId(appsData.applications[0].id)
          }
        }
      }
    } catch {
      // silent handle
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFileGrievance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appId || !subject.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, subject, description, tier }),
      })
      if (!res.ok) throw new Error('Failed to file grievance')
      setShowFileModal(false)
      setSubject('')
      setDescription('')
      loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvingId || !resolveRemarks.trim()) return

    try {
      const res = await fetch(`/api/grievances/${resolvingId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolveStatus, resolutionRemarks: resolveRemarks }),
      })
      if (!res.ok) throw new Error('Failed to resolve')
      setResolvingId(null)
      setResolveRemarks('')
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-purple-500/30 text-purple-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-purple-400/30">
            Statutory Escalation & RTSA Appeals
          </span>
          <h1 className="text-2xl font-bold mt-2">Grievance Redressal Mechanism</h1>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            File statutory appeals for delayed processing, arbitrary rejections, or Citizen’s Charter SLA breaches to District Collectors and State Empowered Committees.
          </p>
        </div>

        {userRole === 'applicant' && (
          <button
            onClick={() => setShowFileModal(true)}
            className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>⚖️</span> File Statutory Appeal
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : grievances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
            ⚖️
          </div>
          <h3 className="text-base font-semibold text-gray-900">No Grievances Filed</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            If an approval application breaches statutory timelines under the Right to Services Act, applicants can lodge a formal escalation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grievances.map((g) => {
            const isResolved = g.status === 'resolved'
            const isRejected = g.status === 'rejected'

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      {g.tier === 'tier_1_district' ? 'Tier-1: District Collector' : 'Tier-2: State High Committee'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Filed on {new Date(g.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {g.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">{g.subject}</h3>
                  <p className="text-xs font-medium text-blue-600 mt-0.5">
                    Clearance: {g.application.approvalType.name}
                  </p>
                  <p className="text-xs text-gray-700 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                {g.resolutionRemarks && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950">
                    <p className="font-bold flex items-center gap-1 mb-1">
                      <span>✓</span> Appellate Authority Resolution Remarks:
                    </p>
                    <p className="text-emerald-900 leading-relaxed">{g.resolutionRemarks}</p>
                  </div>
                )}

                {userRole === 'officer' && g.status === 'pending' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setResolvingId(g.id)}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg"
                    >
                      Process Appeal & Issue Order
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal to file grievance */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Lodge Statutory RTSA Appeal</h3>
            <p className="text-xs text-gray-500 mb-4">
              Escalate a delayed or contested industrial approval application.
            </p>

            <form onSubmit={handleFileGrievance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Application
                </label>
                <select
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900"
                  required
                >
                  {userApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.approvalType.name} (ID: {a.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Appellate Authority Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900"
                >
                  <option value="tier_1_district">Tier-1: District Grievance Committee (District Collector)</option>
                  <option value="tier_2_state">Tier-2: State Empowered Committee (Principal Secretary)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E.g., Citizen Charter SLA Delay — Fire NOC past 15 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Appeal Details & Grounds
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Explain why the delay or decision breaches statutory guidelines..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="flex-1 py-2 text-xs border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to resolve grievance */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Issue Appellate Order</h3>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Decision</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900"
                >
                  <option value="resolved">Accept Appeal & Direct Clearance (Resolved)</option>
                  <option value="rejected">Dismiss Appeal (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Remarks / Directives</label>
                <textarea
                  value={resolveRemarks}
                  onChange={(e) => setResolveRemarks(e.target.value)}
                  rows={4}
                  required
                  placeholder="E.g., Department instructed to issue deemed clearance within 48 hours."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingId(null)}
                  className="flex-1 py-2 text-xs border border-gray-300 rounded-xl text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Sign & Issue Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
