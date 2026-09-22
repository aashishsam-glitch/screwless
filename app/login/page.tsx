'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LoginPage() {
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()

  // Requirement 4: Check if already authenticated before showing login
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          if (data.user.role === 'officer') {
            router.replace('/officer')
          } else if (!data.hasProfile) {
            router.replace('/onboarding')
          } else {
            router.replace('/dashboard')
          }
        } else {
          setCheckingAuth(false)
        }
      })
      .catch(() => {
        setCheckingAuth(false)
      })
  }, [router])

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : null

      if (!res.ok) {
        if (data?.cooldownSeconds) {
          setResendCooldown(data.cooldownSeconds)
        }
        throw new Error(data?.error || `Failed to send OTP (Status ${res.status})`)
      }

      setStep('otp')
      setOtpSent(true)
      setResendCooldown(30)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          code: otp.trim(),
          name: name.trim() || undefined,
        }),
      })

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : null

      if (!res.ok) {
        throw new Error(data?.error || `Verification failed (Status ${res.status})`)
      }

      // Save user session for instant Navbar hydration
      try {
        const userToStore = { ...data.user, hasProfile: !!data.hasProfile }
        localStorage.setItem('screwless_user', JSON.stringify(userToStore))
        window.dispatchEvent(new CustomEvent('auth-change', { detail: userToStore }))
      } catch {}

      // Routing logic:
      // Officers -> /officer
      // New applicants without completed profile -> /onboarding
      // Returning applicants who completed onboarding -> /dashboard
      if (data.user.role === 'officer') {
        router.push('/officer')
      } else if (!data.hasProfile) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    setOtp('')
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : null

      if (!res.ok) {
        if (data?.cooldownSeconds) {
          setResendCooldown(data.cooldownSeconds)
        }
        throw new Error(data?.error || 'Failed to resend OTP')
      }

      setSuccess('New OTP generated! Check server terminal console.')
      setResendCooldown(30)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚙</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Screwless</h2>
            <p className="text-gray-500 mt-1">Sign in to manage your industrial approvals</p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'identifier' ? (
            /* Step 1: Enter email or phone */
            <form onSubmit={handleSendOTP}>
              <div className="mb-4">
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone Number
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  required
                  autoFocus
                />
              </div>

              {/* Demo quick-select chips */}
              <div className="mb-5">
                <p className="text-xs text-gray-500 font-medium mb-2">⚡ Quick-fill demo account:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIdentifier('applicant@demo.com')}
                    className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    🏢 Demo Applicant
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('officer.pollution@demo.gov.in')}
                    className="text-xs px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    🛡️ MPCB
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('officer.factory@demo.gov.in')}
                    className="text-xs px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    🏭 DISH
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifier('officer.fire@demo.gov.in')}
                    className="text-xs px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    🚒 Fire
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </form>
          ) : (
            /* Step 2: Enter OTP */
            <form onSubmit={handleVerifyOTP}>
              {/* OTP sent notice */}
              {otpSent && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  📱 OTP sent to <strong>{identifier}</strong>
                  <br />
                  <span className="text-blue-600 font-medium">Check your server console/terminal for the OTP code.</span>
                </div>
              )}

              <div className="mb-5">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-Digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <div className="mt-4 flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); setOtp(''); setError(''); setSuccess('') }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Change email/phone
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || resendCooldown > 0}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-gray-400 mt-4">
          For demo: use any email/phone. OTP appears in the server terminal.
        </p>
      </div>
    </div>
  )
}
