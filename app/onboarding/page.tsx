'use client'

import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    sector: '',
    scale: '',
    locationDistrict: '',
    inNotifiedIndustrialZone: false,
    riskCategory: '',
    stage: '',
  })

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isFormComplete = form.sector && form.scale && form.locationDistrict && form.riskCategory && form.stage

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormComplete) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save profile')

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
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
        <button
          type="submit"
          disabled={loading || !isFormComplete}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
        >
          {loading ? <LoadingSpinner size="sm" /> : null}
          {loading ? 'Saving...' : 'Continue to Dashboard →'}
        </button>
      </form>
    </div>
  )
}
