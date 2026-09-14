import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { DocumentType } from '@prisma/client'
import { isValidDocumentType } from '@/lib/validation'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])

function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
  // JPEG: 0xFF 0xD8 0xFF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47

  return isPdf || isJpeg || isPng
}

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

    if (!isValidDocumentType(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // 1. File size check (BUG 9)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5 MB' },
        { status: 400 }
      )
    }

    // 2. Extension check
    const fileExt = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { error: `Invalid file extension "${fileExt}". Only PDF, JPG, and PNG files are allowed.` },
        { status: 400 }
      )
    }

    // 3. MIME type check
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}". Only PDF, JPG, and PNG files are allowed.` },
        { status: 400 }
      )
    }

    // 4. File signature / Magic bytes check
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    if (!validateMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'File signature validation failed. Uploaded content does not match a valid PDF, JPG, or PNG file.' },
        { status: 400 }
      )
    }

    // 5. Private Storage Path outside public root (BUG 8)
    const storageDir = path.join(process.cwd(), 'storage', 'uploads')
    await mkdir(storageDir, { recursive: true })

    const uniqueFileName = `${crypto.randomUUID()}${fileExt}`
    const filePath = path.join(storageDir, uniqueFileName)

    await writeFile(filePath, buffer)

    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null

    // First create DB record
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        documentType,
        fileName: path.basename(file.name),
        fileUrl: `/storage/uploads/${uniqueFileName}`, // Internal storage reference
        expiryDate,
      },
    })

    // Secure access URL via protected API route
    const secureUrl = `/api/documents/file/${doc.id}`
    const updatedDoc = await prisma.document.update({
      where: { id: doc.id },
      data: { fileUrl: secureUrl },
    })

    return NextResponse.json({ document: updatedDoc }, { status: 201 })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
