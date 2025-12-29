'use client'

import { useState, useEffect, useCallback } from 'react'
import { TapMatchingContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface TapMatchingProps extends ScreenComponentProps {
  content: TapMatchingContent
}

interface MatchAttempt {
  itemId: string
  targetId: string
  isCorrect: boolean
}

/**
 * TapMatching - Interactive matching exercise component
 *
 * Users tap an item, then tap a target to create a match.
 * Design decision: Incorrect matches stay visible until user taps "Try Again".
 */
export default function TapMatching({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: TapMatchingProps) {
  // Current matches: itemId -> targetId
  const [matches, setMatches] = useState<Record<string, string>>(
    savedResponse?.matches || {}
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<MatchAttempt[]>([])
  const [showIncorrectFeedback, setShowIncorrectFeedback] = useState(false)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)

  const colors = getModuleColors(moduleColor)

  // Restore state from saved response
  useEffect(() => {
    if (savedResponse?.matches) {
      setMatches(savedResponse.matches)
      // If we have saved matches, check if they're all correct
      const allCorrect = content.items.every(
        (item) => savedResponse.matches?.[item.id] === item.correct_match
      )
      if (allCorrect) {
        setHasCompletedOnce(true)
      }
    }
  }, [savedResponse, content.items])

  // Check if item is already matched
  const isItemMatched = useCallback(
    (itemId: string) => {
      return itemId in matches
    },
    [matches]
  )

  // Check if target already has a match
  const getItemMatchedToTarget = useCallback(
    (targetId: string) => {
      return Object.entries(matches).find(([, t]) => t === targetId)?.[0]
    },
    [matches]
  )

  // Handle item selection
  const handleItemClick = (itemId: string) => {
    if (showIncorrectFeedback) return
    if (isItemMatched(itemId)) {
      // Already matched, deselect if selected
      if (selectedItemId === itemId) {
        setSelectedItemId(null)
      }
      return
    }
    setSelectedItemId(itemId)
  }

  // Handle target selection
  const handleTargetClick = (targetId: string) => {
    if (showIncorrectFeedback) return
    if (!selectedItemId) return

    // Check if target already has a match
    const existingMatch = getItemMatchedToTarget(targetId)
    if (existingMatch) return

    // Create the match
    const item = content.items.find((i) => i.id === selectedItemId)
    if (!item) return

    const isCorrect = item.correct_match === targetId
    const newMatches = { ...matches, [selectedItemId]: targetId }

    setMatches(newMatches)
    setAttempts([...attempts, { itemId: selectedItemId, targetId, isCorrect }])
    setSelectedItemId(null)

    // Check if all items are matched
    if (Object.keys(newMatches).length === content.items.length) {
      // All matched - check if all correct
      const allCorrect = content.items.every(
        (i) => newMatches[i.id] === i.correct_match
      )

      if (allCorrect) {
        setHasCompletedOnce(true)
        onSaveResponse({ matches: newMatches })
      } else if (content.show_feedback) {
        setShowIncorrectFeedback(true)
      }
    }
  }

  // Handle try again after incorrect
  const handleTryAgain = () => {
    setMatches({})
    setAttempts([])
    setShowIncorrectFeedback(false)
    setSelectedItemId(null)
  }

  // Handle keyboard navigation
  const handleItemKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(itemId)
    }
  }

  const handleTargetKeyDown = (e: React.KeyboardEvent, targetId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleTargetClick(targetId)
    }
  }

  // Calculate completion state
  const allMatched = Object.keys(matches).length === content.items.length
  const allCorrect =
    allMatched &&
    content.items.every((item) => matches[item.id] === item.correct_match)

  // Get feedback colors for matched items
  const getMatchFeedbackColor = (itemId: string) => {
    if (!content.show_feedback) return null
    if (!matches[itemId]) return null

    const item = content.items.find((i) => i.id === itemId)
    if (!item) return null

    const isCorrect = matches[itemId] === item.correct_match

    if (allMatched || showIncorrectFeedback) {
      return isCorrect
        ? 'bg-green-50 border-green-300 text-green-800'
        : 'bg-red-50 border-red-300 text-red-800'
    }
    return null
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-4 overflow-y-auto">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {content.prompt}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Tap an item, then tap its matching target
        </p>

        {/* Incorrect feedback overlay */}
        {showIncorrectFeedback && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-red-800 font-medium mb-3">
              Some matches are incorrect. Review and try again.
            </p>
            <button
              onClick={handleTryAgain}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Items to match */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Items
          </h3>
          <div className="space-y-2">
            {content.items.map((item) => {
              const isMatched = isItemMatched(item.id)
              const isSelected = selectedItemId === item.id
              const feedbackColor = getMatchFeedbackColor(item.id)
              const matchedTarget = matches[item.id]
                ? content.targets.find((t) => t.id === matches[item.id])
                : null

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  onKeyDown={(e) => handleItemKeyDown(e, item.id)}
                  disabled={showIncorrectFeedback}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing} ${
                    feedbackColor
                      ? feedbackColor
                      : isSelected
                        ? `${colors.bgLight} ${colors.border}`
                        : isMatched
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${showIncorrectFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                  aria-pressed={isSelected}
                  aria-describedby={matchedTarget ? `match-${item.id}` : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className={isMatched && !feedbackColor ? 'text-gray-500' : ''}>
                      {item.text}
                    </span>
                    {matchedTarget && (
                      <span
                        id={`match-${item.id}`}
                        className={`text-sm px-2 py-1 rounded-full ${
                          feedbackColor
                            ? ''
                            : `${colors.bgLight} ${colors.text}`
                        }`}
                      >
                        {matchedTarget.label}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Targets */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Match To
          </h3>
          <div className="space-y-2">
            {content.targets.map((target) => {
              const matchedItemId = getItemMatchedToTarget(target.id)
              const isAvailable = !matchedItemId && selectedItemId !== null

              return (
                <button
                  key={target.id}
                  onClick={() => handleTargetClick(target.id)}
                  onKeyDown={(e) => handleTargetKeyDown(e, target.id)}
                  disabled={!isAvailable || showIncorrectFeedback}
                  className={`w-full p-3 rounded-lg border-2 text-left text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing} ${
                    matchedItemId
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-default'
                      : isAvailable
                        ? `${colors.bg} text-white border-transparent hover:opacity-90`
                        : 'bg-white border-gray-200 text-gray-700'
                  } ${!isAvailable || showIncorrectFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                  aria-disabled={!isAvailable || showIncorrectFeedback}
                >
                  {target.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Success message */}
        {allCorrect && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center animate-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-green-800 font-medium">Great job! All correct!</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={onContinue}
          disabled={!allCorrect}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl transition-all ${
            allCorrect ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
          aria-disabled={!allCorrect}
        >
          Continue
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
