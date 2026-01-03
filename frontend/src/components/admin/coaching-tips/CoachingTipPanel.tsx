'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { X, FileQuestion, TrendingUp } from 'lucide-react'
import { CoachingTipCard } from './CoachingTipCard'
import { useCoachingTips, getTipContext, type PillarTips } from '@/hooks/useCoachingTips'
import { PILLAR_DISPLAY_NAMES, type PillarKey } from '@/lib/mpaDefinitions'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type FilterType = 'all' | 'strengths' | 'growth'

export interface CoachingTipPanelProps {
  /** Whether the panel is open */
  isOpen: boolean
  /** Callback when panel should close */
  onClose: () => void
  /** Athlete to show tips for */
  athlete: {
    id: string
    first_name: string
    last_name: string
    has_completed_assessment: boolean
    pillar_scores: Record<string, number> | null
    strengths: string[] | null
    growth_areas: string[] | null
  } | null
}

interface FilterButtonProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}

function FilterButton({ label, count, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-sage-700 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      aria-pressed={isActive}
    >
      {label}
      <span
        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-sage-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
    </div>
  )
}

/**
 * Side panel component for displaying coaching tips.
 * Features slide-in animation, backdrop, and filter controls.
 * Implements focus trapping and keyboard navigation for accessibility.
 */
export function CoachingTipPanel({ isOpen, onClose, athlete }: CoachingTipPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  // Reset filter when athlete changes
  useEffect(() => {
    setFilter('all')
  }, [athlete?.id])

  // Fetch coaching tips (static data - same for all athletes)
  const { data, isLoading, error } = useCoachingTips({
    enabled: isOpen && !!athlete?.has_completed_assessment,
  })

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)

    // Focus the close button when panel opens
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)

    // Prevent body scroll when panel is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Get relevant tips (only for strengths and growth areas)
  const relevantTips = useMemo(() => {
    if (!data?.tips || !athlete) return []

    const tips: Array<{ pillar: string; tips: PillarTips; context: 'strength' | 'growth' }> = []

    // Get tips for strengths
    athlete.strengths?.forEach((pillar) => {
      if (data.tips[pillar]) {
        tips.push({ pillar, tips: data.tips[pillar], context: 'strength' })
      }
    })

    // Get tips for growth areas
    athlete.growth_areas?.forEach((pillar) => {
      if (data.tips[pillar]) {
        tips.push({ pillar, tips: data.tips[pillar], context: 'growth' })
      }
    })

    return tips
  }, [data?.tips, athlete?.strengths, athlete?.growth_areas])

  // Filter tips based on selection
  const filteredTips = useMemo(() => {
    if (filter === 'all') return relevantTips
    if (filter === 'strengths') return relevantTips.filter((t) => t.context === 'strength')
    if (filter === 'growth') return relevantTips.filter((t) => t.context === 'growth')
    return relevantTips
  }, [relevantTips, filter])

  // Count tips by category for filter badges
  const tipCounts = useMemo(() => {
    const strengths = relevantTips.filter((t) => t.context === 'strength').length
    const growth = relevantTips.filter((t) => t.context === 'growth').length
    return { all: relevantTips.length, strengths, growth }
  }, [relevantTips])

  // Render content based on state
  const renderContent = () => {
    // No assessment completed
    if (!athlete?.has_completed_assessment) {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Assessment Not Completed"
          description="This athlete hasn't completed their MPA assessment yet. Coaching tips will be available once they complete it."
        />
      )
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )
    }

    // Error state
    if (error) {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Unable to Load Tips"
          description="There was an error loading coaching tips. Please try again later."
        />
      )
    }

    // No tips available (no qualifying scores)
    if (relevantTips.length === 0) {
      return (
        <EmptyState
          icon={TrendingUp}
          title="No Qualifying Scores"
          description="This athlete's scores don't meet the threshold for coaching tips. Tips appear for scores above 5.5 (strengths) or below 3.5 (growth areas)."
        />
      )
    }

    // No tips match filter
    if (filteredTips.length === 0) {
      return (
        <EmptyState
          icon={TrendingUp}
          title={`No ${filter === 'strengths' ? 'Strength' : 'Growth'} Tips`}
          description={`This athlete doesn't have any ${
            filter === 'strengths' ? 'strength' : 'growth area'
          } tips. Try viewing all tips instead.`}
        />
      )
    }

    // Show tips
    return (
      <div className="space-y-4">
        {filteredTips.map(({ pillar, tips, context }) => {
          const tipContent = context === 'strength' ? tips.strength_tips : tips.growth_tips

          return (
            <CoachingTipCard
              key={pillar}
              pillar={pillar}
              displayName={tips.display_name || PILLAR_DISPLAY_NAMES[pillar as PillarKey] || pillar}
              score={athlete?.pillar_scores?.[pillar] ?? 0}
              context={context}
              practiceTip={tipContent.practice}
              gameDayTip={tipContent.game_day}
            />
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Coaching tips for ${athlete?.first_name} ${athlete?.last_name}`}
        className={`fixed right-0 top-0 h-full w-full sm:w-[28rem] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Coaching Tips</h2>
            {athlete && (
              <p className="text-sm text-gray-500">
                {athlete.first_name} {athlete.last_name}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Filter controls */}
        {athlete?.has_completed_assessment && relevantTips.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex gap-2">
              <FilterButton
                label="All"
                count={tipCounts.all}
                isActive={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <FilterButton
                label="Strengths"
                count={tipCounts.strengths}
                isActive={filter === 'strengths'}
                onClick={() => setFilter('strengths')}
              />
              <FilterButton
                label="Growth"
                count={tipCounts.growth}
                isActive={filter === 'growth'}
                onClick={() => setFilter('growth')}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-8rem)]">{renderContent()}</div>
      </aside>
    </>
  )
}

export default CoachingTipPanel
