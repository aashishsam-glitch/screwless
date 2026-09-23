'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import ProfilePopup from './ProfilePopup'

interface UserInfo {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  officerDepartment: string | null
}

export default function Navbar() {
  // Lazy initialize from localStorage to prevent flash on refresh
  const [user, setUser] = useState<UserInfo | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('screwless_user')
        return cached ? JSON.parse(cached) : null
      } catch {
        return null
      }
    }
    return null
  })
  const [showPopup, setShowPopup] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          setUser(data.user)
          try {
            localStorage.setItem('screwless_user', JSON.stringify(data.user))
          } catch {}
          return
        }
      }
      setUser(null)
      try {
        localStorage.removeItem('screwless_user')
      } catch {}
    } catch {
      // Network error, keep existing user if any
    }
  }, [])

  // Initial load: verify session with backend
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Re-check whenever route/pathname changes
  useEffect(() => {
    checkAuth()
    setMobileMenuOpen(false)
  }, [pathname, checkAuth])

  // Listen for login/logout events dispatched from any page
  useEffect(() => {
    const handleAuthChange = (event: any) => {
      if (event?.detail) {
        setUser(event.detail)
      } else {
        checkAuth()
      }
    }
    window.addEventListener('auth-change', handleAuthChange)
    window.addEventListener('storage', checkAuth)
    return () => {
      window.removeEventListener('auth-change', handleAuthChange)
      window.removeEventListener('storage', checkAuth)
    }
  }, [checkAuth])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    try {
      localStorage.removeItem('screwless_user')
      window.dispatchEvent(new CustomEvent('auth-change', { detail: null }))
    } catch {}
    setUser(null)
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  // Requirement 1: Hide applicant dashboard navbar when not logged in or on /login
  if (!user || pathname === '/login') {
    return null
  }

  // Screwless logo navigation goes DIRECTLY to /dashboard for applicant with completed profile
  const logoHref = user.role === 'officer' ? '/officer' : pathname === '/onboarding' ? '/onboarding' : '/dashboard'

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            {/* Logo links directly to /dashboard, /onboarding, or /officer via client-side routing */}
            <Link href={logoHref} className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors shadow-sm">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Screwless</h1>
                <p className="text-xs text-gray-500 leading-tight -mt-0.5">Industrial Approvals Platform</p>
              </div>
            </Link>

            {/* Nav links for applicants (hidden during onboarding) */}
            {user.role === 'applicant' && pathname !== '/onboarding' && (
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/vault"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/vault') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Vault
                </Link>
                <Link
                  href="/inspections"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/inspections') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Joint Inspections
                </Link>
                <Link
                  href="/grievances"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Grievances
                </Link>
                <Link
                  href="/analytics"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  SLA Analytics
                </Link>
              </div>
            )}

            {/* Nav links for officers */}
            {user.role === 'officer' && (
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/officer"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/officer') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Queue
                </Link>
                <Link
                  href="/officer/inspections"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/officer/inspections') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  CIS Inspections
                </Link>
                <Link
                  href="/grievances"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Grievances
                </Link>
                <Link
                  href="/analytics"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  SLA Analytics
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowPopup(!showPopup)}
                className="text-right cursor-pointer hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium text-gray-700">
                  {user.name || user.email || user.phone}
                </p>
                <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  {user.role === 'officer' ? (
                    `Officer | ${formatDepartment(user.officerDepartment)}`
                  ) : (
                    <>
                      <span>Applicant</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </p>
              </button>
              {showPopup && user.role === 'applicant' && (
                <ProfilePopup
                  userId={user.id}
                  userName={user.name}
                  userEmail={user.email}
                  userPhone={user.phone}
                  onClose={() => setShowPopup(false)}
                />
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown for small/narrow screens */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 py-3 space-y-1">
            {user.role === 'applicant' && pathname !== '/onboarding' ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/vault"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/vault') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Vault
                </Link>
                <Link
                  href="/inspections"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/inspections') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Joint Inspections
                </Link>
                <Link
                  href="/grievances"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grievances
                </Link>
                <Link
                  href="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  SLA Analytics
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/officer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/officer') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Queue
                </Link>
                <Link
                  href="/officer/inspections"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/officer/inspections') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  CIS Inspections
                </Link>
                <Link
                  href="/grievances"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grievances
                </Link>
                <Link
                  href="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  SLA Analytics
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function formatDepartment(dept: string | null): string {
  if (!dept) return 'General'
  const map: Record<string, string> = {
    fire_dept: 'Fire Department',
    mpcb: 'MPCB (Pollution)',
    dish: 'DISH (Factory)',
    municipal_corp: 'Municipal Corp',
    labour_dept: 'Labour Dept',
    midc: 'MIDC',
    msedcl: 'MSEDCL (Electricity)',
    water_resources: 'Water Resources',
    tax_dept: 'Tax Department',
  }
  return map[dept] || dept
}
