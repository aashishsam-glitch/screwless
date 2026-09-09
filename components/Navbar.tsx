'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚙</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Screwless</h1>
                <p className="text-xs text-gray-500 leading-tight -mt-0.5">Industrial Approvals Platform</p>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {user.name || user.email || user.phone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'officer' 
                      ? `Officer • ${formatDepartment(user.officerDepartment)}`
                      : 'Applicant'
                    }
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Logout
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
