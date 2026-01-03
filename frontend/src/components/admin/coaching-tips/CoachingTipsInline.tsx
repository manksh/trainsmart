'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, FileQuestion, TrendingUp } from 'lucide-react'
import { CoachingTipCard } from './CoachingTipCard'
import { useCoachingTips, type PillarTips } from '@/hooks/useCoachingTips'
import { PILLAR_DISPLAY_NAMES, type PillarKey } from '@/lib/mpaDefinitions'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type FilterType = 'all' | 'strengths' | 'growth'

export interface CoachingTipsInlineProps {
  /** Athlete to show tips for */
  athlete: {
    id: string
    first_name: string
    last_name: string
    has_completed_assessment: boolean
    pillar_scores: Record<string, number> | null
    strengths: string[] | null
    growth_areas: string[] | null
  }
  /** Whether the inline section is expanded */
  isExpanded: boolean
  /** Callback when expand/collapse is toggled */
  onToggle: () => void
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
      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-sage-700 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      aria-pressed={isActive}
    >
      {label}
      <span
        className={`ml-1 px-1 py-0.5 text-xs rounded-full ${
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
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 max-w-xs">{description}</p>
    </div>
  )
}

/**
 * Inline expandable coaching tips component for mobile view.
 * Displays tips directly below the pillar scores row.
 */
export function CoachingTipsInline({
  athlete,
  isExpanded,
  onToggle,
}: CoachingTipsInlineProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  // Fetch coaching tips (static data - same for all athletes, only when expanded)
  const { data, isLoading, error } = useCoachingTips({
    enabled: isExpanded && athlete.has_completed_assessment,
  })

  // Get relevant tips (only for strengths and growth areas)
  const relevantTips = useMemo(() => {
    if (!data?.tips) return []

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
  }, [data?.tips, athlete.strengths, athlete.growth_areas])

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
    if (!athlete.has_completed_assessment) {
      return (
        <EmptyState
          icon={FileQuestion}
          title="Assessment Not Completed"
          description="Coaching tips will be available once the assessment is completed."
        />
      )
    }

    // Loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
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
          description="There was an error loading coaching tips."
        />
      )
    }

    // No tips available
    if (relevantTips.length === 0) {
      return (
        <EmptyState
          icon={TrendingUp}
          title="No Qualifying Scores"
          description="Scores don't meet the threshold for coaching tips."
        />
      )
    }

    // No tips match filter
    if (filteredTips.length === 0) {
      return (
        <EmptyState
          icon={TrendingUp}
          title={`No ${filter === 'strengths' ? 'Strength' : 'Growth'} Tips`}
          description="Try viewing all tips instead."
        />
      )
    }

    // Show tips
    return (
      <div className="space-y-3">
        {filteredTips.map(({ pillar, tips, context }) => {
          const tipContent = context === 'strength' ? tips.strength_tips : tips.growth_tips

          return (
            <CoachingTipCard
              key={pillar}
              pillar={pillar}
              displayName={tips.display_name || PILLAR_DISPLAY_NAMES[pillar as PillarKey] || pillar}
              score={athlete.pillar_scores?.[pillar] ?? 0}
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
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`coaching-tips-${athlete.id}`}
      >
        <span className="text-sm font-medium text-sage-700">Coaching Tips</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div
          id={`coaching-tips-${athlete.id}`}
          className="px-4 pb-4"
        >
          {/* Filter controls */}
          {athlete.has_completed_assessment && relevantTips.length > 0 && (
            <div className="mb-3 flex gap-2">
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
          )}

          {renderContent()}
        </div>
      )}
    </div>
  )
}

export default CoachingTipsInline
