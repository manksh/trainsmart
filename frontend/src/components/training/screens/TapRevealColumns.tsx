'use client'

import { useState, useEffect } from 'react'
import { TapRevealColumnsContent, ScreenComponentProps, ScreenResponse } from '../types'

interface TapRevealColumnsProps extends ScreenComponentProps {
  content: TapRevealColumnsContent
}

export default function TapRevealColumns({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: TapRevealColumnsProps) {
  const [revealedItems, setRevealedItems] = useState<Set<string>>(
    new Set(savedResponse?.revealed_items || [])
  )

  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    emerald: {
      bg: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    purple: {
      bg: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    blue: {
      bg: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  useEffect(() => {
    if (savedResponse?.revealed_items) {
      setRevealedItems(new Set(savedResponse.revealed_items))
    }
  }, [savedResponse])

  const handleReveal = (itemId: string) => {
    setRevealedItems((prev) => {
      const newSet = new Set(prev)
      newSet.add(itemId)
      return newSet
    })
  }

  const allRevealed = content.right_column.items.every((item) => revealedItems.has(item.id))

  const handleContinue = () => {
    onSaveResponse({ revealed_items: Array.from(revealedItems) })
    onContinue()
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{content.header}</h2>

      <div className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="space-y-2">
            <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>
              {content.left_column.title}
            </h3>
            {content.left_column.items.map((item, index) => (
              <div
                key={index}
                className={`${colors.bgLight} ${colors.border} border rounded-lg p-3`}
              >
                <p className="text-sm text-gray-800">{item}</p>
              </div>
            ))}
          </div>

          {/* Right Column - Tap to Reveal */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              {content.right_column.title}
            </h3>
            {content.right_column.items.map((item) => {
              const isRevealed = revealedItems.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => handleReveal(item.id)}
                  disabled={isRevealed}
                  className={`w-full text-left rounded-lg p-3 transition-all ${
                    isRevealed
                      ? 'bg-white border border-gray-200'
                      : `${colors.bg} text-white hover:opacity-90`
                  }`}
                >
                  {isRevealed ? (
                    <p className="text-sm text-gray-800">{item.text}</p>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Tap to reveal
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {!allRevealed && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Tap each item on the right to reveal
          </p>
        )}
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!allRevealed}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
