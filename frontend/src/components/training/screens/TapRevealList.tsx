'use client'

import { useState, useEffect } from 'react'
import { TapRevealListContent, ScreenComponentProps } from '../types'

interface TapRevealListProps extends ScreenComponentProps {
  content: TapRevealListContent
}

export default function TapRevealList({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: TapRevealListProps) {
  const [revealedItems, setRevealedItems] = useState<string[]>(
    savedResponse?.revealed_items || []
  )

  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; gradient: string }> = {
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-600' },
    purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', gradient: 'from-amber-500 to-amber-600' },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  useEffect(() => {
    if (savedResponse?.revealed_items) {
      setRevealedItems(savedResponse.revealed_items)
    }
  }, [savedResponse])

  const handleRevealNext = () => {
    const nextIndex = revealedItems.length
    if (nextIndex < content.items.length) {
      const nextItem = content.items[nextIndex]
      const newRevealed = [...revealedItems, nextItem.id]
      setRevealedItems(newRevealed)
      onSaveResponse({ revealed_items: newRevealed })
    }
  }

  const allRevealed = revealedItems.length >= content.items.length
  const showHeader2 =
    content.header2 &&
    content.header2_after_item !== undefined &&
    revealedItems.length >= content.header2_after_item

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        {content.header && (
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{content.header}</h2>
        )}

        <div className="space-y-3">
          {content.items.map((item, index) => {
            const isRevealed = revealedItems.includes(item.id)
            const isNext = index === revealedItems.length

            // Show header2 before this item if applicable
            const showHeader2Before =
              content.header2 &&
              content.header2_after_item === index &&
              revealedItems.length >= index

            return (
              <div key={item.id}>
                {showHeader2Before && (
                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
                    {content.header2}
                  </h3>
                )}

                {isRevealed ? (
                  <div
                    className={`${colors.bgLight} rounded-xl p-4 border-2 border-transparent animate-fade-in`}
                  >
                    <p className="text-gray-800">{item.text}</p>
                  </div>
                ) : isNext ? (
                  <button
                    onClick={handleRevealNext}
                    className={`w-full bg-gradient-to-r ${colors.gradient} rounded-xl p-4 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                ) : (
                  <div className="bg-gray-100 rounded-xl p-4 opacity-50">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  </div>
                )}
              </div>
            )
          })}
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
          }`}
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
