'use client'

import { useState, useEffect, useCallback } from 'react'
import { EmojiGridContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface EmojiGridProps extends ScreenComponentProps {
  content: EmojiGridContent
}

/**
 * EmojiGrid - Interactive grid of emotions with tap-to-explore modal details
 *
 * Displays a grid of emotions (17 total) that users can tap to explore.
 * Core emotions (Joy, Sadness, Anger, Fear, Disgust) have a distinct border
 * and must all be explored before the user can continue.
 *
 * Uses `revealed_items` in ScreenResponse to track explored emotions.
 */
export default function EmojiGrid({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: EmojiGridProps) {
  const [exploredEmotions, setExploredEmotions] = useState<string[]>(
    savedResponse?.revealed_items || []
  )
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)

  const colors = getModuleColors(moduleColor)

  // Restore state from saved response
  useEffect(() => {
    if (savedResponse?.revealed_items) {
      setExploredEmotions(savedResponse.revealed_items)
    }
  }, [savedResponse])

  // Get core emotions from content
  const coreEmotions = content.emotions.filter((e) => e.is_core)
  const coreEmotionIds = coreEmotions.map((e) => e.id)

  // Check if all core emotions have been explored
  const allCoreExplored = coreEmotionIds.every((id) =>
    exploredEmotions.includes(id)
  )

  // Get the currently selected emotion's data
  const currentEmotion = selectedEmotion
    ? content.emotions.find((e) => e.id === selectedEmotion)
    : null

  const handleEmotionTap = useCallback(
    (emotionId: string) => {
      // Mark as explored if not already
      if (!exploredEmotions.includes(emotionId)) {
        const newExplored = [...exploredEmotions, emotionId]
        setExploredEmotions(newExplored)
        onSaveResponse({ revealed_items: newExplored })
      }
      // Open the detail modal
      setSelectedEmotion(emotionId)
    },
    [exploredEmotions, onSaveResponse]
  )

  const handleCloseModal = useCallback(() => {
    setSelectedEmotion(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, emotionId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleEmotionTap(emotionId)
      }
    },
    [handleEmotionTap]
  )

  const handleModalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal()
      }
    },
    [handleCloseModal]
  )

  // Count explored core emotions for progress indicator
  const exploredCoreCount = coreEmotionIds.filter((id) =>
    exploredEmotions.includes(id)
  ).length

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        {/* Prompt */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {content.prompt}
        </h2>

        {/* Core requirement message */}
        {content.core_required_message && !allCoreExplored && (
          <p className="text-sm text-gray-600 mb-4">
            {content.core_required_message}
            <span className={`ml-2 font-medium ${colors.text}`}>
              ({exploredCoreCount}/{coreEmotionIds.length})
            </span>
          </p>
        )}

        {/* Emoji Grid */}
        <div
          className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-6"
          role="grid"
          aria-label="Emotions grid"
        >
          {content.emotions.map((emotion) => {
            const isExplored = exploredEmotions.includes(emotion.id)
            const isCore = emotion.is_core

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionTap(emotion.id)}
                onKeyDown={(e) => handleKeyDown(e, emotion.id)}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-xl
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}
                  hover:scale-105 active:scale-95
                  ${isCore ? `border-2 ${colors.border}` : 'border border-gray-200'}
                  ${isExplored ? colors.bgLight : 'bg-white'}
                `}
                role="gridcell"
                aria-label={`${emotion.label}${isCore ? ' (core emotion)' : ''}${isExplored ? ', explored' : ''}`}
                aria-pressed={isExplored}
              >
                {/* Checkmark overlay for explored emotions */}
                {isExplored && (
                  <div
                    className={`absolute top-1 right-1 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}
                    aria-hidden="true"
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Emoji */}
                <span className="text-3xl mb-1" role="img" aria-hidden="true">
                  {emotion.emoji}
                </span>

                {/* Label */}
                <span className="text-sm font-medium text-gray-700">
                  {emotion.label}
                </span>

                {/* Core indicator */}
                {isCore && !isExplored && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] ${colors.text} font-medium`}
                  >
                    Core
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8">
        <button
          onClick={onContinue}
          disabled={!allCoreExplored}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl transition-all ${
            allCoreExplored ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
          aria-disabled={!allCoreExplored}
        >
          Continue
        </button>
      </div>

      {/* Modal Overlay for Emotion Details */}
      {selectedEmotion && currentEmotion && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={handleCloseModal}
          onKeyDown={handleModalKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="emotion-detail-title"
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`${colors.bgLight} px-6 py-5 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl" role="img" aria-hidden="true">
                  {currentEmotion.emoji}
                </span>
                <h3
                  id="emotion-detail-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {currentEmotion.label}
                </h3>
                {currentEmotion.is_core && (
                  <span
                    className={`text-xs font-medium ${colors.text} ${colors.bgLight} px-2 py-0.5 rounded-full border ${colors.border}`}
                  >
                    Core
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                aria-label="Close emotion details"
              >
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-100px)]">
              {/* Description */}
              <p className="text-gray-700 mb-6">
                {currentEmotion.detail.description}
              </p>

              {/* Body Feelings */}
              {currentEmotion.detail.body_feelings &&
                currentEmotion.detail.body_feelings.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-lg" role="img" aria-hidden="true">
                        🫀
                      </span>
                      How it feels in your body
                    </h4>
                    <ul className="space-y-1.5">
                      {currentEmotion.detail.body_feelings.map(
                        (feeling, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <span className="text-gray-400 mt-0.5">-</span>
                            {feeling}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Similar Feelings */}
              {currentEmotion.detail.similar_feelings &&
                currentEmotion.detail.similar_feelings.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-lg" role="img" aria-hidden="true">
                        🔗
                      </span>
                      Similar feelings
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentEmotion.detail.similar_feelings.map(
                        (feeling, index) => (
                          <span
                            key={index}
                            className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                          >
                            {feeling}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* When Helpful */}
              {currentEmotion.detail.when_helpful &&
                currentEmotion.detail.when_helpful.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-lg" role="img" aria-hidden="true">
                        ✨
                      </span>
                      When it&apos;s helpful
                    </h4>
                    <ul className="space-y-1.5">
                      {currentEmotion.detail.when_helpful.map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <span className="text-green-500 mt-0.5">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* When Challenging */}
              {currentEmotion.detail.when_challenging &&
                currentEmotion.detail.when_challenging.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-lg" role="img" aria-hidden="true">
                        ⚡
                      </span>
                      When it can be challenging
                    </h4>
                    <ul className="space-y-1.5">
                      {currentEmotion.detail.when_challenging.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <span className="text-amber-500 mt-0.5">!</span>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>

            {/* Modal Footer - Back to Grid */}
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className={`w-full ${colors.bg} text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
              >
                Back to Grid
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
