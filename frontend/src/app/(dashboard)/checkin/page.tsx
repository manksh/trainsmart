'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface CheckInTypeCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
}

const CHECK_IN_TYPES: CheckInTypeCard[] = [
  {
    id: 'mood',
    title: 'Mood Check-In',
    description: 'How are you feeling right now? Build emotional awareness.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    route: '/checkin/mood',
  },
  {
    id: 'confidence',
    title: 'Confidence Check-In',
    description: 'Rate your confidence and identify what builds or blocks it.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    route: '/checkin/confidence',
  },
  {
    id: 'energy',
    title: 'Energy Check-In',
    description: 'Track your physical and mental energy levels.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    route: '/checkin/energy',
  },
]

export default function CheckInSelectionPage() {
  const router = useRouter()
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/athlete')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            What would you like to do?
          </h1>
          <p className="text-gray-600">
            Choose a check-in that fits your needs right now
          </p>
        </div>

        {/* Check-in type cards */}
        <div className="space-y-4">
          {CHECK_IN_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => router.push(type.route)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`${type.bgColor} ${type.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {type.title}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {type.description}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Regular check-ins help you build self-awareness
          </p>
        </div>
      </div>
    </div>
  )
}
