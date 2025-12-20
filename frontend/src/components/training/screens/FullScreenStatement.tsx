'use client'

import { FullScreenStatementContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface FullScreenStatementProps extends ScreenComponentProps {
  content: FullScreenStatementContent
}

export default function FullScreenStatement({
  content,
  onContinue,
  moduleColor,
}: FullScreenStatementProps) {
  const colors = getModuleColors(moduleColor)

  const isReassurance = content.style === 'reassurance'

  return (
    <div className={`flex flex-col min-h-[calc(100vh-180px)] bg-gradient-to-b ${colors.gradient}`}>
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center space-y-6">
          {/* Icon based on style */}
          {isReassurance ? (
            <div className="flex justify-center mb-8">
              <div className={`${colors.bg} p-4 rounded-full`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-8">
              <div className={`${colors.bg} p-4 rounded-full`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            </div>
          )}

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed max-w-md mx-auto">
            {content.statement}
          </h2>

          {content.subtext && (
            <p className="text-gray-600 text-lg max-w-sm mx-auto">{content.subtext}</p>
          )}
        </div>
      </div>

      {/* Continue button */}
      <div className="px-4 pb-8">
        <button
          onClick={onContinue}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
