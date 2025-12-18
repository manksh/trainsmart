'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiPost, apiPatch } from '@/lib/api'

interface Card {
  id: string
  title: string
  content: string
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
      cards?: Card[]
    }>
  }
}

interface ModuleProgress {
  id: string
  progress_data: {
    cards_viewed?: string[]
    sections_completed?: string[]
  }
  current_section: string | null
  current_step: number | null
}

const colorClasses: Record<string, { bg: string; bgLight: string; text: string; gradient: string }> = {
  emerald: {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    gradient: 'from-emerald-50 to-white',
  },
  purple: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-50',
    text: 'text-purple-600',
    gradient: 'from-purple-50 to-white',
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    gradient: 'from-blue-50 to-white',
  },
}

export default function LearnPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [module, setModule] = useState<ModuleContent | null>(null)
  const [progress, setProgress] = useState<ModuleProgress | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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

        // Set starting position based on progress
        if (progressData?.current_step) {
          setCurrentIndex(progressData.current_step)
        }
      } catch (err) {
        console.error('Failed to load module:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadModule()
  }, [slug])

  const cards = module?.content.sections.find(s => s.type === 'card_deck')?.cards || []

  const saveProgress = useCallback(async (cardIndex: number, viewedCards: string[]) => {
    if (!progress?.id || isSaving) return

    setIsSaving(true)
    try {
      await apiPatch<ModuleProgress>(`/training-modules/progress/${progress.id}`, {
        cards_viewed: viewedCards,
        current_section: 'intro_cards',
        current_step: cardIndex,
      })
    } catch (err) {
      console.error('Failed to save progress:', err)
    } finally {
      setIsSaving(false)
    }
  }, [progress?.id, isSaving])

  const handleNext = async () => {
    if (currentIndex < cards.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)

      // Track viewed cards
      const viewedCards = cards.slice(0, newIndex + 1).map(c => c.id)
      await saveProgress(newIndex, viewedCards)
    } else {
      // Complete the cards section and go to examples
      if (progress?.id) {
        try {
          await apiPatch(`/training-modules/progress/${progress.id}`, {
            sections_completed: ['intro_cards'],
            current_section: 'chain_types',
            current_step: 0,
          })
        } catch (err) {
          console.error('Failed to complete section:', err)
        }
      }
      router.push(`/train/${slug}/examples`)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleBack = () => {
    router.push(`/train/${slug}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded-xl mt-6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!module || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No content available</p>
          <button onClick={handleBack} className="text-emerald-600 font-medium">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const colors = colorClasses[module.color] || colorClasses.emerald
  const currentCard = cards[currentIndex]
  const isLastCard = currentIndex === cards.length - 1

  // Parse markdown-style bold text
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={colors.text}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {cards.length}
          </span>
          <div className="w-9" /> {/* Spacer for alignment */}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-8">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? `w-6 ${colors.bg}`
                  : index < currentIndex
                  ? `w-1.5 ${colors.bg} opacity-50`
                  : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Card content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 min-h-[300px]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{currentCard.title}</h2>
          <div className="text-gray-600 leading-relaxed whitespace-pre-line">
            {formatContent(currentCard.content)}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              currentIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className={`flex-1 ${colors.bg} text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity`}
          >
            {isLastCard ? 'Continue' : 'Next'}
          </button>
        </div>

        {/* Skip option */}
        {!isLastCard && (
          <button
            onClick={() => router.push(`/train/${slug}/examples`)}
            className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-600 transition-colors"
          >
            Skip to examples
          </button>
        )}
      </div>
    </div>
  )
}
