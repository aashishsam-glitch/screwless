import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidGrievanceStatus } from '@/lib/validation'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Unauthorized. Officers only.' }, { status: 403 })
    }

    const { id: grievanceId } = await context.params
    const body = await request.json()
    const { status, resolutionRemarks } = body

    if (!status || !isValidGrievanceStatus(status) || status === 'pending') {
      return NextResponse.json(
        { error: 'Valid status required (under_review, resolved, or rejected)' },
        { status: 400 }
      )
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id: grievanceId },
      include: {
        application: {
          include: { approvalType: true },
        },
      },
    })

    if (!grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 })
    }

    // Check authorization based on grievance tier
    if (grievance.tier === 'tier_1_district') {
      const assignedDept = grievance.application.assignedOfficerDept || grievance.application.approvalType.department
      if (user.officerDepartment !== assignedDept) {
        return NextResponse.json(
          { error: 'Forbidden: You are not authorized to resolve District Tier 1 grievances for this department' },
          { status: 403 }
        )
      }
    } else if (grievance.tier === 'tier_2_state') {
      // Tier 2 state grievances require state empowered committee or assigned officer department
      const isStateAuthorized =
        user.officerDepartment === 'state_empowered_committee' ||
        user.officerDepartment === grievance.application.assignedOfficerDept ||
        user.officerDepartment === 'industry_dept'

      if (!isStateAuthorized) {
        return NextResponse.json(
          { error: 'Forbidden: State Tier 2 grievance resolution requires authorized state authority' },
          { status: 403 }
        )
      }
    }

    // Audit log entry in resolution remarks
    const auditInfo = `[Resolved by Officer ${user.name || user.email} (${user.officerDepartment}) at ${new Date().toISOString()}]`
    const finalRemarks = resolutionRemarks
      ? `${resolutionRemarks.trim()} ${auditInfo}`
      : auditInfo

    const updated = await prisma.grievance.update({
      where: { id: grievanceId },
      data: {
        status,
        resolutionRemarks: finalRemarks,
      },
      include: {
        application: { include: { approvalType: true } },
      },
    })

    return NextResponse.json({ grievance: updated })
  } catch (error) {
    console.error('Resolve grievance error:', error)
    return NextResponse.json({ error: 'Failed to update grievance' }, { status: 500 })
  }
}
