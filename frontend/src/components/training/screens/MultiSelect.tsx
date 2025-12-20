'use client'

import { useState, useEffect } from 'react'
import { MultiSelectContent, ScreenComponentProps } from '../types'

interface MultiSelectProps extends ScreenComponentProps {
  content: MultiSelectContent
}

export default function MultiSelect({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: MultiSelectProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    savedResponse?.selections || []
  )
  const [otherText, setOtherText] = useState<string>(savedResponse?.text_input || '')
  const [showOtherInput, setShowOtherInput] = useState<boolean>(
    savedResponse?.selections?.includes('other') || false
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
      setSelectedOptions(savedResponse.selections)
      setShowOtherInput(savedResponse.selections.includes('other'))
    }
    if (savedResponse?.text_input) {
      setOtherText(savedResponse.text_input)
    }
  }, [savedResponse])

  const handleToggle = (optionId: string) => {
    if (optionId === 'other') {
      setShowOtherInput(!showOtherInput)
      if (showOtherInput) {
        setSelectedOptions((prev) => prev.filter((id) => id !== 'other'))
        setOtherText('')
      } else {
        setSelectedOptions((prev) => [...prev, 'other'])
      }
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const handleContinue = () => {
    const response: { selections: string[]; text_input?: string } = {
      selections: selectedOptions,
    }
    if (showOtherInput && otherText.trim()) {
      response.text_input = otherText.trim()
    }
    onSaveResponse(response)
    onContinue()
  }

  const canContinue = selectedOptions.length > 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.prompt}</h2>
        <p className="text-gray-500 text-sm mb-6">Select all that apply</p>

        <div className="space-y-3">
          {content.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id)
            return (
              <button
                key={option.id}
                onClick={() => handleToggle(option.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${colors.bgLight} ${colors.border} ring-2 ${colors.ring}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected ? `${colors.border} ${colors.bg}` : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
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
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${isSelected ? colors.text : 'text-gray-900'}`}
                    >
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

          {content.include_other && (
            <>
              <button
                onClick={() => handleToggle('other')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showOtherInput
                    ? `${colors.bgLight} ${colors.border} ring-2 ${colors.ring}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      showOtherInput ? `${colors.border} ${colors.bg}` : 'border-gray-300'
                    }`}
                  >
                    {showOtherInput && (
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
                    )}
                  </div>
                  <p
                    className={`font-medium ${showOtherInput ? colors.text : 'text-gray-900'}`}
                  >
                    Something else
                  </p>
                </div>
              </button>

              {showOtherInput && (
                <div className="pl-8">
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Describe..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}
            </>
          )}
        </div>
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
