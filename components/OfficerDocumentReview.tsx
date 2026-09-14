'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { formatDocumentType } from '@/lib/documents'

interface OfficerDocumentReviewProps {
  appDoc: {
    id: string
    documentType: string
    status: 'missing' | 'attached' | 'verified' | 'rejected'
    document?: {
      id: string
      fileName: string
      fileUrl: string
      expiryDate: string | null
    } | null
    comments?: Array<{
      id: string
      commentText: string
      createdAt: string
      officer: { name: string | null; officerDepartment: string | null }
    }>
  }
  isMandatory: boolean
  onActionComplete: () => void
}

export default function OfficerDocumentReview({
  appDoc,
  isMandatory,
  onActionComplete,
}: OfficerDocumentReviewProps) {
  const [loading, setLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const handleVerifyAction = async (status: 'verified' | 'rejected') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/officer/documents/${appDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Action failed')
      onActionComplete()
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/officer/documents/${appDoc.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText }),
      })
      if (!res.ok) throw new Error('Comment failed')
      setCommentText('')
      onActionComplete()
    } catch (err: any) {
      alert(err.message || 'Failed to post review comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const isExpired =
    appDoc.document?.expiryDate && new Date(appDoc.document.expiryDate) < new Date()

  let statusBadge
  if (!appDoc.document || appDoc.status === 'missing') {
    statusBadge = (
      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium border border-gray-200">
        ⚪ Missing
      </span>
    )
  } else if (isExpired) {
    statusBadge = (
      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-300">
        🟠 Expired ({new Date(appDoc.document.expiryDate!).toLocaleDateString('en-IN')})
      </span>
    )
  } else if (appDoc.status === 'rejected') {
    statusBadge = (
      <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-medium border border-red-200">
        🔴 Rejected
      </span>
    )
  } else if (appDoc.status === 'verified') {
    statusBadge = (
      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium border border-emerald-300">
        🟢 Verified
      </span>
    )
  } else {
    statusBadge = (
      <span className="text-[10px] bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded font-medium border border-yellow-300">
        🟡 Pending Verification
      </span>
    )
  }

  const uploadedDate = (appDoc.document as any)?.uploadedAt
    ? new Date((appDoc.document as any).uploadedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-gray-900">
              {formatDocumentType(appDoc.documentType)}
            </h4>
            {isMandatory ? (
              <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200">
                Mandatory
              </span>
            ) : (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                Optional
              </span>
            )}
            {statusBadge}
          </div>
          {appDoc.document ? (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs font-mono text-gray-600">{appDoc.document.fileName}</span>
              {uploadedDate && (
                <span className="text-xs text-gray-400">Uploaded: {uploadedDate}</span>
              )}
              <a
                href={appDoc.document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Inspect Document ↗
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-1 italic">Applicant has not attached this file yet.</p>
          )}
        </div>

        {/* Verification Action Buttons */}
        {appDoc.document && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleVerifyAction('verified')}
              disabled={loading || (appDoc.status === 'verified' && !isExpired)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              ✓ Verify
            </button>
            <button
              onClick={() => handleVerifyAction('rejected')}
              disabled={loading || appDoc.status === 'rejected'}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              ✕ Reject
            </button>
          </div>
        )}
      </div>

      {/* Existing Comments */}
      {appDoc.comments && appDoc.comments.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Review History</p>
          {appDoc.comments.map((c) => (
            <div key={c.id} className="text-xs bg-white p-2 rounded border border-gray-200">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span className="font-semibold text-gray-700">{c.officer.name || 'Officer'}</span>
                <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <p className="text-gray-800">"{c.commentText}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {appDoc.document && (
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add officer note (e.g. 'Plan blurry, please re-upload with clear scale')..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={submittingComment || !commentText.trim()}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-xs font-medium rounded-lg"
          >
            {submittingComment ? <LoadingSpinner size="sm" /> : 'Add Note'}
          </button>
        </form>
      )}
    </div>
  )
}
