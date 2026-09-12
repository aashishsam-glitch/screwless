'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

interface SlaSummary {
  totalApplications: number
  approvedCount: number
  delayedCount: number
  withinSlaCount: number
  avgTurnaroundDays: number
  slaComplianceRate: number
}

interface DepartmentStat {
  department: string
  total: number
  approved: number
  delayed: number
  avgDays: number
  complianceRate: number
}

interface DistrictStat {
  district: string
  total: number
  approved: number
  delayed: number
  complianceRate: number
}

const DEPT_NAMES: Record<string, string> = {
  fire_dept: 'Fire Department',
  mpcb: 'Pollution Control (MPCB)',
  dish: 'Factory Safety (DISH)',
  municipal_corp: 'Municipal Corporation',
  labour_dept: 'Labour Department',
  midc: 'MIDC Infrastructure',
  msedcl: 'Electricity (MSEDCL)',
  water_resources: 'Water Resources',
  tax_dept: 'Tax Department',
}

export default function SlaAnalyticsPage() {
  const [summary, setSummary] = useState<SlaSummary | null>(null)
  const [departments, setDepartments] = useState<DepartmentStat[]>([])
  const [districts, setDistricts] = useState<DistrictStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/sla')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSummary(data.summary)
          setDepartments(data.departmentStats || [])
          setDistricts(data.districtStats || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md">
        <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30">
          State EoDB Intelligence & RTSA Monitoring
        </span>
        <h1 className="text-2xl font-bold mt-2">Statutory SLA Compliance & Bottleneck Analytics</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-2xl leading-relaxed">
          Real-time performance analytics tracking clearance turnaround times, backlog rates, and delay frequencies across departments and districts in Maharashtra.
        </p>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Overall SLA Compliance</span>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{summary.slaComplianceRate}%</p>
            <p className="text-[11px] text-gray-500 mt-1">Within Citizen’s Charter limits</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Average Turnaround</span>
            <p className="text-3xl font-extrabold text-blue-600 mt-2">{summary.avgTurnaroundDays} <span className="text-sm font-medium">Days</span></p>
            <p className="text-[11px] text-gray-500 mt-1">From intake to final clearance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Breaches (Delayed)</span>
            <p className="text-3xl font-extrabold text-red-600 mt-2">{summary.delayedCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">Exceeded statutory timeframe</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Applications</span>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{summary.totalApplications}</p>
            <p className="text-[11px] text-gray-500 mt-1">{summary.approvedCount} granted approvals</p>
          </div>
        </div>
      )}

      {/* Department-wise SLA Matrix */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              🏢 Departmental SLA Compliance & Velocity
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Identifies bottlenecks and overdue queue counts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Total Load</th>
                <th className="px-6 py-3.5">Approved</th>
                <th className="px-6 py-3.5">Overdue / Delayed</th>
                <th className="px-6 py-3.5">Avg Turnaround</th>
                <th className="px-6 py-3.5">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {departments.map((dept) => (
                <tr key={dept.department} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {DEPT_NAMES[dept.department] || dept.department}
                  </td>
                  <td className="px-6 py-4">{dept.total}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">{dept.approved}</td>
                  <td className="px-6 py-4">
                    {dept.delayed > 0 ? (
                      <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ {dept.delayed} Overdue
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{dept.avgDays} Days</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            dept.complianceRate >= 80
                              ? 'bg-emerald-500'
                              : dept.complianceRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${dept.complianceRate}%` }}
                        />
                      </div>
                      <span className="font-bold">{dept.complianceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* District-wise Performance Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            📍 District-Level Clearance Efficiency
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">SLA achievement rate by industrial region</p>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {districts.map((dist) => (
            <div
              key={dist.district}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{dist.district}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  {dist.complianceRate}% SLA
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {dist.total} applications · {dist.delayed} delayed
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
