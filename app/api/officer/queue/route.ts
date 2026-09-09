import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// V2: upgrade to WebSockets for instant updates instead of polling
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'officer') {
      return NextResponse.json({ error: 'Access denied. Officer role required.' }, { status: 403 })
    }
    if (!user.officerDepartment) {
      return NextResponse.json({ error: 'Officer department not configured' }, { status: 400 })
    }

    const applications = await prisma.application.findMany({
      where: {
        assignedOfficerDept: user.officerDepartment,
        status: { in: ['submitted', 'in_review', 'info_requested'] },
      },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profile: {
              select: {
                sector: true,
                scale: true,
                locationDistrict: true,
                riskCategory: true,
                stage: true,
              },
            },
          },
        },
        approvalType: true,
      },
      orderBy: { createdAt: 'asc' }, // FIFO queue
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Officer queue error:', error)
    return NextResponse.json({ error: 'Failed to get queue' }, { status: 500 })
  }
}
