'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const [user, setUser] = useState<UserInfo | null>(null)
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

  // Initial load: check localStorage immediately for instant rendering, then verify with API
  useEffect(() => {
    try {
      const cached = localStorage.getItem('screwless_user')
      if (cached) {
        setUser(JSON.parse(cached))
      }
    } catch {}
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

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚙</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Screwless</h1>
                <p className="text-xs text-gray-500 leading-tight -mt-0.5">Industrial Approvals Platform</p>
              </div>
            </a>

            {/* Nav links for applicants */}
            {user && user.role === 'applicant' && (
              <div className="hidden sm:flex items-center gap-1">
                <a
                  href="/dashboard"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/vault"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/vault') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  📁 Vault
                </a>
                <a
                  href="/inspections"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/inspections') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  🔍 Joint Inspections
                </a>
                <a
                  href="/grievances"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  ⚖️ Grievances
                </a>
                <a
                  href="/analytics"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  📊 SLA Analytics
                </a>
              </div>
            )}

            {/* Nav links for officers */}
            {user && user.role === 'officer' && (
              <div className="hidden sm:flex items-center gap-1">
                <a
                  href="/officer"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/officer') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Queue
                </a>
                <a
                  href="/officer/inspections"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/officer/inspections') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  🔍 CIS Inspections
                </a>
                <a
                  href="/grievances"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  ⚖️ Grievances
                </a>
                <a
                  href="/analytics"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  📊 SLA Analytics
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowPopup(!showPopup)}
                    className="text-right cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      {user.name || user.email || user.phone}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'officer' 
                        ? `Officer • ${formatDepartment(user.officerDepartment)}`
                        : 'Applicant ▾'
                      }
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
                  <span className="text-xl font-bold">{mobileMenuOpen ? '✕' : '☰'}</span>
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </a>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown for small/narrow screens */}
        {mobileMenuOpen && user && (
          <div className="sm:hidden border-t border-gray-200 py-3 space-y-1">
            {user.role === 'applicant' ? (
              <>
                <a
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/vault"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/vault') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📁 Vault
                </a>
                <a
                  href="/inspections"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/inspections') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🔍 Joint Inspections
                </a>
                <a
                  href="/grievances"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ⚖️ Grievances
                </a>
                <a
                  href="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📊 SLA Analytics
                </a>
              </>
            ) : (
              <>
                <a
                  href="/officer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/officer') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Queue
                </a>
                <a
                  href="/officer/inspections"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/officer/inspections') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🔍 CIS Inspections
                </a>
                <a
                  href="/grievances"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/grievances') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ⚖️ Grievances
                </a>
                <a
                  href="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base rounded-md font-medium transition-colors ${
                    isActive('/analytics') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📊 SLA Analytics
                </a>
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
