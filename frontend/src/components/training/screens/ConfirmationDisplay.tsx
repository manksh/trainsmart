'use client'

import { ConfirmationDisplayContent, ScreenComponentProps, ScreenResponse } from '../types'
import { getModuleColors } from '@/lib/colors'

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
  const colors = getModuleColors(moduleColor)

  // Border color mapping for confirmation items
  const borderClasses: Record<string, string> = {
    emerald: 'border-emerald-200',
    purple: 'border-purple-200',
    blue: 'border-blue-200',
    amber: 'border-amber-200',
    rose: 'border-rose-200',
    cyan: 'border-cyan-200',
  }
  const itemBorder = borderClasses[moduleColor] || borderClasses.purple

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
                className={`${colors.bgLight} ${itemBorder} border-2 rounded-xl p-4`}
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
