'use client'

import { ConfirmationDisplayContent, ScreenComponentProps, ScreenResponse } from '../types'

interface ConfirmationDisplayProps extends ScreenComponentProps {
  content: ConfirmationDisplayContent
  allScreenResponses?: Record<string, ScreenResponse>
}

export default function ConfirmationDisplay({
  content,
  onContinue,
  moduleColor,
  allScreenResponses,
}: ConfirmationDisplayProps) {
  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  // Collect text inputs from the specified screens
  const displayItems: string[] = []
  if (allScreenResponses && content.display_from_screens) {
    for (const screenId of content.display_from_screens) {
      const response = allScreenResponses[screenId]
      if (response?.text_input) {
        displayItems.push(response.text_input)
      }
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{content.title}</h2>

        <div className="space-y-4">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <div
                key={index}
                className={`${colors.bgLight} ${colors.border} border-2 rounded-xl p-4`}
              >
                <p className={`${colors.text} font-medium text-lg`}>{item}</p>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-500 italic">No responses recorded yet</p>
            </div>
          )}
        </div>

        {content.subtext && (
          <p className="text-gray-600 mt-6">{content.subtext}</p>
        )}

        {content.follow_up && (
          <p className="text-gray-500 text-sm mt-4">{content.follow_up}</p>
        )}
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
