'use client'

import {
  ConditionalContentContent,
  ConditionalBranch,
  ScreenComponentProps,
  ScreenResponse,
  StaticCardContent,
  GuidedBreathingContent,
  TapRevealListContent,
  FullScreenStatementContent,
  SingleTapReflectionContent,
} from '../types'
import StaticCard from './StaticCard'
import GuidedBreathing from './GuidedBreathing'
import TapRevealList from './TapRevealList'
import FullScreenStatement from './FullScreenStatement'
import SingleTapReflection from './SingleTapReflection'

interface ConditionalContentProps extends ScreenComponentProps {
  content: ConditionalContentContent
  allScreenResponses?: Record<string, ScreenResponse>
}

/**
 * ConditionalContent - Renders different screens based on previous responses
 *
 * Checks a previous screen's response and renders the matching branch.
 * Each branch can be a different screen type (StaticCard, GuidedBreathing, etc.)
 *
 * Example usage in content:
 * {
 *   "condition_screen": "a5_s4",
 *   "conditions": {
 *     "sigh": { "type": "guided_breathing", "content": {...} },
 *     "exhale": { "type": "guided_breathing", "content": {...} }
 *   }
 * }
 */
export default function ConditionalContent({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
  allScreenResponses = {},
}: ConditionalContentProps) {
  // Get the user's response from the condition screen
  const sourceResponse = allScreenResponses[content.condition_screen]

  // Determine which branch to show based on the user's selection
  const userSelection = sourceResponse?.selection || ''
  const matchingBranch: ConditionalBranch | undefined =
    content.conditions[userSelection] || content.default_branch

  // If no matching branch, show a fallback and allow continuing
  if (!matchingBranch) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-gray-500 text-center">
            Continue to the next screen.
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={onContinue}
            className="w-full bg-gray-500 text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Common props for all screen types
  const commonProps = {
    onContinue,
    onSaveResponse,
    savedResponse,
    moduleColor,
  }

  // Render the appropriate screen type based on the branch
  switch (matchingBranch.type) {
    case 'static_card':
      return (
        <StaticCard
          {...commonProps}
          content={matchingBranch.content as StaticCardContent}
        />
      )

    case 'guided_breathing':
      return (
        <GuidedBreathing
          {...commonProps}
          content={matchingBranch.content as GuidedBreathingContent}
        />
      )

    case 'tap_reveal_list':
      return (
        <TapRevealList
          {...commonProps}
          content={matchingBranch.content as TapRevealListContent}
        />
      )

    case 'full_screen_statement':
      return (
        <FullScreenStatement
          {...commonProps}
          content={matchingBranch.content as FullScreenStatementContent}
        />
      )

    case 'single_tap_reflection':
    case 'single_select':
      return (
        <SingleTapReflection
          {...commonProps}
          content={matchingBranch.content as SingleTapReflectionContent}
        />
      )

    default:
      // Unsupported branch type - show error and allow continuing
      console.warn(`Unsupported conditional branch type: ${matchingBranch.type}`)
      return (
        <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-gray-500 text-center">
              Content not available. Please continue.
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={onContinue}
              className="w-full bg-gray-500 text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )
  }
}
