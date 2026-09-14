import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidInspectionStatus } from '@/lib/validation'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'officer') {
      return NextResponse.json({ error: 'Unauthorized. Officers only.' }, { status: 403 })
    }

    const { id: inspectionId } = await context.params
    const body = await request.json()
    const { findings, reportUrl, status } = body

    if (!findings || !findings.trim()) {
      return NextResponse.json({ error: 'Inspection findings are required' }, { status: 400 })
    }

    if (status && !isValidInspectionStatus(status)) {
      return NextResponse.json({ error: 'Invalid inspection status' }, { status: 400 })
    }

    // Verify inspection existence & assigned officers
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        officers: true,
      },
    })

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Check if logged-in officer is assigned to this inspection
    const isAssigned = inspection.officers.some(
      (o) => o.officerId === user.id || (user.officerDepartment && o.department === user.officerDepartment)
    )

    if (!isAssigned) {
      return NextResponse.json(
        { error: 'Forbidden: You are not assigned to this inspection' },
        { status: 403 }
      )
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        findings: findings.trim(),
        reportUrl: reportUrl || null,
        status: status || 'completed',
      },
      include: {
        application: { include: { approvalType: true } },
        officers: { include: { officer: true } },
      },
    })

    return NextResponse.json({ inspection: updated })
  } catch (error) {
    console.error('Submit inspection report error:', error)
    return NextResponse.json({ error: 'Failed to submit inspection report' }, { status: 500 })
  }
}
