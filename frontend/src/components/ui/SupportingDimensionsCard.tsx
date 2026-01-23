'use client'

import { useState } from 'react'
import { BookOpen, Eye, Leaf, Target, Info } from 'lucide-react'
import { ScoreBar } from './ScoreBar'
import { DimensionInfoModal } from './DimensionInfoModal'
import {
  SUPPORTING_PILLAR_KEYS,
  PILLAR_DISPLAY_NAMES,
  MPA_DEFINITIONS,
  type SupportingPillarKey,
} from '@/lib/mpaDefinitions'

interface SupportingDimensionsCardProps {
  scores: Record<string, number>
  variant?: 'card' | 'inline'
}

const DIMENSION_ICONS: Record<SupportingPillarKey, typeof BookOpen> = {
  knowledge: BookOpen,
  self_awareness: Eye,
  wellness: Leaf,
  deliberate_practice: Target,
}

export function SupportingDimensionsCard({
  scores,
  variant = 'card',
}: SupportingDimensionsCardProps) {
  const [selectedDimension, setSelectedDimension] = useState<SupportingPillarKey | null>(null)

  // Filter to only include supporting dimensions that have scores
  const dimensionsWithScores = SUPPORTING_PILLAR_KEYS.filter(
    (key) => scores[key] !== undefined && scores[key] !== null
  )

  if (dimensionsWithScores.length === 0) {
    return null
  }

  const handleInfoClick = (dimension: SupportingPillarKey) => {
    setSelectedDimension(dimension)
  }

  if (variant === 'inline') {
    // Inline variant for admin dashboard - no card wrapper
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {dimensionsWithScores.map((pillar) => {
            const Icon = DIMENSION_ICONS[pillar]
            const score = scores[pillar] || 0
            return (
              <div key={pillar} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {PILLAR_DISPLAY_NAMES[pillar]}
                  </span>
                  <button
                    onClick={() => handleInfoClick(pillar)}
                    className="p-0.5 rounded-full hover:bg-purple-100 transition-colors"
                    aria-label={`Info about ${PILLAR_DISPLAY_NAMES[pillar]}`}
                  >
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
                <ScoreBar score={score} colorScheme="purple" />
              </div>
            )
          })}
        </div>

        <DimensionInfoModal
          dimension={selectedDimension ? MPA_DEFINITIONS[selectedDimension] : null}
          isOpen={selectedDimension !== null}
          onClose={() => setSelectedDimension(null)}
        />
      </>
    )
  }

  // Card variant for athlete dashboard
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-400 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Supporting Dimensions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dimensionsWithScores.map((pillar) => {
            const Icon = DIMENSION_ICONS[pillar]
            const score = scores[pillar] || 0
            return (
              <div key={pillar} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {PILLAR_DISPLAY_NAMES[pillar]}
                  </span>
                  <button
                    onClick={() => handleInfoClick(pillar)}
                    className="p-0.5 rounded-full hover:bg-purple-100 transition-colors"
                    aria-label={`Info about ${PILLAR_DISPLAY_NAMES[pillar]}`}
                  >
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
                <ScoreBar score={score} colorScheme="purple" />
              </div>
            )
          })}
        </div>
      </div>

      <DimensionInfoModal
        dimension={selectedDimension ? MPA_DEFINITIONS[selectedDimension] : null}
        isOpen={selectedDimension !== null}
        onClose={() => setSelectedDimension(null)}
      />
    </>
  )
}
