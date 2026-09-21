'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

const SECTORS = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'food_processing', label: 'Food Processing' },
  { value: 'textiles', label: 'Textiles' },
  { value: 'pharma', label: 'Pharmaceutical' },
  { value: 'other', label: 'Other' },
]

const SCALES = [
  { value: 'micro', label: 'Micro', desc: 'Investment up to ₹1 crore' },
  { value: 'small', label: 'Small', desc: 'Investment up to ₹10 crore' },
  { value: 'medium', label: 'Medium', desc: 'Investment up to ₹50 crore' },
  { value: 'large', label: 'Large', desc: 'Investment above ₹50 crore' },
]

const DISTRICTS = [
  'Pune', 'Mumbai', 'Thane', 'Nagpur', 'Nashik',
  'Chhatrapati Sambhajinagar', 'Kolhapur', 'Solapur', 'Ratnagiri',
  'Amravati', 'Sangli', 'Satara', 'Nanded', 'Raigad', 'Chandrapur',
]

const RISK_CATEGORIES = [
  { value: 'green', label: 'Green', desc: 'Non-polluting (e.g., garments, electronics assembly)', color: 'text-green-700' },
  { value: 'white', label: 'White', desc: 'Least polluting (e.g., flour mills, cotton ginning)', color: 'text-gray-600' },
  { value: 'orange', label: 'Orange', desc: 'Moderately polluting (e.g., food processing, auto parts)', color: 'text-orange-600' },
  { value: 'red', label: 'Red', desc: 'Heavily polluting (e.g., chemicals, refineries, distilleries)', color: 'text-red-600' },
]

const STAGES = [
  { value: 'new_unit', label: 'New Unit — Setting up a new industrial unit' },
  { value: 'expansion', label: 'Expansion — Expanding an existing unit' },
  { value: 'operational', label: 'Operational — Already operating, need renewals/compliance' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    sector: '',
    scale: '',
    locationDistrict: '',
    inNotifiedIndustrialZone: false,
    riskCategory: '',
    stage: '',
  })

  // Load existing profile if available and verify auth (handles TEST 4: refresh page loads saved values)
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        setPageLoading(true)
        // 1. Verify authentication
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          router.push('/login')
          return
        }

        const authContentType = authRes.headers.get('content-type') || ''
        if (!authContentType.includes('application/json')) {
          router.push('/login')
          return
        }

        const authData = await authRes.json()
        if (authData?.user?.role === 'officer') {
          router.push('/officer')
          return
        }

        // 2. Load existing profile data if user already has one
        const profileRes = await fetch('/api/profile')
        const profileContentType = profileRes.headers.get('content-type') || ''

        if (profileRes.ok && profileContentType.includes('application/json')) {
          const profileData = await profileRes.json()
          if (profileData?.profile && isMounted) {
            const p = profileData.profile
            setForm({
              name: p.name || authData?.user?.name || '',
              sector: p.sector || '',
              scale: p.scale || '',
              locationDistrict: p.locationDistrict || '',
              inNotifiedIndustrialZone: Boolean(p.inNotifiedIndustrialZone),
              riskCategory: p.riskCategory || '',
              stage: p.stage || '',
            })
          }
        }
      } catch (err) {
        console.error('Failed to load profile initialization data:', err)
      } finally {
        if (isMounted) setPageLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [router])

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isFormComplete = form.sector && form.scale && form.locationDistrict && form.riskCategory && form.stage

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormComplete) return
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      // Robust response handling: verify Content-Type before parsing JSON
      const contentType = res.headers.get('content-type') || ''
      let data: any = null

      if (contentType.includes('application/json')) {
        try {
          data = await res.json()
        } catch (parseErr) {
          console.error('Failed to parse JSON response from /api/profile:', parseErr)
          throw new Error('Unable to save your profile. Please try again.')
        }
      } else {
        const rawText = await res.text().catch(() => '')
        console.error('Non-JSON response received from /api/profile:', res.status, rawText.slice(0, 300))
        throw new Error('Unable to save your profile. Please try again.')
      }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Unable to save your profile. Please check the entered data.')
      }

      setSuccess('Profile saved successfully! Redirecting...')

      // Sync user session in localStorage & notify Navbar
      try {
        if (data?.profile?.name) {
          const cached = localStorage.getItem('screwless_user')
          if (cached) {
            const parsed = JSON.parse(cached)
            parsed.name = data.profile.name
            localStorage.setItem('screwless_user', JSON.stringify(parsed))
            window.dispatchEvent(new CustomEvent('auth-change', { detail: parsed }))
          }
        }
      } catch {}

      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err: any) {
      setError(err.message || 'Unable to save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="text-gray-600 mt-2">
          Tell us about your business so we can identify which approvals you need
          and which government schemes you may qualify for.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-3 shadow-xs">
          <span className="text-xl leading-none">⚠️</span>
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center gap-3 shadow-xs">
          <span className="text-xl leading-none">✓</span>
          <div className="text-sm font-medium">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Business Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Business / Enterprise Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Shree Industries Pvt. Ltd."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Sector */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
              Industry Sector <span className="text-red-500">*</span>
            </label>
            <select
              id="sector"
              value={form.sector}
              onChange={(e) => updateField('sector', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select your industry sector</option>
              {SECTORS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Scale */}
          <div>
            <label htmlFor="scale" className="block text-sm font-medium text-gray-700 mb-1">
              Enterprise Scale <span className="text-red-500">*</span>
            </label>
            <select
              id="scale"
              value={form.scale}
              onChange={(e) => updateField('scale', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select enterprise scale</option>
              {SCALES.map(s => (
                <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <select
              id="district"
              value={form.locationDistrict}
              onChange={(e) => updateField('locationDistrict', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select district</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Industrial Zone Toggle */}
          <div className="flex items-start gap-3">
            <div className="flex items-center h-6 mt-0.5">
              <input
                id="zone"
                type="checkbox"
                checked={form.inNotifiedIndustrialZone}
                onChange={(e) => updateField('inNotifiedIndustrialZone', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="zone" className="text-sm font-medium text-gray-700">
                Located in a Notified Industrial Zone (MIDC/Industrial Area)
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Check this if your unit is in an MIDC area or government-notified industrial zone
              </p>
            </div>
          </div>

          {/* Risk Category */}
          <div>
            <label htmlFor="risk" className="block text-sm font-medium text-gray-700 mb-1">
              Pollution Risk Category <span className="text-red-500">*</span>
            </label>
            <select
              id="risk"
              value={form.riskCategory}
              onChange={(e) => updateField('riskCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select risk category</option>
              {RISK_CATEGORIES.map(r => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              As classified by the Central Pollution Control Board (CPCB). Check your industry category on the MPCB website.
            </p>
          </div>

          {/* Stage */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
              Business Stage <span className="text-red-500">*</span>
            </label>
            <select
              id="stage"
              value={form.stage}
              onChange={(e) => updateField('stage', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select business stage</option>
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading || !isFormComplete}
            className="w-full py-3.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-sm hover:shadow-md"
          >
            {loading ? <LoadingSpinner size="sm" /> : null}
            {loading ? 'Saving Profile...' : 'Continue to Dashboard →'}
          </button>
          {!isFormComplete && (
            <p className="text-center text-xs text-gray-500">
              Please complete all mandatory fields marked with an asterisk (<span className="text-red-500 font-semibold">*</span>) to proceed.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
