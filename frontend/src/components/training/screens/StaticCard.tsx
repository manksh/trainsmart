'use client'

import { StaticCardContent, ScreenComponentProps } from '../types'

interface StaticCardProps extends ScreenComponentProps {
  content: StaticCardContent
}

export default function StaticCard({ content, onContinue, moduleColor }: StaticCardProps) {
  const colorClasses: Record<string, { bg: string; bgLight: string; text: string }> = {
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600' },
    purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600' },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <div
          className={`rounded-2xl p-6 space-y-4 ${
            content.emphasis
              ? `${colors.bgLight} border-2 border-${moduleColor}-200`
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
