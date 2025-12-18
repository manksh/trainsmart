'use client'

import {
  Screen,
  ScreenResponse,
  SwipeCardContent,
  FullScreenStatementContent,
  SingleTapReflectionContent,
  TapRevealColumnsContent,
  ZoneDiagramContent,
  RecognitionListContent,
  MicroCommitmentContent,
  MicroCommitmentConfirmationContent,
  ActivityCompletionContent,
} from '../types'
import SwipeCard from './SwipeCard'
import FullScreenStatement from './FullScreenStatement'
import SingleTapReflection from './SingleTapReflection'
import TapRevealColumns from './TapRevealColumns'
import ZoneDiagram from './ZoneDiagram'
import RecognitionList from './RecognitionList'
import MicroCommitment from './MicroCommitment'
import MicroCommitmentConfirmation from './MicroCommitmentConfirmation'
import ActivityCompletion from './ActivityCompletion'

interface ScreenRendererProps {
  screen: Screen
  onContinue: () => void
  onSaveResponse: (response: ScreenResponse) => void
  savedResponse?: ScreenResponse
  moduleColor: string
  allScreenResponses?: Record<string, ScreenResponse>
}

export default function ScreenRenderer({
  screen,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
  allScreenResponses,
}: ScreenRendererProps) {
  const commonProps = {
    onContinue,
    onSaveResponse,
    savedResponse,
    moduleColor,
  }

  switch (screen.type) {
    case 'swipe_card':
      return <SwipeCard {...commonProps} content={screen.content as SwipeCardContent} />

    case 'full_screen_statement':
      return (
        <FullScreenStatement {...commonProps} content={screen.content as FullScreenStatementContent} />
      )

    case 'single_tap_reflection':
      return (
        <SingleTapReflection
          {...commonProps}
          content={screen.content as SingleTapReflectionContent}
        />
      )

    case 'tap_reveal_columns':
      return (
        <TapRevealColumns
          {...commonProps}
          content={screen.content as TapRevealColumnsContent}
        />
      )

    case 'zone_diagram':
      return (
        <ZoneDiagram
          {...commonProps}
          content={screen.content as ZoneDiagramContent}
        />
      )

    case 'recognition_list':
      return (
        <RecognitionList
          {...commonProps}
          content={screen.content as RecognitionListContent}
        />
      )

    case 'micro_commitment':
      return (
        <MicroCommitment
          {...commonProps}
          content={screen.content as MicroCommitmentContent}
        />
      )

    case 'micro_commitment_confirmation':
      return (
        <MicroCommitmentConfirmation
          {...commonProps}
          content={screen.content as MicroCommitmentConfirmationContent}
          allScreenResponses={allScreenResponses}
        />
      )

    case 'activity_completion':
      return (
        <ActivityCompletion
          {...commonProps}
          content={screen.content as ActivityCompletionContent}
        />
      )

    default:
      return (
        <PlaceholderScreen
          type={screen.type}
          onContinue={onContinue}
          moduleColor={moduleColor}
        />
      )
  }
}

// Temporary placeholder component for screens not yet implemented
function PlaceholderScreen({
  type,
  onContinue,
  moduleColor,
}: {
  type: string
  onContinue: () => void
  moduleColor: string
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-600',
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
  }

  const bgColor = colorClasses[moduleColor] || colorClasses.purple

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Screen type: {type}</p>
          <p className="text-gray-400 text-sm mt-1">Component coming soon</p>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onContinue}
          className={`w-full ${bgColor} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
