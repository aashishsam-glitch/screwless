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

    const applications = await prisma.application.findMany({
      where: { applicantId: user.id },
      select: {
        id: true,
        approvalTypeId: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Status poll error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
