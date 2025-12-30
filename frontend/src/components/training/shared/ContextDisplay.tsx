'use client'

import { ScreenResponse } from '../types'
import { getModuleColors } from '@/lib/colors'

export interface ContextDisplayConfig {
  from_screen: string
  label?: string
  style?: 'card' | 'inline' | 'quote'
}

interface ContextDisplayProps {
  config: ContextDisplayConfig
  allScreenResponses?: Record<string, ScreenResponse>
  moduleColor: string
}

/**
 * Shared component for displaying context from a previous screen response.
 * Used across static_card, text_input, and single_tap_reflection to show
 * cross-activity data (e.g., "Your goal: [goal from Activity 4]").
 *
 * @example
 * ```tsx
 * <ContextDisplay
 *   config={{ from_screen: 'a4_s3_goal_input', label: 'Your goal:' }}
 *   allScreenResponses={allScreenResponses}
 *   moduleColor="amber"
 * />
 * ```
 */
export function ContextDisplay({
  config,
  allScreenResponses,
  moduleColor,
}: ContextDisplayProps) {
  const colors = getModuleColors(moduleColor)

  // Get the response from the referenced screen
  const response = allScreenResponses?.[config.from_screen]

  // Extract display text from various response types
  const displayText =
    response?.text_input ||
    response?.selection ||
    response?.commitment_id?.replace('mc_', '').replace(/_/g, ' ') ||
    (response?.text_inputs && response.text_inputs.length > 0
      ? response.text_inputs.join(', ')
      : null)

  // Don't render if no data available
  if (!displayText) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `ContextDisplay: No data found for screen '${config.from_screen}'`,
        { availableScreens: Object.keys(allScreenResponses || {}) }
      )
    }
    return null
  }

  const style = config.style || 'card'

  if (style === 'inline') {
    return (
      <p className="text-gray-600 mb-4">
        {config.label && <span className="text-gray-500">{config.label} </span>}
        <span className={`${colors.text} font-medium`}>{displayText}</span>
      </p>
    )
  }

  if (style === 'quote') {
    return (
      <blockquote className={`border-l-4 ${colors.border} pl-4 mb-4`}>
        {config.label && (
          <p className="text-sm text-gray-500 mb-1">{config.label}</p>
        )}
        <p className={`${colors.text} font-medium italic`}>"{displayText}"</p>
      </blockquote>
    )
  }

  // Default: card style
  return (
    <div className={`${colors.bgLight} ${colors.border} border-2 rounded-xl p-4 mb-4`}>
      {config.label && (
        <p className="text-sm text-gray-500 mb-1">{config.label}</p>
      )}
      <p className={`${colors.text} font-medium`}>{displayText}</p>
    </div>
  )
}

export default ContextDisplay
