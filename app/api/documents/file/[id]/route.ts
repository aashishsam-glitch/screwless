import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const { id: documentId } = await context.params

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        applicationDocuments: {
          include: {
            application: true,
          },
        },
      },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Authorization Check
    let isAuthorized = false

    if (doc.userId === user.id) {
      isAuthorized = true
    } else if (user.role === 'officer') {
      // Check if document is attached to an application assigned to officer's department
      const isAttachedToOfficerDept = doc.applicationDocuments.some(
        (ad) => ad.application.assignedOfficerDept === user.officerDepartment
      )
      if (isAttachedToOfficerDept) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 })
    }

    // Determine file location
    let filePath: string
    if (doc.fileUrl.startsWith('/storage/uploads/')) {
      const fileName = path.basename(doc.fileUrl)
      filePath = path.join(process.cwd(), 'storage', 'uploads', fileName)
    } else if (doc.fileUrl.startsWith('/uploads/')) {
      const fileName = path.basename(doc.fileUrl)
      filePath = path.join(process.cwd(), 'public', 'uploads', fileName)
    } else {
      filePath = path.join(process.cwd(), doc.fileUrl.replace(/^\//, ''))
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File content not found on server' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    const ext = path.extname(doc.fileName || filePath).toLowerCase()
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Download document error:', error)
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 })
  }
}
