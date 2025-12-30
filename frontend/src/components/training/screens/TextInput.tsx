'use client'

import { useState, useEffect } from 'react'
import { TextInputContent, ScreenComponentProps, ScreenResponse } from '../types'
import { getModuleColors } from '@/lib/colors'
import ContextDisplay from '../shared/ContextDisplay'

interface TextInputProps extends ScreenComponentProps {
  content: TextInputContent
  allScreenResponses?: Record<string, ScreenResponse>
}

export default function TextInput({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
  allScreenResponses,
}: TextInputProps) {
  // Single input mode state
  const [inputValue, setInputValue] = useState<string>(savedResponse?.text_input || '')

  // Multiple inputs mode state
  const [multipleInputs, setMultipleInputs] = useState<string[]>(() => {
    if (content.multiple && savedResponse?.text_inputs) {
      return savedResponse.text_inputs
    }
    // Initialize with min_entries empty strings if in multiple mode
    if (content.multiple) {
      return Array(content.multiple.min_entries).fill('')
    }
    return []
  })

  const colors = getModuleColors(moduleColor)
  const isMultipleMode = !!content.multiple

  useEffect(() => {
    if (isMultipleMode && savedResponse?.text_inputs) {
      setMultipleInputs(savedResponse.text_inputs)
    } else if (!isMultipleMode && savedResponse?.text_input) {
      setInputValue(savedResponse.text_input)
    }
  }, [savedResponse, isMultipleMode])

  const handleContinue = () => {
    if (isMultipleMode) {
      const filledInputs = multipleInputs.filter((input) => input.trim().length > 0)
      if (filledInputs.length >= (content.multiple?.min_entries || 1)) {
        onSaveResponse({ text_inputs: filledInputs })
        onContinue()
      }
    } else {
      if (inputValue.trim()) {
        // Store the full text including prefix if present
        const fullText = content.prefix ? `${content.prefix}${inputValue.trim()}` : inputValue.trim()
        onSaveResponse({ text_input: fullText })
        onContinue()
      }
    }
  }

  const handleMultipleInputChange = (index: number, value: string) => {
    const newInputs = [...multipleInputs]
    newInputs[index] = value
    setMultipleInputs(newInputs)
  }

  const handleAddEntry = () => {
    if (content.multiple && multipleInputs.length < content.multiple.max_entries) {
      setMultipleInputs([...multipleInputs, ''])
    }
  }

  const handleRemoveEntry = (index: number) => {
    if (content.multiple && multipleInputs.length > content.multiple.min_entries) {
      const newInputs = multipleInputs.filter((_, i) => i !== index)
      setMultipleInputs(newInputs)
    }
  }

  // Calculate if continue is enabled
  const canContinue = isMultipleMode
    ? multipleInputs.filter((input) => input.trim().length > 0).length >=
      (content.multiple?.min_entries || 1)
    : inputValue.trim().length > 0

  // Get label for an entry in multiple mode
  const getEntryLabel = (index: number): string | undefined => {
    return content.multiple?.entry_labels?.[index]
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        {/* Context display from previous screen response */}
        {content.context_display && (
          <ContextDisplay
            config={content.context_display}
            allScreenResponses={allScreenResponses}
            moduleColor={moduleColor}
          />
        )}

        <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.prompt}</h2>
        {content.subtext && (
          <p className="text-gray-500 text-sm mb-6">{content.subtext}</p>
        )}

        {isMultipleMode ? (
          // Multiple inputs mode
          <div className="mt-6 space-y-4">
            {multipleInputs.map((value, index) => (
              <div key={index} className="relative">
                {getEntryLabel(index) && (
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    {getEntryLabel(index)}
                  </label>
                )}
                <div className="flex items-start gap-2">
                  <textarea
                    value={value}
                    onChange={(e) => handleMultipleInputChange(index, e.target.value)}
                    placeholder={content.placeholder || `Entry ${index + 1}...`}
                    maxLength={content.max_length || 500}
                    className={`flex-1 min-h-[80px] p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.focusRing.replace('focus:', '')} focus:border-transparent resize-none text-gray-900`}
                  />
                  {content.multiple &&
                    multipleInputs.length > content.multiple.min_entries && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove entry ${index + 1}`}
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                </div>
              </div>
            ))}

            {content.multiple && multipleInputs.length < content.multiple.max_entries && (
              <button
                type="button"
                onClick={handleAddEntry}
                className={`w-full py-3 px-4 border-2 border-dashed ${colors.border} rounded-xl ${colors.text} font-medium hover:${colors.bgLight} transition-colors flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add another entry
              </button>
            )}
          </div>
        ) : (
          // Single input mode (existing behavior)
          <div className="mt-6">
            {content.prefix ? (
              <div
                className={`flex items-start gap-2 p-4 rounded-xl border-2 border-gray-200 focus-within:border-transparent focus-within:ring-2 ${colors.focusRing.replace('focus:', '')}`}
              >
                <span className={`font-medium ${colors.text} whitespace-nowrap pt-1`}>
                  {content.prefix}
                </span>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={content.placeholder || 'Type here...'}
                  maxLength={content.max_length || 500}
                  className="flex-1 min-h-[100px] resize-none focus:outline-none text-gray-900"
                  autoFocus
                />
              </div>
            ) : (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={content.placeholder || 'Type here...'}
                maxLength={content.max_length || 500}
                className={`w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.focusRing.replace('focus:', '')} focus:border-transparent resize-none text-gray-900`}
                autoFocus
              />
            )}

            {content.max_length && (
              <p className="text-gray-400 text-xs mt-2 text-right">
                {inputValue.length} / {content.max_length}
              </p>
            )}
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
