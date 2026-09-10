import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDocumentStatus } from '@/lib/documents'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: 'desc' },
    })

    const docsWithStatus = documents.map((doc) => ({
      ...doc,
      statusInfo: getDocumentStatus(doc.expiryDate),
    }))

    return NextResponse.json({ documents: docsWithStatus })
  } catch (error) {
    console.error('List documents error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
