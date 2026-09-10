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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: applicationDocumentId } = await context.params
    const { commentText } = await request.json()

    if (!commentText || !commentText.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
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
