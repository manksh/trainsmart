'use client'

import { useState, useEffect } from 'react'
import { RecognitionListContent, ScreenComponentProps, ScreenResponse } from '../types'

interface RecognitionListProps extends ScreenComponentProps {
  content: RecognitionListContent
}

export default function RecognitionList({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: RecognitionListProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(savedResponse?.selections || [])
  )

  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string; ring: string }> = {
    emerald: {
      bg: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-500',
      ring: 'ring-emerald-500',
    },
    purple: {
      bg: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-500',
      ring: 'ring-purple-500',
    },
    blue: {
      bg: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-500',
      ring: 'ring-blue-500',
    },
    amber: {
      bg: 'bg-amber-600',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-500',
      ring: 'ring-amber-500',
    },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  useEffect(() => {
    if (savedResponse?.selections) {
      setSelectedItems(new Set(savedResponse.selections))
    }
  }, [savedResponse])

  const handleToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleContinue = () => {
    onSaveResponse({ selections: Array.from(selectedItems) })
    onContinue()
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h2>
      <p className="text-gray-600 mb-6">{content.instruction}</p>

      <div className="flex-1">
        <div className="space-y-2">
          {content.items.map((item) => {
            const isSelected = selectedItems.has(item.id)

            return (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${colors.bgLight} ${colors.border} ${colors.ring} ring-1`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                      isSelected ? `${colors.bg} border-transparent` : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className={`${isSelected ? colors.text : 'text-gray-700'}`}>{item.text}</p>
                </div>
              </button>
            )
          })}
        </div>

        {selectedItems.size > 0 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={selectedItems.size === 0}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
