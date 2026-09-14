import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // BUG 7: Only authorized officers/admins can access state-wide analytics
    if (user.role !== 'officer') {
      return NextResponse.json(
        { error: 'Forbidden: State-wide SLA analytics accessible by authorized officers only' },
        { status: 403 }
      )
    }

    const applications = await prisma.application.findMany({
      include: {
        approvalType: true,
        applicant: {
          include: {
            profile: true,
          },
        },
      },
    })

    const now = new Date()

    let totalApplications = applications.length
    let approvedCount = 0
    let completedWithinSla = 0
    let completedAfterSla = 0
    let currentlyOverdue = 0
    let activeWithinSla = 0
    let slaNotConfigured = 0
    let totalTurnaroundDays = 0

    const departmentMap: Record<
      string,
      {
        total: number
        approved: number
        completedWithinSla: number
        completedAfterSla: number
        overdue: number
        activeWithinSla: number
        notConfigured: number
        totalTurnaroundDays: number
      }
    > = {}

    const districtMap: Record<
      string,
      {
        total: number
        approved: number
        completedWithinSla: number
        completedAfterSla: number
        overdue: number
        activeWithinSla: number
        notConfigured: number
      }
    > = {}

    for (const app of applications) {
      const dept = app.assignedOfficerDept || app.approvalType?.department || 'other'
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          total: 0,
          approved: 0,
          completedWithinSla: 0,
          completedAfterSla: 0,
          overdue: 0,
          activeWithinSla: 0,
          notConfigured: 0,
          totalTurnaroundDays: 0,
        }
      }
      departmentMap[dept].total++

      const district = app.applicant?.profile?.locationDistrict || 'Maharashtra'
      if (!districtMap[district]) {
        districtMap[district] = {
          total: 0,
          approved: 0,
          completedWithinSla: 0,
          completedAfterSla: 0,
          overdue: 0,
          activeWithinSla: 0,
          notConfigured: 0,
        }
      }
      districtMap[district].total++

      // SLA configured check
      if (!app.slaDueDate) {
        slaNotConfigured++
        departmentMap[dept].notConfigured++
        districtMap[district].notConfigured++
        continue
      }

      const isCompleted = app.status === 'approved' || app.status === 'rejected'

      if (isCompleted) {
        if (app.status === 'approved') {
          approvedCount++
          departmentMap[dept].approved++
          districtMap[district].approved++
        }

        const durationMs = app.updatedAt.getTime() - app.createdAt.getTime()
        const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)))
        totalTurnaroundDays += durationDays
        departmentMap[dept].totalTurnaroundDays += durationDays

        if (app.updatedAt <= app.slaDueDate) {
          completedWithinSla++
          departmentMap[dept].completedWithinSla++
          districtMap[district].completedWithinSla++
        } else {
          completedAfterSla++
          departmentMap[dept].completedAfterSla++
          districtMap[district].completedAfterSla++
        }
      } else {
        // Active application
        if (now > app.slaDueDate) {
          currentlyOverdue++
          departmentMap[dept].overdue++
          districtMap[district].overdue++
        } else {
          activeWithinSla++
          departmentMap[dept].activeWithinSla++
          districtMap[district].activeWithinSla++
        }
      }
    }

    const totalCompleted = completedWithinSla + completedAfterSla
    const avgTurnaroundDays = totalCompleted > 0 ? Math.round(totalTurnaroundDays / totalCompleted) : null

    // Compliance rate calculation: configured compliant applications over total configured applications
    const totalConfigured = totalApplications - slaNotConfigured
    const totalCompliant = completedWithinSla + activeWithinSla

    const slaComplianceRate =
      totalConfigured > 0 ? Math.round((totalCompliant / totalConfigured) * 100) : null

    const departmentStats = Object.entries(departmentMap).map(([dept, stats]) => {
      const deptCompleted = stats.completedWithinSla + stats.completedAfterSla
      const deptConfigured = stats.total - stats.notConfigured
      const deptCompliant = stats.completedWithinSla + stats.activeWithinSla
      return {
        department: dept,
        total: stats.total,
        approved: stats.approved,
        completedWithinSla: stats.completedWithinSla,
        completedAfterSla: stats.completedAfterSla,
        overdue: stats.overdue,
        activeWithinSla: stats.activeWithinSla,
        notConfigured: stats.notConfigured,
        avgDays: deptCompleted > 0 ? Math.round(stats.totalTurnaroundDays / deptCompleted) : null,
        complianceRate: deptConfigured > 0 ? Math.round((deptCompliant / deptConfigured) * 100) : null,
      }
    })

    const districtStats = Object.entries(districtMap).map(([district, stats]) => {
      const distConfigured = stats.total - stats.notConfigured
      const distCompliant = stats.completedWithinSla + stats.activeWithinSla
      return {
        district,
        total: stats.total,
        approved: stats.approved,
        completedWithinSla: stats.completedWithinSla,
        completedAfterSla: stats.completedAfterSla,
        overdue: stats.overdue,
        activeWithinSla: stats.activeWithinSla,
        notConfigured: stats.notConfigured,
        complianceRate: distConfigured > 0 ? Math.round((distCompliant / distConfigured) * 100) : null,
      }
    })

    return NextResponse.json({
      summary: {
        totalApplications,
        approvedCount,
        completedWithinSla,
        completedAfterSla,
        currentlyOverdue,
        activeWithinSla,
        slaNotConfigured,
        avgTurnaroundDays,
        slaComplianceRate,
      },
      departmentStats,
      districtStats,
    })
  } catch (error) {
    console.error('SLA Analytics error:', error)
    return NextResponse.json({ error: 'Failed to compute SLA analytics' }, { status: 500 })
  }
}
