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

    const { id: applicationDocumentId } = await context.params
    const { commentText } = await request.json()

    if (!commentText || !commentText.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    const appDoc = await prisma.applicationDocument.findUnique({
      where: { id: applicationDocumentId },
      include: {
        application: {
          include: { approvalType: true },
        },
      },
    })

    if (!appDoc) {
      return NextResponse.json({ error: 'Document record not found' }, { status: 404 })
    }

    // Verify officer department matches application assigned officer department
    const assignedDept = appDoc.application.assignedOfficerDept || appDoc.application.approvalType.department
    if (!user.officerDepartment || user.officerDepartment !== assignedDept) {
      return NextResponse.json(
        { error: 'Forbidden: Document belongs to another department' },
        { status: 403 }
      )
    }

    const comment = await prisma.documentComment.create({
      data: {
        applicationDocumentId,
        officerId: user.id,
        commentText: commentText.trim(),
      },
      include: {
        officer: {
          select: { name: true, officerDepartment: true },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Comment doc error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
