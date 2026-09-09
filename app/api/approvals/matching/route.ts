import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMatchingApprovals } from '@/lib/matching'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const profile = await prisma.applicantProfile.findUnique({
      where: { userId: user.id },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Complete onboarding first.' }, { status: 404 })
    }

    const approvals = await getMatchingApprovals(profile, user.id)
    return NextResponse.json({ approvals })
  } catch (error) {
    console.error('Matching approvals error:', error)
    return NextResponse.json({ error: 'Failed to get matching approvals' }, { status: 500 })
  }
}
