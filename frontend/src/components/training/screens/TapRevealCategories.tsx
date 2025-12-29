'use client'

import { useState, useEffect, useCallback } from 'react'
import { TapRevealCategoriesContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface TapRevealCategoriesProps extends ScreenComponentProps {
  content: TapRevealCategoriesContent
}

/**
 * TapRevealCategories - Grouped tap-to-reveal component with categories
 *
 * Displays items organized into categories, revealed either sequentially
 * or in any order based on the reveal_mode setting.
 */
export default function TapRevealCategories({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: TapRevealCategoriesProps) {
  const [revealedItems, setRevealedItems] = useState<string[]>(
    savedResponse?.revealed_items || []
  )

  const colors = getModuleColors(moduleColor)

  // Gradient classes for the reveal button
  const gradientClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    cyan: 'from-cyan-500 to-cyan-600',
  }
  const buttonGradient = gradientClasses[moduleColor] || gradientClasses.purple

  // Restore state from saved response
  useEffect(() => {
    if (savedResponse?.revealed_items) {
      setRevealedItems(savedResponse.revealed_items)
    }
  }, [savedResponse])

  // Get all items flattened for sequential mode
  const getAllItems = useCallback(() => {
    return content.categories.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        categoryId: category.id,
        categoryTitle: category.title,
      }))
    )
  }, [content.categories])

  // Get the next item to reveal in sequential mode
  const getNextSequentialItem = useCallback(() => {
    const allItems = getAllItems()
    const nextIndex = revealedItems.length
    return nextIndex < allItems.length ? allItems[nextIndex] : null
  }, [getAllItems, revealedItems.length])

  const handleRevealItem = (itemId: string) => {
    if (revealedItems.includes(itemId)) return

    // In sequential mode, only allow revealing the next item in order
    if (content.reveal_mode === 'sequential') {
      const nextItem = getNextSequentialItem()
      if (!nextItem || nextItem.id !== itemId) return
    }

    const newRevealed = [...revealedItems, itemId]
    setRevealedItems(newRevealed)
    onSaveResponse({ revealed_items: newRevealed })
  }

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRevealItem(itemId)
    }
  }

  // Check if all items have been revealed
  const totalItems = content.categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  )
  const allRevealed = revealedItems.length >= totalItems

  // For sequential mode, determine which items are revealable
  const nextSequentialItem = content.reveal_mode === 'sequential' ? getNextSequentialItem() : null

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        {content.header && (
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {content.header}
          </h2>
        )}

        <div className="space-y-6">
          {content.categories.map((category) => (
            <div key={category.id}>
              <h3 className={`text-lg font-semibold ${colors.text} mb-3`}>
                {category.title}
              </h3>

              <div className="space-y-3">
                {category.items.map((item) => {
                  const isRevealed = revealedItems.includes(item.id)
                  const isNextInSequence =
                    content.reveal_mode === 'sequential' &&
                    nextSequentialItem?.id === item.id
                  const canReveal =
                    content.reveal_mode === 'any_order'
                      ? !isRevealed
                      : isNextInSequence

                  if (isRevealed) {
                    return (
                      <div
                        key={item.id}
                        className={`${colors.bgLight} rounded-xl p-4 border-2 border-transparent animate-fade-in`}
                        role="listitem"
                        aria-label={item.text}
                      >
                        <p className="text-gray-800">{item.text}</p>
                      </div>
                    )
                  }

                  if (canReveal) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleRevealItem(item.id)}
                        onKeyDown={(e) => handleKeyDown(e, item.id)}
                        className={`w-full bg-gradient-to-r ${buttonGradient} rounded-xl p-4 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
                        aria-label="Tap to reveal next item"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                          />
                        </svg>
                        Tap to reveal
                      </button>
                    )
                  }

                  // Placeholder for unrevealed items
                  return (
                    <div
                      key={item.id}
                      className="bg-gray-100 rounded-xl p-4 opacity-50"
                      aria-hidden="true"
                    >
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {allRevealed && content.subtext_after_reveal && (
          <p className="text-gray-500 text-sm italic mt-6 animate-fade-in">
            {content.subtext_after_reveal}
          </p>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={onContinue}
          disabled={!allRevealed}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl transition-all ${
            allRevealed ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focusRing}`}
          aria-disabled={!allRevealed}
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
