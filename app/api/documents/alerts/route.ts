import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDocumentAlerts } from '@/lib/documents'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Computes expiry alerts at read-time
    // // V3: add notification delivery (email/SMS) for expiry reminders
    const alerts = await getDocumentAlerts(user.id)

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Document alerts error:', error)
    return NextResponse.json({ error: 'Failed to fetch document alerts' }, { status: 500 })
  }
}
