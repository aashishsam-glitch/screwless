'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import OfficerQueueRow from '@/components/OfficerQueueRow'
import LoadingSpinner from '@/components/LoadingSpinner'

interface OfficerInfo {
  name: string | null
  officerDepartment: string | null
}

interface QueueApplication {
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

const DEPARTMENT_LABELS: Record<string, string> = {
  fire_dept: 'Fire Department',
  mpcb: 'Maharashtra Pollution Control Board (MPCB)',
  dish: 'Directorate of Industrial Safety & Health (DISH)',
  municipal_corp: 'Municipal Corporation',
  labour_dept: 'Labour Department',
  midc: 'Maharashtra Industrial Development Corporation (MIDC)',
  msedcl: 'MSEDCL (Electricity)',
  water_resources: 'Water Resources Department',
  tax_dept: 'Tax Department',
}

export default function OfficerDashboardPage() {
  const router = useRouter()
  const [officer, setOfficer] = useState<OfficerInfo | null>(null)
  const [applications, setApplications] = useState<QueueApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch officer info and queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/officer/queue')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          router.push('/dashboard')
          return
        }
        return
      }
      const data = await res.json()
      setApplications(data.applications)
    } catch {
      // Silent fail on poll
    }
  }, [router])

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          router.push('/login')
          return
        }
        const authData = await authRes.json()
        if (authData.user.role !== 'officer') {
          router.push('/dashboard')
          return
        }

        setOfficer({
          name: authData.user.name,
          officerDepartment: authData.user.officerDepartment,
        })

        // Fetch initial queue
        await fetchQueue()
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router, fetchQueue])

  // Poll for new applications every 5 seconds
  // V2: upgrade to WebSockets for instant updates
  useEffect(() => {
    const interval = setInterval(fetchQueue, parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '5000', 10))
    return () => clearInterval(interval)
  }, [fetchQueue])

  // Handle officer action
  const handleAction = useCallback(async (applicationId: string, action: string) => {
    try {
      const res = await fetch('/api/officer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Action failed')
        return
      }

      // Remove the application from the queue (it's been acted on)
      setApplications(prev => prev.filter(app => app.id !== applicationId))
    } catch (err: any) {
      alert(err.message || 'Action failed')
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading officer dashboard...</p>
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

  const deptLabel = officer?.officerDepartment 
    ? DEPARTMENT_LABELS[officer.officerDepartment] || officer.officerDepartment 
    : 'Unknown Department'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Officer Dashboard</h1>
            <p className="text-gray-600">{deptLabel}</p>
            <p className="text-sm text-gray-400">Welcome, {officer?.name || 'Officer'}</p>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Live queue — auto-refreshing every 5s
      </div>

      {/* Queue */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Application Queue
          <span className="ml-2 inline-flex items-center justify-center w-7 h-7 text-sm font-bold text-white bg-blue-600 rounded-full">
            {applications.length}
          </span>
        </h2>

        {applications.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Queue Empty</h3>
            <p className="text-gray-500">No pending applications for your department. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => (
              <OfficerQueueRow
                key={app.id}
                application={app}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
