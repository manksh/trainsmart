'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return

      try {
        const fullUser = await apiGet<any>('/users/me/full')
        const hasAdminRole = fullUser.memberships?.some(
          (m: any) => m.role === 'admin'
        )
        setIsAdmin(hasAdminRole)

        if (!hasAdminRole) {
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Failed to check admin role:', err)
        router.push('/dashboard')
      }
    }

    if (!isLoading && user) {
      checkAdminRole()
    }
  }, [user, isLoading, router])

  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
