'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

const BUSINESS_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'pvt_ltd', label: 'Private Limited Company' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'other', label: 'Other' },
]

export default function PersonalInfoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAadhar, setShowAadhar] = useState(false)
  const [showPan, setShowPan] = useState(false)
  const [maskedAadhar, setMaskedAadhar] = useState<string | null>(null)
  const [maskedPan, setMaskedPan] = useState<string | null>(null)
  const [revealedAadhar, setRevealedAadhar] = useState<string | null>(null)
  const [revealedPan, setRevealedPan] = useState<string | null>(null)
  const [hasExistingData, setHasExistingData] = useState(false)

  const [personal, setPersonal] = useState({
    fullName: '',
    dob: '',
    aadhar: '',
    pan: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    alternateContact: '',
  })

  const [business, setBusiness] = useState({
    businessName: '',
    businessType: '',
    gstin: '',
    udyamRegistrationNumber: '',
    incorporationDate: '',
  })

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) { router.push('/login'); return }

        const [pRes, bRes] = await Promise.all([
          fetch('/api/personal-info'),
          fetch('/api/business-info'),
        ])

        if (pRes.ok) {
          const pData = await pRes.json()
          if (pData.personalInfo) {
            const p = pData.personalInfo
            setPersonal(prev => ({
              ...prev,
              fullName: p.fullName || '',
              dob: p.dob || '',
              address: p.address || '',
              contactEmail: p.contactEmail || '',
              contactPhone: p.contactPhone || '',
              alternateContact: p.alternateContact || '',
              // Don't populate aadhar/pan - they're masked
            }))
            setMaskedAadhar(p.aadhar)
            setMaskedPan(p.pan)
            setHasExistingData(true)
          }
        }

        if (bRes.ok) {
          const bData = await bRes.json()
          if (bData.businessInfo) {
            const b = bData.businessInfo
            setBusiness({
              businessName: b.businessName || '',
              businessType: b.businessType || '',
              gstin: b.gstin || '',
              udyamRegistrationNumber: b.udyamRegistrationNumber || '',
              incorporationDate: b.incorporationDate || '',
            })
          }
        }
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  // Reveal Aadhar/PAN
  const handleReveal = async (field: 'aadhar' | 'pan') => {
    try {
      const res = await fetch('/api/personal-info?reveal=true')
      if (res.ok) {
        const data = await res.json()
        if (field === 'aadhar') {
          setRevealedAadhar(data.personalInfo?.aadhar || null)
          setShowAadhar(true)
        } else {
          setRevealedPan(data.personalInfo?.pan || null)
          setShowPan(true)
        }
      }
    } catch {
      // silent fail
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // Save personal info
      const pRes = await fetch('/api/personal-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: personal.fullName,
          dob: personal.dob || null,
          aadhar: personal.aadhar || undefined, // Only send if user typed new value
          pan: personal.pan || undefined,
          address: personal.address || null,
          contactEmail: personal.contactEmail || null,
          contactPhone: personal.contactPhone || null,
          alternateContact: personal.alternateContact || null,
        }),
      })
      if (!pRes.ok) {
        const data = await pRes.json()
        throw new Error(data.error || 'Failed to save personal info')
      }

      // Save business info if business name is provided
      if (business.businessName && business.businessType) {
        const bRes = await fetch('/api/business-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(business),
        })
        if (!bRes.ok) {
          const data = await bRes.json()
          throw new Error(data.error || 'Failed to save business info')
        }
      }

      setSuccess('Information saved successfully!')
      // Clear the raw aadhar/pan fields after save
      setPersonal(prev => ({ ...prev, aadhar: '', pan: '' }))
      // Reload masked values
      const freshRes = await fetch('/api/personal-info')
      if (freshRes.ok) {
        const freshData = await freshRes.json()
        setMaskedAadhar(freshData.personalInfo?.aadhar)
        setMaskedPan(freshData.personalInfo?.pan)
        setHasExistingData(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">← Back to Dashboard</a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Personal Information</h1>
        <p className="text-gray-600 mt-1">
          Your KYC details for government approval applications. Aadhar and PAN are stored encrypted.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Personal Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">👤</span>
            Personal Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={personal.fullName} onChange={e => setPersonal({...personal, fullName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={personal.dob} onChange={e => setPersonal({...personal, dob: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={personal.contactEmail} onChange={e => setPersonal({...personal, contactEmail: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input type="tel" value={personal.contactPhone} onChange={e => setPersonal({...personal, contactPhone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact</label>
              <input type="text" value={personal.alternateContact} onChange={e => setPersonal({...personal, alternateContact: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={personal.address} onChange={e => setPersonal({...personal, address: e.target.value})} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>

            {/* Aadhar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhar Number
                <span className="ml-1 text-xs text-gray-400">🔒 Encrypted</span>
              </label>
              {hasExistingData && maskedAadhar ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono text-sm">
                    {showAadhar && revealedAadhar ? revealedAadhar : maskedAadhar}
                  </div>
                  <button type="button" onClick={() => showAadhar ? setShowAadhar(false) : handleReveal('aadhar')} className="px-3 py-3 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                    {showAadhar ? '🙈 Hide' : '👁 Reveal'}
                  </button>
                </div>
              ) : null}
              <input type="text" value={personal.aadhar} onChange={e => setPersonal({...personal, aadhar: e.target.value.replace(/[^0-9\s]/g, '')})} placeholder={hasExistingData ? 'Enter new Aadhar to update' : '1234 5678 9012'} maxLength={14} className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono" />
              <p className="text-xs text-gray-400 mt-1">12-digit Aadhar number. Stored encrypted at rest.</p>
            </div>

            {/* PAN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
                <span className="ml-1 text-xs text-gray-400">🔒 Encrypted</span>
              </label>
              {hasExistingData && maskedPan ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono text-sm">
                    {showPan && revealedPan ? revealedPan : maskedPan}
                  </div>
                  <button type="button" onClick={() => showPan ? setShowPan(false) : handleReveal('pan')} className="px-3 py-3 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                    {showPan ? '🙈 Hide' : '👁 Reveal'}
                  </button>
                </div>
              ) : null}
              <input type="text" value={personal.pan} onChange={e => setPersonal({...personal, pan: e.target.value.toUpperCase()})} placeholder={hasExistingData ? 'Enter new PAN to update' : 'ABCDE1234F'} maxLength={10} className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono uppercase" />
              <p className="text-xs text-gray-400 mt-1">Format: ABCDE1234F. Stored encrypted at rest.</p>
            </div>
          </div>
        </div>

        {/* Business Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">🏢</span>
            Business Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input type="text" value={business.businessName} onChange={e => setBusiness({...business, businessName: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select value={business.businessType} onChange={e => setBusiness({...business, businessType: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                <option value="">Select type</option>
                {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input type="text" value={business.gstin} onChange={e => setBusiness({...business, gstin: e.target.value.toUpperCase()})} placeholder="22ABCDE1234F1Z5" maxLength={15} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Udyam Registration No.</label>
              <input type="text" value={business.udyamRegistrationNumber} onChange={e => setBusiness({...business, udyamRegistrationNumber: e.target.value})} placeholder="UDYAM-MH-00-0000000" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Incorporation</label>
              <input type="date" value={business.incorporationDate} onChange={e => setBusiness({...business, incorporationDate: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium">🔒 Data Security Notice</p>
          <p className="mt-1">Aadhar and PAN numbers are encrypted using AES-256-GCM before storage. A production deployment would comply with DPDP Act and UIDAI guidelines for handling Aadhar data.</p>
        </div>

        {/* Submit */}
        <button type="submit" disabled={saving || !personal.fullName} className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {saving ? <><LoadingSpinner size="sm" /> Saving...</> : 'Save Information'}
        </button>
      </form>
    </div>
  )
}
