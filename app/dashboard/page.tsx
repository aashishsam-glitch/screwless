'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ApprovalCard from '@/components/ApprovalCard'
import SchemeCard from '@/components/SchemeCard'
import LoadingSpinner from '@/components/LoadingSpinner'

interface ApprovalData {
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
    approvalTypeId: string
    status: string
    updatedAt: string
  } | null
}

interface SchemeData {
  scheme: {
    id: string
    name: string
    description: string
    subsidyDetail: string
    sourceUrl: string
  }
  reason: string
}

interface StatusUpdate {
  id: string
  approvalTypeId: string
  status: string
  updatedAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [approvals, setApprovals] = useState<ApprovalData[]>([])
  const [schemes, setSchemes] = useState<SchemeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          router.push('/login')
          return
        }
        const authData = await authRes.json()
        if (authData.user.role === 'officer') {
          router.push('/officer')
          return
        }
        if (!authData.hasProfile) {
          router.push('/onboarding')
          return
        }

        // Fetch approvals and schemes in parallel
        const [approvalsRes, schemesRes] = await Promise.all([
          fetch('/api/approvals/matching'),
          fetch('/api/schemes/matching'),
        ])

        if (approvalsRes.ok) {
          const data = await approvalsRes.json()
          setApprovals(data.approvals)
        }
        if (schemesRes.ok) {
          const data = await schemesRes.json()
          setSchemes(data.schemes)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Poll for status updates every 5 seconds
  // V2: upgrade to WebSockets for instant updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/applications/status')
        if (!res.ok) return
        const data = await res.json()
        const statusUpdates: StatusUpdate[] = data.applications

        // Merge status updates into approvals
        setApprovals(prev =>
          prev.map(approval => {
            const update = statusUpdates.find(
              (s: StatusUpdate) => s.approvalTypeId === approval.approvalType.id
            )
            if (update && approval.application?.status !== update.status) {
              return {
                ...approval,
                application: {
                  id: update.id,
                  approvalTypeId: update.approvalTypeId,
                  status: update.status,
                  updatedAt: update.updatedAt,
                },
              }
            }
            return approval
          })
        )
      } catch {
        // Silent fail on polling — not critical
      }
    }, parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '5000', 10))

    return () => clearInterval(interval)
  }, [])

  // Handle submitting an application
  const handleSubmitApplication = useCallback(async (approvalTypeId: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalTypeId }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to submit application')
        return
      }

      // Update local state with the new application
      setApprovals(prev =>
        prev.map(approval =>
          approval.approvalType.id === approvalTypeId
            ? { ...approval, application: data.application }
            : approval
        )
      )
    } catch (err: any) {
      alert(err.message || 'Failed to submit application')
    }
  }, [])

  // Check if a dependency is met (the depended-upon approval is 'approved')
  const isDependencyMet = useCallback(
    (approval: ApprovalData): boolean => {
      const depId = approval.approvalType.dependsOnId
      if (!depId) return true // No dependency

      const depApproval = approvals.find(a => a.approvalType.id === depId)
      if (!depApproval) return true // Dependency not in our list (shouldn't happen)

      return depApproval.application?.status === 'approved'
    },
    [approvals]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const approvedCount = approvals.filter(a => a.application?.status === 'approved').length
  const totalCount = approvals.length
  const progressPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header with progress */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="text-gray-600 mt-1">Track and manage your industrial approvals</p>

        {/* Progress bar */}
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Approval Progress
            </span>
            <span className="text-sm text-gray-500">
              {approvedCount} of {totalCount} approved ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live update indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Live updates active (polling every 5s)
      </div>

      {/* Required Approvals */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📋 Required Approvals
          <span className="text-sm font-normal text-gray-500 ml-2">({approvals.length} total)</span>
        </h2>

        {approvals.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No approvals required based on your profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.approvalType.id}
                approval={approval}
                isDependencyMet={isDependencyMet(approval)}
                onSubmit={handleSubmitApplication}
              />
            ))
            }
          </div>
        )}
      </section>

      {/* Matched Schemes */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🏦 Matching Government Schemes
          <span className="text-sm font-normal text-gray-500 ml-2">({schemes.length} found)</span>
        </h2>

        {schemes.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No matching schemes found for your profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.scheme.id} scheme={scheme} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
