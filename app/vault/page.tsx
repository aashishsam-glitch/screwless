'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import DocumentStatusBadge from '@/components/DocumentStatusBadge'
import DocumentUploadModal from '@/components/DocumentUploadModal'
import { formatDocumentType } from '@/lib/documents'

interface VaultDocument {
  id: string
  documentType: string
  fileName: string
  fileUrl: string
  uploadedAt: string
  expiryDate: string | null
  statusInfo: {
    status: 'valid' | 'expiring_soon' | 'expired' | 'not_applicable'
    label: string
    daysUntilExpiry: number | null
  }
}

export default function DocumentVaultPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<VaultDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [error, setError] = useState('')

  const fetchDocuments = async () => {
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/documents')
      if (!res.ok) throw new Error('Failed to load documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (err: any) {
      setError(err.message || 'Error fetching vault records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📁 Document Vault
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Central repository for reusable business & regulatory certificates. Upload once, attach anywhere.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
        >
          <span>＋</span> Upload Document
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 text-xl">
            📂
          </div>
          <h3 className="text-base font-semibold text-gray-800">Your Document Vault is empty</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Upload your PAN, GSTIN, layouts, and proof of land ownership to easily attach them to approval requests.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Document Type</th>
                  <th className="px-6 py-3.5">File Name</th>
                  <th className="px-6 py-3.5">Upload Date</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => {
                  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  const expiryDisplay = doc.expiryDate
                    ? new Date(doc.expiryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'No Expiry'

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatDocumentType(doc.documentType)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-700">{doc.fileName}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{uploadDate}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{expiryDisplay}</td>
                      <td className="px-6 py-4">
                        <DocumentStatusBadge
                          status={doc.statusInfo.status}
                          label={doc.statusInfo.label}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          View File ↗
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchDocuments()
          }}
        />
      )}
    </div>
  )
}
