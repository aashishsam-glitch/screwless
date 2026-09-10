'use client'

import { useState } from 'react'
import DocumentStatusBadge from './DocumentStatusBadge'
import DocumentUploadModal from './DocumentUploadModal'
import LoadingSpinner from './LoadingSpinner'
import { formatDocumentType } from '@/lib/documents'

interface Requirement {
  id: string
  approvalTypeId: string
  documentType: string
  isMandatory: boolean
}

interface VaultDoc {
  id: string
  documentType: string
  fileName: string
  fileUrl: string
  expiryDate: string | null
}

interface HaveItem {
  requirement: Requirement
  document: VaultDoc
  statusInfo: {
    status: 'valid' | 'expiring_soon' | 'expired' | 'not_applicable'
    label: string
  }
}

interface AttachedAppDoc {
  id: string
  documentType: string
  status: string
  documentId: string | null
  document?: VaultDoc | null
  comments?: Array<{
    id: string
    commentText: string
    createdAt: string
    officer: { name: string | null; officerDepartment: string | null }
  }>
}

interface DocumentReadinessProps {
  applicationId: string
  have: HaveItem[]
  need: Array<{ requirement: Requirement }>
  attachedDocs: AttachedAppDoc[]
  onRefresh: () => void
}

export default function DocumentReadiness({
  applicationId,
  have,
  need,
  attachedDocs,
  onRefresh,
}: DocumentReadinessProps) {
  const [attaching, setAttaching] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<string | null>(null)

  const handleAttach = async (documentId: string, documentType: string) => {
    setAttaching(documentType)
    try {
      const res = await fetch(`/api/applications/${applicationId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, documentType }),
      })
      if (!res.ok) throw new Error('Attach failed')
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Failed to attach document')
    } finally {
      setAttaching(null)
    }
  }

  const isAttached = (docType: string) => {
    return attachedDocs.some((ad) => ad.documentType === docType && ad.status !== 'missing')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ready in Vault */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">✓</span> You Have These Ready in Vault
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              {have.length} Available
            </span>
          </div>

          {have.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-4 text-center">
              No matching documents currently available in your vault.
            </p>
          ) : (
            <div className="space-y-3">
              {have.map(({ requirement, document, statusInfo }) => {
                const attached = isAttached(requirement.documentType)
                return (
                  <div
                    key={requirement.id}
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {formatDocumentType(requirement.documentType)}
                        </span>
                        {requirement.isMandatory ? (
                          <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium border border-red-200">
                            Mandatory
                          </span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                            Optional
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-gray-500 truncate">
                          {document.fileName}
                        </span>
                        <DocumentStatusBadge
                          status={statusInfo.status}
                          label={statusInfo.label}
                        />
                      </div>
                    </div>

                    <div>
                      {attached ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          ✓ Attached
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAttach(document.id, requirement.documentType)}
                          disabled={attaching === requirement.documentType}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {attaching === requirement.documentType ? (
                            <>
                              <LoadingSpinner size="sm" /> Attaching...
                            </>
                          ) : (
                            'Attach Document ＋'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Still Need These */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-amber-600">!</span> You Still Need These
            </h3>
            <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              {need.length} Missing
            </span>
          </div>

          {need.length === 0 ? (
            <div className="py-6 text-center text-xs text-green-700 font-medium bg-green-50/50 rounded-lg border border-green-100">
              🎉 All required document types exist in your vault!
            </div>
          ) : (
            <div className="space-y-3">
              {need.map(({ requirement }) => (
                <div
                  key={requirement.id}
                  className="p-3 rounded-lg border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {formatDocumentType(requirement.documentType)}
                      </span>
                      {requirement.isMandatory && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload to your vault to satisfy this prerequisite.
                    </p>
                  </div>

                  <button
                    onClick={() => setUploadType(requirement.documentType)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white rounded-lg hover:bg-blue-50 shadow-2xs"
                  >
                    Upload Now ⇡
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Officer Comments Feed */}
      {attachedDocs.some((d) => d.comments && d.comments.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span>💬</span> Officer Verification Comments & Requests
          </h3>
          <div className="space-y-3">
            {attachedDocs.map((doc) =>
              doc.comments?.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-3 rounded-lg border border-amber-200 text-xs text-gray-700 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">
                      Document: {formatDocumentType(doc.documentType)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      By {c.officer.name || 'Department Officer'} ({c.officer.officerDepartment})
                    </span>
                  </div>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                    "{c.commentText}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Vault Reusability Note */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
        <span>💡</span>
        <span>
          <strong>Vault Reusability:</strong> All documents uploaded here or in the Document Vault are permanently stored in your vault and can be attached to any other industrial approvals without re-uploading.
        </span>
      </div>

      {uploadType && (
        <DocumentUploadModal
          initialType={uploadType}
          onClose={() => setUploadType(null)}
          onSuccess={async (newDoc) => {
            const currentUploadType = uploadType
            setUploadType(null)
            if (newDoc?.id) {
              // Automatically attach in one step as per Phase 6 acceptance criteria
              try {
                await fetch(`/api/applications/${applicationId}/documents`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ documentId: newDoc.id, documentType: currentUploadType }),
                })
              } catch {
                // fall through to refresh
              }
            }
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
