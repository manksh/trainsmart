'use client'

import { useState, useEffect } from 'react'
import { TextInputContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface TextInputProps extends ScreenComponentProps {
  content: TextInputContent
}

export default function TextInput({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: TextInputProps) {
  const [inputValue, setInputValue] = useState<string>(savedResponse?.text_input || '')

  const colors = getModuleColors(moduleColor)

  useEffect(() => {
    if (savedResponse?.text_input) {
      setInputValue(savedResponse.text_input)
    }
  }, [savedResponse])

  const handleContinue = () => {
    if (inputValue.trim()) {
      // Store the full text including prefix if present
      const fullText = content.prefix ? `${content.prefix}${inputValue.trim()}` : inputValue.trim()
      onSaveResponse({ text_input: fullText })
      onContinue()
    }
  }

  const canContinue = inputValue.trim().length > 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.prompt}</h2>
        {content.subtext && (
          <p className="text-gray-500 text-sm mb-6">{content.subtext}</p>
        )}

        <div className="mt-6">
          {content.prefix ? (
            <div className={`flex items-start gap-2 p-4 rounded-xl border-2 border-gray-200 focus-within:border-transparent focus-within:ring-2 ${colors.focusRing.replace('focus:', '')}`}>
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
