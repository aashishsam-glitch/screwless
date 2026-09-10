'use client'

import { useState, useEffect, useRef } from 'react'

interface ProfilePopupProps {
  userId: string
  userName: string | null
  userEmail: string | null
  userPhone: string | null
  onClose: () => void
}

interface PersonalInfoSummary {
  fullName: string
  contactEmail: string | null
  contactPhone: string | null
}

interface BusinessInfoSummary {
  businessName: string
  businessType: string
}

export default function ProfilePopup({ userId, userName, userEmail, userPhone, onClose }: ProfilePopupProps) {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoSummary | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/personal-info').then(r => r.ok ? r.json() : null),
      fetch('/api/business-info').then(r => r.ok ? r.json() : null),
    ]).then(([pData, bData]) => {
      if (pData?.personalInfo) setPersonalInfo(pData.personalInfo)
      if (bData?.businessInfo) setBusinessInfo(bData.businessInfo)
    }).finally(() => setLoading(false))
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const formatBusinessType = (type: string) => {
    const map: Record<string, string> = {
      proprietorship: 'Proprietorship',
      partnership: 'Partnership',
      pvt_ltd: 'Pvt. Ltd.',
      llp: 'LLP',
      other: 'Other',
    }
    return map[type] || type
  }

  return (
    <div ref={popupRef} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <p className="text-white font-semibold text-sm">{personalInfo?.fullName || userName || 'User'}</p>
        <p className="text-blue-100 text-xs">{userEmail || userPhone || ''}</p>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
        ) : (
          <>
            {/* Personal Info Section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Contact</p>
              <p className="text-sm text-gray-700">
                {personalInfo?.contactEmail || personalInfo?.contactPhone || userEmail || userPhone || 'Not added yet'}
              </p>
            </div>

            {/* Business Info Section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Business</p>
              {businessInfo ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">{businessInfo.businessName}</p>
                  <p className="text-xs text-gray-500">{formatBusinessType(businessInfo.businessType)}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Not added yet</p>
              )}
            </div>
          </>
        )}

        {/* Action Button */}
        <a
          href="/profile"
          className="block w-full text-center py-2.5 px-4 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          View / Edit Personal Information
        </a>
      </div>
    </div>
  )
}
