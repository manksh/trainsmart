'use client'

import React from 'react'
import { MPA_DEFINITIONS, PILLAR_DISPLAY_NAMES, type PillarKey } from '@/lib/mpaDefinitions'

interface PillarTooltipProps {
  pillar: PillarKey
  children?: React.ReactNode
  className?: string
}

/**
 * A lightweight CSS-only tooltip that displays the pillar definition on hover.
 * Uses the existing MPA_DEFINITIONS for descriptions.
 */
export function PillarTooltip({ pillar, children, className = '' }: PillarTooltipProps) {
  const definition = MPA_DEFINITIONS[pillar]
  const displayName = children || PILLAR_DISPLAY_NAMES[pillar]

  if (!definition) {
    return <span className={className}>{displayName}</span>
  }

  return (
    <span className={`group relative inline-flex items-center cursor-help ${className}`}>
      <span className="border-b border-dotted border-gray-400">
        {displayName}
      </span>
      {/* Tooltip */}
      <span
        className="
          pointer-events-none
          absolute left-0 bottom-full mb-2
          w-64 p-2.5
          text-xs font-normal text-gray-700 leading-relaxed
          bg-white rounded-lg shadow-lg
          border border-gray-200
          opacity-0 invisible
          group-hover:opacity-100 group-hover:visible
          transition-opacity duration-200
          z-50
        "
        role="tooltip"
      >
        {definition.description}
        {/* Arrow */}
        <span
          className="
            absolute left-4 top-full
            border-8 border-transparent border-t-white
            drop-shadow-sm
          "
        />
      </span>
    </span>
  )
}
