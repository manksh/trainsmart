'use client'

import { StaticCardContent, ScreenComponentProps, ScreenResponse } from '../types'
import { getModuleColors } from '@/lib/colors'
import ContextDisplay from '../shared/ContextDisplay'

interface StaticCardProps extends ScreenComponentProps {
  content: StaticCardContent
  allScreenResponses?: Record<string, ScreenResponse>
}

export default function StaticCard({
  content,
  onContinue,
  moduleColor,
  allScreenResponses,
}: StaticCardProps) {
  const colors = getModuleColors(moduleColor)

  // Border color mapping for emphasis mode
  const borderClasses: Record<string, string> = {
    emerald: 'border-emerald-200',
    purple: 'border-purple-200',
    blue: 'border-blue-200',
    amber: 'border-amber-200',
    rose: 'border-rose-200',
    cyan: 'border-cyan-200',
  }
  const emphasisBorder = borderClasses[moduleColor] || borderClasses.purple

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1 flex flex-col justify-center">
        {/* Context display from previous screen response */}
        {content.context_display && (
          <ContextDisplay
            config={content.context_display}
            allScreenResponses={allScreenResponses}
            moduleColor={moduleColor}
          />
        )}

        <div
          className={`rounded-2xl p-6 space-y-4 ${
            content.emphasis
              ? `${colors.bgLight} border-2 ${emphasisBorder}`
              : 'bg-white shadow-sm border border-gray-100'
          }`}
        >
          {content.title && (
            <h2 className={`text-lg font-semibold ${colors.text}`}>{content.title}</h2>
          )}

          <p
            className={`leading-relaxed ${
              content.emphasis ? 'text-2xl font-semibold text-gray-900' : 'text-xl text-gray-900'
            }`}
          >
            {content.body}
          </p>

          {content.subtext && (
            <p className="text-gray-500 text-sm italic">{content.subtext}</p>
          )}

          {content.follow_up && (
            <p className="text-gray-700 mt-4">{content.follow_up}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
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
