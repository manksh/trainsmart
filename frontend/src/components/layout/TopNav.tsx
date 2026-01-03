'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'
import { useEffect, useState } from 'react'

interface UserMembership {
  organization_id: string
  organization_name: string
  role: string
}

interface FullUser {
  id: string
  email: string
  first_name: string
  last_name: string
  memberships: UserMembership[]
}

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Home',
    href: '/athlete',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Train',
    href: '/train',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [fullUser, setFullUser] = useState<FullUser | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      if (!user) return
      try {
        const userData = await apiGet<FullUser>('/users/me/full')
        setFullUser(userData)
      } catch (err) {
        console.error('Failed to load user:', err)
      }
    }
    loadUser()
  }, [user])

  const isActive = (href: string) => {
    if (href === '/athlete') {
      return pathname === '/athlete' || pathname === '/athlete/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/athlete')}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-sage-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">CTLST Labs</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-sage-50 text-sage-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {fullUser?.first_name}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[120px]">
                {fullUser?.memberships?.[0]?.organization_name}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
