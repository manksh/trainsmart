'use client'

import { Lightbulb, Trophy } from 'lucide-react'
import type { TipContext } from '@/hooks/useCoachingTips'

export interface CoachingTipCardProps {
  /** Pillar key (e.g., 'confidence') */
  pillar: string
  /** Human-readable pillar name */
  displayName: string
  /** The pillar score (1-7 scale) */
  score: number
  /** Whether this is a strength or growth area */
  context: TipContext
  /** Coaching tip for practice/training */
  practiceTip: string
  /** Coaching tip for game day/competition */
  gameDayTip: string
}

/**
 * Card component displaying coaching tips for a specific pillar.
 * Shows strength/growth badge, practice tip, and game day tip.
 */
export function CoachingTipCard({
  displayName,
  score,
  context,
  practiceTip,
  gameDayTip,
}: CoachingTipCardProps) {
  const isStrength = context === 'strength'

  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      aria-label={`Coaching tips for ${displayName}`}
    >
      {/* Header with pillar name and badge */}
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">{displayName}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{score.toFixed(1)}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isStrength
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {isStrength ? 'Strength' : 'Growth'}
          </span>
        </div>
      </header>

      {/* Tips section */}
      <div className="space-y-3">
        {/* Practice tip */}
        <div className="flex gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <Lightbulb className="w-4 h-4 text-sage-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              Practice
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{practiceTip}</p>
          </div>
        </div>

        {/* Game day tip */}
        <div className="flex gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <Trophy className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              Game Day
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{gameDayTip}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default CoachingTipCard
