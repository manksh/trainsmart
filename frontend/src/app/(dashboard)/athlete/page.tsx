'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface UserMembership {
  organization_id: string
  organization_name: string
  role: string
  joined_at: string
}

interface FullUser {
  id: string
  email: string
  first_name: string
  last_name: string
  is_superadmin: boolean
  memberships: UserMembership[]
}

export default function AthleteDashboard() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        const userData = await apiGet<FullUser>('/users/me/full')
        setFullUser(userData)

        // TODO: Check if user has completed assessment
        // const assessmentStatus = await apiGet('/assessments/me/status')
        // setHasCompletedAssessment(assessmentStatus.completed)
      } catch (err) {
        console.error('Failed to load user data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (!isLoading && user) {
      loadUserData()
    }
  }, [user, isLoading])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const athleteMemberships = fullUser?.memberships?.filter(m => m.role === 'athlete') || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {fullUser?.first_name}!
            </h1>
            <p className="text-sm text-gray-500">Athlete Dashboard</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Organization Info */}
        {athleteMemberships.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Organizations</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {athleteMemberships.map((membership) => (
                <div
                  key={membership.organization_id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <h3 className="font-semibold text-gray-900">
                    {membership.organization_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Joined {new Date(membership.joined_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment CTA */}
        {!hasCompletedAssessment ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Your Mental Performance Assessment
              </h2>
              <p className="text-gray-600 mb-6">
                Take a 10-minute assessment to discover your mental performance strengths
                and areas for growth. Your personalized training pathway awaits!
              </p>
              <Button
                onClick={() => router.push('/assessment')}
                className="px-8"
              >
                Start Assessment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Summary Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Mental Performance Profile
              </h2>
              <p className="text-gray-600">
                Assessment completed! Your personalized training pathway is ready.
              </p>
              <div className="mt-4 flex gap-4">
                <Button onClick={() => router.push('/results')}>
                  View Results
                </Button>
                <Button variant="outline" onClick={() => router.push('/pathway')}>
                  Start Training
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">0 days</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">0 XP</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Current Tier</p>
                <p className="text-2xl font-bold text-gray-900">1 / 10</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
