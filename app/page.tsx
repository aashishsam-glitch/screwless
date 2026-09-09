'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then(data => {
        if (data.user.role === 'officer') {
          router.push('/officer')
        } else if (data.hasProfile) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      })
      .catch(() => {
        // Not authenticated, stay on landing page
      })
  }, [router])

  return (
    <div className="min-h-[85vh] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto text-center px-4">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white text-4xl">⚙</span>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Screwless
          </h1>
          <p className="text-xl text-gray-600 mb-3 max-w-2xl mx-auto leading-relaxed">
            Streamline your industrial approvals, track compliance, and discover government support schemes — all in one platform.
          </p>
          <p className="text-base text-gray-500 mb-8">
            Built for MSMEs and industries in Maharashtra, India.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/login"
              className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-md hover:shadow-lg"
            >
              Get Started →
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📋</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Smart Checklist</h3>
            <p className="text-sm text-gray-600">
              Automatically identifies which government approvals your business needs based on sector, scale, and risk category.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🔄</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Live Status Tracking</h3>
            <p className="text-sm text-gray-600">
              Track your application status in real-time. See updates the moment an officer processes your application.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🏦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Scheme Matching</h3>
            <p className="text-sm text-gray-600">
              Discover government subsidy schemes you qualify for — capital investment, interest subsidy, duty exemptions, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
        SIH 2026 — Problem Statement SIH26130 • Efficiency in Streamlining Industrial Approvals
      </footer>
    </div>
  )
}
