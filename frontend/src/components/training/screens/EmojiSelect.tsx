'use client'

import { useState, useEffect } from 'react'
import { EmojiSelectContent, ScreenComponentProps } from '../types'

interface EmojiSelectProps extends ScreenComponentProps {
  content: EmojiSelectContent
}

export default function EmojiSelect({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: EmojiSelectProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    savedResponse?.selections || []
  )
  const [customText, setCustomText] = useState<string>(savedResponse?.text_input || '')

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
      setSelectedOptions(savedResponse.selections)
    }
    if (savedResponse?.text_input) {
      setCustomText(savedResponse.text_input)
    }
  }, [savedResponse])

  const handleToggle = (optionId: string) => {
    if (content.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleContinue = () => {
    const response: { selections: string[]; text_input?: string } = {
      selections: selectedOptions,
    }
    if (customText.trim()) {
      response.text_input = customText.trim()
    }
    onSaveResponse(response)
    onContinue()
  }

  const canContinue = selectedOptions.length > 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{content.prompt}</h2>

        <div className="grid grid-cols-3 gap-3">
          {content.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id)
            return (
              <button
                key={option.id}
                onClick={() => handleToggle(option.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${colors.bgLight} ${colors.border} ring-2 ${colors.ring}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl mb-2">{option.emoji}</span>
                <span
                  className={`text-sm font-medium ${
                    isSelected ? colors.text : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>

        {content.optional_text_prompt && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.optional_text_prompt}
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
