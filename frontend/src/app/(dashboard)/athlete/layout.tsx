'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isAthlete, setIsAthlete] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAthleteRole = async () => {
      if (!user) return

      // SuperAdmins should go to their dashboard
      if (user.is_superadmin) {
        router.push('/superadmin')
        return
      }

      try {
        const fullUser = await apiGet<any>('/users/me/full')
        const hasAdminRole = fullUser.memberships?.some(
          (m: any) => m.role === 'admin'
        )

        // If user is an admin, redirect to admin dashboard
        if (hasAdminRole) {
          router.push('/admin')
          return
        }

        // User is an athlete
        setIsAthlete(true)
      } catch (err) {
        console.error('Failed to check role:', err)
        setIsAthlete(true) // Default to athlete view on error
      }
    }

    if (!isLoading && user) {
      checkAthleteRole()
    }
  }, [user, isLoading, router])

  if (isLoading || isAthlete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
