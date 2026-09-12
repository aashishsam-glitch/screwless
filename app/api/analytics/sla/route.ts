import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

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
    let delayedCount = 0
    let withinSlaCount = 0
    let totalTurnaroundDays = 0
    let completedWithTime = 0

    const departmentMap: Record<
      string,
      {
        total: number
        approved: number
        delayed: number
        totalDays: number
      }
    > = {}

    const districtMap: Record<
      string,
      {
        total: number
        approved: number
        delayed: number
      }
    > = {}

    for (const app of applications) {
      const dept = app.assignedOfficerDept || 'other'
      if (!departmentMap[dept]) {
        departmentMap[dept] = { total: 0, approved: 0, delayed: 0, totalDays: 0 }
      }
      departmentMap[dept].total++

      const district = app.applicant.profile?.locationDistrict || 'Maharashtra'
      if (!districtMap[district]) {
        districtMap[district] = { total: 0, approved: 0, delayed: 0 }
      }
      districtMap[district].total++

      const isCompleted = app.status === 'approved'
      if (isCompleted) {
        approvedCount++
        departmentMap[dept].approved++
        districtMap[district].approved++

        const durationMs = app.updatedAt.getTime() - app.createdAt.getTime()
        const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)))
        totalTurnaroundDays += durationDays
        completedWithTime++
        departmentMap[dept].totalDays += durationDays
      }

      // Check if overdue
      const isOverdue =
        app.status !== 'approved' &&
        app.status !== 'rejected' &&
        app.slaDueDate &&
        app.slaDueDate < now

      if (isOverdue) {
        delayedCount++
        departmentMap[dept].delayed++
        districtMap[district].delayed++
      } else {
        withinSlaCount++
      }
    }

    const avgTurnaroundDays =
      completedWithTime > 0 ? Math.round(totalTurnaroundDays / completedWithTime) : 14

    const slaComplianceRate =
      totalApplications > 0
        ? Math.round(((totalApplications - delayedCount) / totalApplications) * 100)
        : 100

    const departmentStats = Object.entries(departmentMap).map(([dept, stats]) => ({
      department: dept,
      total: stats.total,
      approved: stats.approved,
      delayed: stats.delayed,
      avgDays: stats.approved > 0 ? Math.round(stats.totalDays / stats.approved) : 15,
      complianceRate:
        stats.total > 0
          ? Math.round(((stats.total - stats.delayed) / stats.total) * 100)
          : 100,
    }))

    const districtStats = Object.entries(districtMap).map(([district, stats]) => ({
      district,
      total: stats.total,
      approved: stats.approved,
      delayed: stats.delayed,
      complianceRate:
        stats.total > 0
          ? Math.round(((stats.total - stats.delayed) / stats.total) * 100)
          : 100,
    }))

    return NextResponse.json({
      summary: {
        totalApplications,
        approvedCount,
        delayedCount,
        withinSlaCount,
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
