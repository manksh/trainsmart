'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPatch } from '@/lib/api'

interface Activity {
  id: string
  name: string
  description: string
  type: string
  estimated_minutes: number
  icon: string
  prompt?: string
  placeholder?: string
  prompts?: Record<string, string>
  instruction?: string
  steps?: string[]
  challenge?: string
}

interface ModuleContent {
  id: string
  slug: string
  name: string
  color: string
  content: {
    sections: Array<{
      id: string
      type: string
      title: string
      description?: string
      activities?: Activity[]
    }>
  }
}

interface ModuleProgress {
  id: string
  progress_data: {
    sections_completed?: string[]
  }
  activity_responses: Record<string, unknown>
  is_completed: boolean
}

const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string; gradient: string }> = {
  emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-50' },
  purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-50' },
  blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-50' },
}

const activityIcons: Record<string, React.ReactNode> = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  'git-branch': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  'refresh-cw': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  sun: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  zap: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

export default function ActivitiesPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [module, setModule] = useState<ModuleContent | null>(null)
  const [progress, setProgress] = useState<ModuleProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null)
  const [activityInput, setActivityInput] = useState('')
  const [chainInputs, setChainInputs] = useState<Record<string, string>>({})
  const [reflectionStep, setReflectionStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadModule = async () => {
      try {
        const [moduleData, progressData] = await Promise.all([
          apiGet<ModuleContent>(`/training-modules/${slug}`),
          apiGet<ModuleProgress | null>(`/training-modules/progress/me/${slug}`).catch(() => null),
        ])
        setModule(moduleData)
        setProgress(progressData)
      } catch (err) {
        console.error('Failed to load module:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadModule()
  }, [slug])

  const activitiesSection = module?.content.sections.find(s => s.type === 'activity_sequence')
  const activities = activitiesSection?.activities || []

  const isActivityCompleted = (activityId: string): boolean => {
    return !!progress?.activity_responses?.[activityId]
  }

  const completedCount = activities.filter(a => isActivityCompleted(a.id)).length

  const handleStartActivity = (activity: Activity) => {
    setActiveActivity(activity)
    setActivityInput('')
    setChainInputs({})
    setReflectionStep(0)
  }

  const handleSaveActivity = async () => {
    if (!progress?.id || !activeActivity) return

    setIsSaving(true)
    try {
      let response: Record<string, unknown> = {}

      if (activeActivity.type === 'single_input') {
        response = { text: activityInput, completed_at: new Date().toISOString() }
      } else if (activeActivity.type === 'chain_builder' || activeActivity.type === 'chain_modifier') {
        response = { chain: chainInputs, completed_at: new Date().toISOString() }
      } else if (activeActivity.type === 'guided_reflection') {
        response = { completed: true, completed_at: new Date().toISOString() }
      } else if (activeActivity.type === 'daily_challenge') {
        response = { accepted: true, completed_at: new Date().toISOString() }
      }

      await apiPatch(`/training-modules/progress/${progress.id}`, {
        activity_response: { [activeActivity.id]: response },
      })

      // Update local state
      setProgress(prev => prev ? {
        ...prev,
        activity_responses: {
          ...prev.activity_responses,
          [activeActivity.id]: response,
        },
      } : null)

      setActiveActivity(null)
    } catch (err) {
      console.error('Failed to save activity:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompleteModule = async () => {
    if (!progress?.id) return

    try {
      // Mark activities section as completed first
      await apiPatch(`/training-modules/progress/${progress.id}`, {
        sections_completed: ['activities'],
      })

      // Then mark module as complete
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/training-modules/progress/${progress.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      router.push(`/train/${slug}`)
    } catch (err) {
      console.error('Failed to complete module:', err)
    }
  }

  const handleBack = () => {
    if (activeActivity) {
      setActiveActivity(null)
    } else {
      router.push(`/train/${slug}/examples`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!module) return null

  const colors = colorClasses[module.color] || colorClasses.emerald

  // Activity detail view
  if (activeActivity) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${colors.gradient} to-white`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBack} className="p-2 hover:bg-white/50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-500">{activeActivity.estimated_minutes} min</span>
            <div className="w-9" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{activeActivity.name}</h1>
          <p className="text-gray-600 mb-8">{activeActivity.description}</p>

          {/* Single input activity */}
          {activeActivity.type === 'single_input' && (
            <div className="space-y-4">
              <p className="text-gray-700">{activeActivity.prompt}</p>
              <textarea
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                placeholder={activeActivity.placeholder}
                className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleSaveActivity}
                disabled={!activityInput.trim() || isSaving}
                className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          )}

          {/* Chain builder activity */}
          {(activeActivity.type === 'chain_builder' || activeActivity.type === 'chain_modifier') && (
            <div className="space-y-4">
              {activeActivity.instruction && (
                <p className="text-gray-700 mb-4">{activeActivity.instruction}</p>
              )}
              {activeActivity.prompts && Object.entries(activeActivity.prompts).map(([key, prompt]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{prompt}</label>
                  <textarea
                    value={chainInputs[key] || ''}
                    onChange={(e) => setChainInputs(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full h-24 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              ))}
              <button
                onClick={handleSaveActivity}
                disabled={Object.keys(chainInputs).length === 0 || isSaving}
                className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          )}

          {/* Guided reflection activity */}
          {activeActivity.type === 'guided_reflection' && activeActivity.steps && (
            <div className="space-y-6">
              {activeActivity.steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl transition-all ${
                    index <= reflectionStep
                      ? `${colors.bgLight} ${colors.border} border`
                      : 'bg-gray-50 border border-gray-200 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${index <= reflectionStep ? colors.bg : 'bg-gray-300'} text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                      {index < reflectionStep ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                </div>
              ))}
              {reflectionStep < activeActivity.steps.length ? (
                <button
                  onClick={() => setReflectionStep(prev => prev + 1)}
                  className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
                >
                  {reflectionStep === 0 ? 'Begin' : 'Next Step'}
                </button>
              ) : (
                <button
                  onClick={handleSaveActivity}
                  disabled={isSaving}
                  className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
                >
                  {isSaving ? 'Saving...' : 'Complete Activity'}
                </button>
              )}
            </div>
          )}

          {/* Daily challenge activity */}
          {activeActivity.type === 'daily_challenge' && (
            <div className="space-y-6">
              <div className={`${colors.bgLight} ${colors.border} border rounded-xl p-6`}>
                <div className={`${colors.bg} text-white p-3 rounded-xl w-fit mb-4`}>
                  {activityIcons.zap}
                </div>
                <p className="text-gray-700 leading-relaxed">{activeActivity.challenge}</p>
              </div>
              <button
                onClick={handleSaveActivity}
                disabled={isSaving}
                className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
              >
                {isSaving ? 'Saving...' : 'I Accept the Challenge'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Activities list view
  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient} to-white`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={handleBack} className="p-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{activitiesSection?.title}</h1>
        <p className="text-gray-600 mb-2">{activitiesSection?.description}</p>
        <p className="text-sm text-gray-400 mb-8">
          {completedCount} of {activities.length} completed
        </p>

        {/* Activities list */}
        <div className="space-y-3 mb-8">
          {activities.map((activity, index) => {
            const isCompleted = isActivityCompleted(activity.id)

            return (
              <button
                key={activity.id}
                onClick={() => handleStartActivity(activity)}
                className={`w-full text-left bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
                  isCompleted ? `${colors.border} border-2` : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${isCompleted ? colors.bg : colors.bgLight} ${isCompleted ? 'text-white' : colors.text} p-2 rounded-lg`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      activityIcons[activity.icon] || activityIcons.zap
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
                  <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>

        {/* Complete module button */}
        <div className="space-y-3">
          {completedCount > 0 && (
            <button
              onClick={handleCompleteModule}
              className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
            >
              {completedCount === activities.length ? 'Complete Module' : 'Finish For Now'}
            </button>
          )}

          {/* Skip option */}
          {completedCount === 0 && (
            <button
              onClick={() => router.push(`/train/${slug}`)}
              className="w-full text-gray-500 font-medium py-3 px-6 hover:text-gray-700 transition-colors"
            >
              Skip activities for now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
