'use client'

import { useState, useEffect } from 'react'
import { MicroCommitmentContent, ScreenComponentProps, ScreenResponse } from '../types'

interface MicroCommitmentProps extends ScreenComponentProps {
  content: MicroCommitmentContent
}

export default function MicroCommitment({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: MicroCommitmentProps) {
  const [selectedCommitment, setSelectedCommitment] = useState<string | null>(
    savedResponse?.commitment_id || null
  )
  const [customInput, setCustomInput] = useState<string>(
    (savedResponse as any)?.custom_input || ''
  )
  const [showConfirmation, setShowConfirmation] = useState(false)

  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string; ring: string; gradient: string }> = {
    emerald: {
      bg: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-500',
      ring: 'ring-emerald-500',
      gradient: 'from-emerald-50 to-white',
    },
    purple: {
      bg: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-500',
      ring: 'ring-purple-500',
      gradient: 'from-purple-50 to-white',
    },
    blue: {
      bg: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-500',
      ring: 'ring-blue-500',
      gradient: 'from-blue-50 to-white',
    },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  // Pre-select the saved commitment but don't auto-show confirmation
  // This lets users change their selection if they want to
  useEffect(() => {
    if (savedResponse?.commitment_id && !selectedCommitment) {
      setSelectedCommitment(savedResponse.commitment_id)
    }
  }, [savedResponse, selectedCommitment])

  const handleSelect = (commitmentId: string) => {
    setSelectedCommitment(commitmentId)
  }

  const handleConfirm = () => {
    setShowConfirmation(true)
  }

  const handleContinue = () => {
    if (selectedCommitment) {
      const response: any = { commitment_id: selectedCommitment }
      if (content.allow_custom_input && customInput.trim()) {
        response.custom_input = customInput.trim()
      }
      onSaveResponse(response)
      onContinue()
    }
  }

  const selectedOption = content.options.find((o) => o.id === selectedCommitment)

  // Generate confirmation message - handle both confirmation_template and follow_up_prompt
  const getConfirmationMessage = () => {
    if (!selectedOption) return ''
    const template = (content as any).confirmation_template || (content as any).follow_up_prompt
    if (template && template.includes('{{commitment}}')) {
      return template.replace('{{commitment}}', selectedOption.text)
    }
    // Fallback: just show the selected option
    return selectedOption.text
  }

  // Confirmation view
  if (showConfirmation && selectedOption) {
    return (
      <div className={`flex flex-col min-h-[calc(100vh-180px)] bg-gradient-to-b ${colors.gradient}`}>
        <div className="flex-1 flex flex-col justify-center px-6 py-12">
          <div className="text-center space-y-6">
            {/* Checkmark icon */}
            <div className="flex justify-center mb-8">
              <div className={`${colors.bg} p-4 rounded-full`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">Your Commitment</h2>

            <div className={`${colors.bgLight} ${colors.border} border-2 rounded-xl p-6 mx-auto max-w-sm`}>
              <p className="text-lg text-gray-800 font-medium">{selectedOption.text}</p>
              {customInput.trim() && (
                <p className="text-gray-600 mt-2 italic">"{customInput.trim()}"</p>
              )}
            </div>

            <p className="text-gray-500 text-sm">Small steps lead to big changes.</p>
          </div>
        </div>

        <div className="px-4 pb-8">
          <button
            onClick={handleContinue}
            className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all`}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Selection view
  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{content.prompt}</h2>

      <div className="flex-1">
        <div className="space-y-3">
          {content.options.map((option) => {
            const isSelected = selectedCommitment === option.id

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
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? colors.border : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />}
                  </div>
                  <p className={`${isSelected ? colors.text : 'text-gray-700'}`}>{option.text}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Custom input field when enabled */}
        {content.allow_custom_input && selectedCommitment && (
          <div className="mt-6">
            <p className="text-gray-600 mb-2">{content.follow_up_prompt || "Let's get specific for you:"}</p>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type your specific commitment..."
              className={`w-full p-4 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-2 focus:${colors.border} transition-all`}
            />
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="mt-8">
        <button
          onClick={handleConfirm}
          disabled={!selectedCommitment}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          I commit to this
        </button>
      </div>
    </div>
  )
}
