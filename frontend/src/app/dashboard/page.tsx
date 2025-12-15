'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect based on role
    if (user?.is_superadmin) {
      router.push('/superadmin')
    } else {
      // Check memberships to determine if admin or athlete
      const memberships = (user as any)?.memberships || []
      const isAdmin = memberships.some((m: any) => m.role === 'admin')

      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/athlete')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}
