import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { DocumentType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = formData.get('documentType') as DocumentType | null
    const expiryDateStr = formData.get('expiryDate') as string | null

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and documentType are required' },
        { status: 400 }
      )
    }

    // Save file locally to public/uploads
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExt = path.extname(file.name) || '.pdf'
    const safeBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_')
    const uniqueFileName = `${safeBaseName}_${crypto.randomUUID().slice(0, 8)}${fileExt}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, uniqueFileName)

    await writeFile(filePath, buffer)
    const fileUrl = `/uploads/${uniqueFileName}`

    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        documentType,
        fileName: file.name,
        fileUrl,
        expiryDate,
      },
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
