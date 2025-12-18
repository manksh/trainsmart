'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPatch } from '@/lib/api'

interface ChainTypeItem {
  id: string
  title: string
  subtitle: string
  color: string
  icon: string
}

interface ChainExample {
  id: string
  chain_type: string
  title: string
  event: string
  thought: string
  emotion: string
  action: string
  outcome: string
  is_helpful: boolean
}

interface SelectionOption {
  id: string
  label: string
  description: string
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
      items?: ChainTypeItem[]
      examples?: ChainExample[]
      question?: string
      options?: SelectionOption[]
    }>
  }
}

interface ModuleProgress {
  id: string
  progress_data: {
    sections_completed?: string[]
    examples_viewed?: string[]
  }
  personal_selections: Record<string, string>
}

const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string; gradient: string }> = {
  emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-50' },
  green: { bg: 'bg-green-600', bgLight: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-50' },
  red: { bg: 'bg-red-600', bgLight: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', gradient: 'from-red-50' },
  orange: { bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-50' },
  purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-50' },
  blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-50' },
}

type ViewState = 'grid' | 'example' | 'personal'

export default function ExamplesPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [module, setModule] = useState<ModuleContent | null>(null)
  const [progress, setProgress] = useState<ModuleProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<ViewState>('grid')
  const [selectedExample, setSelectedExample] = useState<ChainExample | null>(null)
  const [selectedChainType, setSelectedChainType] = useState<string | null>(null)
  const [viewedExamples, setViewedExamples] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadModule = async () => {
      try {
        const [moduleData, progressData] = await Promise.all([
          apiGet<ModuleContent>(`/training-modules/${slug}`),
          apiGet<ModuleProgress | null>(`/training-modules/progress/me/${slug}`).catch(() => null),
        ])
        setModule(moduleData)
        setProgress(progressData)
        if (progressData?.progress_data?.examples_viewed) {
          setViewedExamples(new Set(progressData.progress_data.examples_viewed))
        }
      } catch (err) {
        console.error('Failed to load module:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadModule()
  }, [slug])

  const chainTypesSection = module?.content.sections.find(s => s.type === 'grid_selection')
  const examplesSection = module?.content.sections.find(s => s.type === 'example_screens')
  const personalSection = module?.content.sections.find(s => s.type === 'personal_selection')

  const handleSelectChainType = async (typeId: string) => {
    const example = examplesSection?.examples?.find(e => e.chain_type === typeId)
    if (example) {
      setSelectedExample(example)
      setView('example')

      // Track viewed example
      const newViewed = new Set(viewedExamples)
      newViewed.add(example.id)
      setViewedExamples(newViewed)

      if (progress?.id) {
        try {
          await apiPatch(`/training-modules/progress/${progress.id}`, {
            examples_viewed: Array.from(newViewed),
          })
        } catch (err) {
          console.error('Failed to save progress:', err)
        }
      }
    }
  }

  const handleBackToGrid = () => {
    setView('grid')
    setSelectedExample(null)
  }

  const handleContinueToPersonal = () => {
    setView('personal')
  }

  const handleSelectPersonal = async (optionId: string) => {
    setSelectedChainType(optionId)

    if (progress?.id) {
      try {
        await apiPatch(`/training-modules/progress/${progress.id}`, {
          personal_selection: { chain_type: optionId },
          sections_completed: ['chain_types', 'examples', 'personal_bridge'],
          current_section: 'activities',
        })
      } catch (err) {
        console.error('Failed to save selection:', err)
      }
    }

    // Navigate to activities
    router.push(`/train/${slug}/activities`)
  }

  const handleBack = () => {
    if (view === 'example') {
      handleBackToGrid()
    } else if (view === 'personal') {
      setView('grid')
    } else {
      router.push(`/train/${slug}/learn`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!module) return null

  const moduleColors = colorClasses[module.color] || colorClasses.emerald

  // Example detail view
  if (view === 'example' && selectedExample) {
    const exampleColors = colorClasses[selectedExample.is_helpful ? 'green' : 'red']

    return (
      <div className={`min-h-screen bg-gradient-to-b ${exampleColors.gradient} to-white`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBackToGrid} className="p-2 hover:bg-white/50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className={`text-sm font-medium ${exampleColors.text}`}>
              {selectedExample.is_helpful ? 'Helpful Chain' : 'Unhelpful Chain'}
            </span>
            <div className="w-9" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-6">{selectedExample.title}</h1>

          {/* Chain visualization */}
          <div className="space-y-4">
            {/* Event */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-100 text-gray-600 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-500">Event</span>
              </div>
              <p className="text-gray-900">{selectedExample.event}</p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Thought */}
            <div className={`${exampleColors.bgLight} rounded-xl border ${exampleColors.border} p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`${exampleColors.bg} text-white p-2 rounded-lg`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className={`font-medium ${exampleColors.text}`}>Thought</span>
              </div>
              <p className="text-gray-900 italic">{selectedExample.thought}</p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Emotion */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-pink-100 text-pink-600 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-500">Emotion</span>
              </div>
              <p className="text-gray-900">{selectedExample.emotion}</p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Action */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-500">Action</span>
              </div>
              <p className="text-gray-900">{selectedExample.action}</p>
            </div>

            {/* Outcome */}
            <div className={`${exampleColors.bgLight} rounded-xl border ${exampleColors.border} p-4 mt-6`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-medium ${exampleColors.text}`}>Result</span>
              </div>
              <p className="text-gray-700">{selectedExample.outcome}</p>
            </div>
          </div>

          {/* Back to grid button */}
          <button
            onClick={handleBackToGrid}
            className={`w-full ${moduleColors.bg} text-white font-semibold py-4 px-6 rounded-xl mt-8 hover:opacity-90 transition-opacity`}
          >
            See More Examples
          </button>
        </div>
      </div>
    )
  }

  // Personal selection view
  if (view === 'personal' && personalSection) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${moduleColors.gradient} to-white`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button onClick={() => setView('grid')} className="p-2 hover:bg-white/50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{personalSection.title}</h1>
          <p className="text-gray-600 mb-2">{personalSection.question}</p>
          <p className="text-sm text-gray-400 mb-8">{personalSection.description}</p>

          {/* Options */}
          <div className="space-y-3">
            {personalSection.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectPersonal(option.id)}
                className={`w-full text-left bg-white rounded-xl border p-4 transition-all hover:border-emerald-300 hover:shadow-sm ${
                  selectedChainType === option.id ? `${moduleColors.border} border-2` : 'border-gray-200'
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-1">{option.label}</h3>
                <p className="text-sm text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className={`min-h-screen bg-gradient-to-b ${moduleColors.gradient} to-white`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={handleBack} className="p-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{chainTypesSection?.title}</h1>
        <p className="text-gray-600 mb-8">{chainTypesSection?.description}</p>

        {/* Chain types grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {chainTypesSection?.items?.map((item) => {
            const itemColors = colorClasses[item.color] || colorClasses.emerald
            const example = examplesSection?.examples?.find(e => e.chain_type === item.id)
            const isViewed = example && viewedExamples.has(example.id)

            return (
              <button
                key={item.id}
                onClick={() => handleSelectChainType(item.id)}
                className={`${itemColors.bgLight} ${itemColors.border} border rounded-xl p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`${itemColors.bg} text-white p-2 rounded-lg`}>
                    {item.icon === 'alert-triangle' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {item.icon === 'shield-check' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {item.icon === 'alert-circle' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {item.icon === 'trending-up' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                  </div>
                  {isViewed && (
                    <div className="bg-white/80 text-emerald-600 p-1 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className={`font-semibold ${itemColors.text} text-sm mb-1`}>{item.title}</h3>
                <p className="text-gray-600 text-xs">{item.subtitle}</p>
              </button>
            )
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinueToPersonal}
          className={`w-full ${moduleColors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity`}
        >
          Continue
        </button>

        {/* Viewed count */}
        <p className="text-center text-sm text-gray-400 mt-4">
          {viewedExamples.size} of {examplesSection?.examples?.length || 0} examples viewed
        </p>
      </div>
    </div>
  )
}
