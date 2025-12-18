'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'

interface Activity {
  id: string
  name: string
  description: string
  estimated_minutes: number
  screens: unknown[]
}

interface ModuleContent {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  estimated_minutes: number
  content: {
    flow_type?: 'sequential_activities' | 'sections'
    sections?: Array<{
      id: string
      type: string
      title: string
    }>
    activities?: Activity[]
  }
  is_premium: boolean
  requires_assessment: boolean
}

interface ModuleProgress {
  id: string
  user_id: string
  module_id: string
  module_slug: string
  progress_data: {
    // Sections-based (Being Human)
    cards_viewed?: string[]
    sections_completed?: string[]
    examples_viewed?: string[]
    // Sequential activities (About Performance)
    current_activity?: string
    current_screen?: number
    activities_completed?: string[]
    screen_responses?: Record<string, unknown>
  }
  current_section: string | null
  is_started: boolean
  is_completed: boolean
  activity_responses: Record<string, unknown>
  total_time_seconds: number
  progress_percentage?: number
}

interface Membership {
  organization_id: string
}

interface FullUser {
  memberships: Membership[]
}

// Icon components
const icons: Record<string, React.ReactNode> = {
  brain: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  book: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  target: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

const sectionIcons: Record<string, React.ReactNode> = {
  card_deck: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  grid_selection: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  example_screens: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  personal_selection: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  activity_sequence: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
}

const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
  emerald: {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  purple: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
}

export default function ModuleOverviewPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [module, setModule] = useState<ModuleContent | null>(null)
  const [progress, setProgress] = useState<ModuleProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch module, progress, and user data in parallel
        const [moduleData, progressData, fullUser] = await Promise.all([
          apiGet<ModuleContent>(`/training-modules/${slug}`),
          apiGet<ModuleProgress | null>(`/training-modules/progress/me/${slug}`).catch(() => null),
          apiGet<FullUser>('/users/me/full'),
        ])
        setModule(moduleData)
        setProgress(progressData)

        // Get organization_id from user's membership
        if (fullUser.memberships && fullUser.memberships.length > 0) {
          setOrgId(fullUser.memberships[0].organization_id)
        }
      } catch (err) {
        console.error('Failed to load module:', err)
        setError('Failed to load module')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [slug])

  const handleStart = async () => {
    if (!module) {
      setError('Module not loaded')
      return
    }
    if (!orgId) {
      setError('No organization found. Please contact support.')
      return
    }

    setIsStarting(true)
    setError(null)
    try {
      const newProgress = await apiPost<ModuleProgress>('/training-modules/progress/start', {
        organization_id: orgId,
        module_slug: slug,
      })
      setProgress(newProgress)

      // Navigate based on flow type
      if (module.content.flow_type === 'sequential_activities') {
        const firstActivity = module.content.activities?.[0]
        if (firstActivity) {
          router.push(`/train/${slug}/activity/${firstActivity.id}`)
        } else {
          router.push(`/train/${slug}`)
        }
      } else {
        // Default sections-based flow
        router.push(`/train/${slug}/learn`)
      }
    } catch (err) {
      console.error('Failed to start module:', err)
      setError('Failed to start module. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleContinue = () => {
    // Check for sequential activities flow
    if (module?.content.flow_type === 'sequential_activities') {
      const activities = module.content.activities || []
      const completedActivities = progress?.progress_data?.activities_completed || []
      const currentActivityId = progress?.progress_data?.current_activity

      // Find the next incomplete activity or resume current
      if (currentActivityId) {
        // Resume current activity if not completed
        if (!completedActivities.includes(currentActivityId)) {
          router.push(`/train/${slug}/activity/${currentActivityId}`)
          return
        }
      }

      // Find next incomplete activity
      const nextActivity = activities.find((a) => !completedActivities.includes(a.id))
      if (nextActivity) {
        router.push(`/train/${slug}/activity/${nextActivity.id}`)
      } else {
        // All activities completed - show first activity for review
        router.push(`/train/${slug}/activity/${activities[0]?.id}`)
      }
      return
    }

    // Sections-based flow (Being Human)
    if (!progress?.current_section) {
      router.push(`/train/${slug}/learn`)
      return
    }

    const sectionRoutes: Record<string, string> = {
      intro_cards: `/train/${slug}/learn`,
      chain_types: `/train/${slug}/examples`,
      examples: `/train/${slug}/examples`,
      personal_bridge: `/train/${slug}/examples`,
      activities: `/train/${slug}/activities`,
    }

    const route = sectionRoutes[progress.current_section] || `/train/${slug}/learn`
    router.push(route)
  }

  const getSectionStatus = (sectionId: string): 'locked' | 'available' | 'completed' => {
    if (!progress) return 'available' // First section always available

    // If module is completed, all sections are completed
    if (progress.is_completed) return 'completed'

    const completedSections = progress.progress_data?.sections_completed || []
    if (completedSections.includes(sectionId)) return 'completed'

    // Check if previous sections are completed
    const sections = module?.content.sections || []
    const sectionIndex = sections.findIndex(s => s.id === sectionId)

    if (sectionIndex === 0) return 'available'

    const prevSection = sections[sectionIndex - 1]
    if (prevSection && !completedSections.includes(prevSection.id)) {
      return 'locked'
    }

    return 'available'
  }

  const getActivityStatus = (activityId: string, index: number): 'locked' | 'available' | 'completed' | 'in_progress' => {
    if (!progress) return index === 0 ? 'available' : 'locked'

    if (progress.is_completed) return 'completed'

    const completedActivities = progress.progress_data?.activities_completed || []
    const currentActivity = progress.progress_data?.current_activity

    if (completedActivities.includes(activityId)) return 'completed'
    if (currentActivity === activityId) return 'in_progress'

    // Check if previous activity is completed
    const activities = module?.content.activities || []
    if (index === 0) return 'available'

    const prevActivity = activities[index - 1]
    if (prevActivity && completedActivities.includes(prevActivity.id)) {
      return 'available'
    }

    return 'locked'
  }

  const calculateProgress = (): number => {
    if (!progress || !module) return 0
    if (progress.is_completed) return 100

    // Use progress_percentage from API if available (matches backend calculation)
    if (progress.progress_percentage !== undefined) {
      return progress.progress_percentage
    }

    // Fallback calculation based on flow type
    if (module.content.flow_type === 'sequential_activities') {
      const activities = module.content.activities || []
      if (activities.length === 0) return 0
      const completedActivities = (progress.progress_data?.activities_completed || []).length
      return Math.round((completedActivities / activities.length) * 100)
    }

    // Sections-based calculation
    const totalSections = module.content.sections?.length || 0
    if (totalSections === 0) return 0
    const completedSections = (progress.progress_data?.sections_completed || []).length

    return Math.round((completedSections / totalSections) * 100)
  }

  const handleStartActivity = (activityId: string) => {
    router.push(`/train/${slug}/activity/${activityId}`)
  }

  // Determine if this is a sequential activities module
  const isSequentialModule = module?.content.flow_type === 'sequential_activities'
  const activities = module?.content.activities || []
  const sections = module?.content.sections || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded-xl mt-6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Module not found</h1>
            <p className="text-gray-500 mb-4">{error || "The module you're looking for doesn't exist."}</p>
            <button
              onClick={() => router.push('/train')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Back to Training
            </button>
          </div>
        </div>
      </div>
    )
  }

  const colors = colorClasses[module.color] || colorClasses.emerald
  const progressPercent = calculateProgress()

  return (
    <div className={`min-h-screen bg-gradient-to-b from-${module.color}-50 to-white`}>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/train')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Module Header Card */}
        <div className={`${colors.bgLight} ${colors.border} border rounded-2xl p-6 mb-6`}>
          <div className="flex items-start gap-4">
            <div className={`${colors.bg} text-white p-3 rounded-xl`}>
              {icons[module.icon] || icons.book}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{module.name}</h1>
              <p className="text-gray-600 mb-4">{module.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {module.estimated_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isSequentialModule
                    ? `${activities.length} activities`
                    : `${sections.length} sections`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {progress?.is_started && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className={`font-medium ${colors.text}`}>{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bg} transition-all duration-300`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content List - Activities or Sections based on flow type */}
        <div className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isSequentialModule ? 'Activities' : "What you'll learn"}
          </h2>

          {isSequentialModule ? (
            // Sequential Activities List (About Performance)
            activities.map((activity, index) => {
              const status = getActivityStatus(activity.id, index)
              const isLocked = status === 'locked'
              const isCompleted = status === 'completed'
              const isInProgress = status === 'in_progress'

              return (
                <button
                  key={activity.id}
                  onClick={() => !isLocked && handleStartActivity(activity.id)}
                  disabled={isLocked}
                  className={`w-full text-left bg-white rounded-xl border p-4 transition-all ${
                    isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'
                  } ${isCompleted || isInProgress ? colors.border : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`${
                        isCompleted ? colors.bg : isInProgress ? colors.bgLight : 'bg-gray-100'
                      } ${isCompleted ? 'text-white' : isInProgress ? colors.text : 'text-gray-400'} p-2 rounded-lg`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isInProgress ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs ${colors.text} font-medium`}>{index + 1}</span>
                        <h3 className="font-medium text-gray-900">{activity.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.estimated_minutes} min</p>
                    </div>
                    {isLocked ? (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })
          ) : (
            // Sections List (Being Human)
            sections.map((section, index) => {
              const status = getSectionStatus(section.id)
              const isLocked = status === 'locked'
              const isCompleted = status === 'completed'

              return (
                <div
                  key={section.id}
                  className={`bg-white rounded-xl border p-4 ${
                    isLocked ? 'opacity-60' : ''
                  } ${colors.border}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${isCompleted ? colors.bg : colors.bgLight} ${isCompleted ? 'text-white' : colors.text} p-2 rounded-lg`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        sectionIcons[section.type] || sectionIcons.card_deck
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${colors.text} font-medium`}>
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                      </div>
                    </div>
                    {isLocked && (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CTA Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-2xl mx-auto">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {progress?.is_completed ? (
              <button
                onClick={handleContinue}
                className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
              >
                Review Module
              </button>
            ) : progress?.is_started ? (
              <button
                onClick={handleContinue}
                className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={isStarting}
                className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {isStarting ? 'Starting...' : 'Start Module'}
              </button>
            )}
          </div>
        </div>

        {/* Spacer for fixed button */}
        <div className="h-24" />
      </div>
    </div>
  )
}
