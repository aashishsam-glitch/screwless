import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentType } from '@prisma/client'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id: applicationId } = await context.params
    const { documentId, documentType } = await request.json()

    if (!documentId || !documentType) {
      return NextResponse.json(
        { error: 'documentId and documentType are required' },
        { status: 400 }
      )
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application || application.applicantId !== user.id) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 })
    }

    // Verify document belongs to user
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!doc || doc.userId !== user.id) {
      return NextResponse.json({ error: 'Document not found in user vault' }, { status: 404 })
    }

    // Check if ApplicationDocument already exists for this type
    const existing = await prisma.applicationDocument.findFirst({
      where: {
        applicationId,
        documentType: documentType as DocumentType,
      },
    })

    let appDoc
    if (existing) {
      appDoc = await prisma.applicationDocument.update({
        where: { id: existing.id },
        data: {
          documentId,
          status: 'attached',
        },
      })
    } else {
      appDoc = await prisma.applicationDocument.create({
        data: {
          applicationId,
          documentId,
          documentType: documentType as DocumentType,
          status: 'attached',
        },
      })
    }

    return NextResponse.json({ applicationDocument: appDoc })
  } catch (error) {
    console.error('Attach document error:', error)
    return NextResponse.json({ error: 'Failed to attach document' }, { status: 500 })
  }
}
