'use client'

import { ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface ActivityCompletionContent {
  title: string
  message: string
  next_activity_hint?: string
}

interface ActivityCompletionProps extends ScreenComponentProps {
  content: ActivityCompletionContent
}

export default function ActivityCompletion({
  content,
  onContinue,
  moduleColor,
}: ActivityCompletionProps) {
  const colors = getModuleColors(moduleColor)

  return (
    <div className={`flex flex-col min-h-[calc(100vh-180px)] bg-gradient-to-b ${colors.gradient}`}>
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center space-y-6">
          {/* Celebration icon */}
          <div className="flex justify-center mb-8">
            <div className={`${colors.bg} p-5 rounded-full shadow-lg`}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>

          <p className="text-lg text-gray-600 max-w-sm mx-auto leading-relaxed">
            {content.message}
          </p>

          {content.next_activity_hint && (
            <div className={`${colors.bgLight} rounded-xl p-4 mx-auto max-w-sm mt-6`}>
              <p className="text-gray-700 text-sm">
                <span className="font-medium">Up next:</span> {content.next_activity_hint}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={onContinue}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all shadow-lg`}
        >
          Complete Activity
        </button>
      </div>
    </div>
  )
}
