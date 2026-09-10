'use client'

import { useState, useEffect } from 'react'
import DocumentStatusBadge from './DocumentStatusBadge'
import { formatDocumentType } from '@/lib/documents'

export default function DocumentAlertWidget() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents/alerts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.alerts) setAlerts(data.alerts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || alerts.length === 0) return null

  // In-app alert notification
  // // V3: add notification delivery (email/SMS) for expiry reminders
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base animate-bounce">⚠️</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Document Expiry & Compliance Alerts ({alerts.length})
          </h3>
        </div>
        <a
          href="/vault"
          className="text-xs font-semibold text-amber-900 hover:text-amber-700 underline"
        >
          Manage in Vault →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {alerts.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg border border-amber-200/80 text-xs"
          >
            <div className="truncate pr-2">
              <p className="font-semibold text-gray-900 truncate">
                {formatDocumentType(doc.documentType)}
              </p>
              <p className="text-[11px] font-mono text-gray-500 truncate">{doc.fileName}</p>
            </div>
            <DocumentStatusBadge
              status={doc.statusInfo.status}
              label={doc.statusInfo.label}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
