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

    const { id: grievanceId } = await context.params
    const body = await request.json()
    const { status, resolutionRemarks } = body

    if (!['resolved', 'rejected', 'under_review'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await prisma.grievance.update({
      where: { id: grievanceId },
      data: {
        status,
        resolutionRemarks: resolutionRemarks || null,
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
