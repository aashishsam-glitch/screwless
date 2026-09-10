'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

const DOCUMENT_TYPES = [
  { value: 'pan', label: 'PAN Card' },
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'gstin_certificate', label: 'GSTIN Certificate' },
  { value: 'factory_layout_plan', label: 'Factory Layout Plan' },
  { value: 'land_ownership_proof', label: 'Land Ownership Proof / Deed' },
  { value: 'electricity_bill', label: 'Electricity Bill' },
  { value: 'building_plan_copy', label: 'Building Plan Approval Copy' },
  { value: 'fire_safety_layout', label: 'Fire Safety Plan / Layout' },
  { value: 'pollution_control_cert', label: 'Pollution Control / Consent Certificate' },
  { value: 'water_usage_plan', label: 'Water Usage Plan' },
  { value: 'labour_license_copy', label: 'Labour License Copy' },
  { value: 'noc_previous', label: 'Previous NOC / Clearance' },
  { value: 'incorporation_cert', label: 'Certificate of Incorporation' },
  { value: 'udyam_certificate', label: 'Udyam Registration Certificate' },
  { value: 'other', label: 'Other Document' },
]

interface DocumentUploadModalProps {
  initialType?: string
  onClose: () => void
  onSuccess: (newDoc?: any) => void
}

export default function DocumentUploadModal({
  initialType,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [documentType, setDocumentType] = useState(initialType || 'pan')
  const [file, setFile] = useState<File | null>(null)
  const [expiryDate, setExpiryDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)
      if (expiryDate) formData.append('expiryDate', expiryDate)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      onSuccess(data.document)
    } catch (err: any) {
      setError(err.message || 'Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload to Document Vault</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
              required
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              File (PDF, PNG, JPG) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.png,.jpg,.jpeg"
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Expiry Date <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Documents nearing expiry within 30 days trigger in-app renewal reminders.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
