import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!findings) {
      return NextResponse.json({ error: 'Inspection findings are required' }, { status: 400 })
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        findings,
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
