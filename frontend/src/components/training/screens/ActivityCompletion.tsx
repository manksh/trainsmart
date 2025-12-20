'use client'

import { ScreenComponentProps } from '../types'

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
  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; gradient: string }> = {
    emerald: {
      bg: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text: 'text-emerald-600',
      gradient: 'from-emerald-50 to-white',
    },
    purple: {
      bg: 'bg-purple-600',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      gradient: 'from-purple-50 to-white',
    },
    blue: {
      bg: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      gradient: 'from-blue-50 to-white',
    },
    amber: {
      bg: 'bg-amber-600',
      bgLight: 'bg-amber-50',
      text: 'text-amber-600',
      gradient: 'from-amber-50 to-white',
    },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

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
