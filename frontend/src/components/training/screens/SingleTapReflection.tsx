'use client'

import { useState, useEffect } from 'react'
import { SingleTapReflectionContent, ScreenComponentProps, ScreenResponse } from '../types'

interface SingleTapReflectionProps extends ScreenComponentProps {
  content: SingleTapReflectionContent
}

export default function SingleTapReflection({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: SingleTapReflectionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    savedResponse?.selection || null
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
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  useEffect(() => {
    if (savedResponse?.selection) {
      setSelectedOption(savedResponse.selection)
    }
  }, [savedResponse])

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId)
  }

  const handleContinue = () => {
    if (selectedOption) {
      onSaveResponse({ selection: selectedOption })
      onContinue()
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{content.prompt}</h2>

        <div className="space-y-3">
          {content.options.map((option) => {
            const isSelected = selectedOption === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${colors.bgLight} ${colors.border} ${colors.ring} ring-2`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected ? colors.border : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${isSelected ? colors.text : 'text-gray-900'}`}>
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!selectedOption}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
