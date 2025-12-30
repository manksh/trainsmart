'use client'

import { SummaryPlanContent, ScreenComponentProps, ScreenResponse } from '../types'
import { getModuleColors } from '@/lib/colors'

interface SummaryPlanProps extends ScreenComponentProps {
  content: SummaryPlanContent
  allScreenResponses?: Record<string, ScreenResponse>
}

/**
 * Extracts display text from a screen response.
 * Handles various response types: text_input, text_inputs, selection, selections, commitment_id.
 */
function extractDisplayText(response: ScreenResponse | undefined): string[] {
  if (!response) return []

  const results: string[] = []

  // Single text input
  if (response.text_input) {
    results.push(response.text_input)
  }

  // Multiple text inputs
  if (response.text_inputs && response.text_inputs.length > 0) {
    results.push(...response.text_inputs)
  }

  // Single selection
  if (response.selection) {
    results.push(response.selection)
  }

  // Multiple selections
  if (response.selections && response.selections.length > 0) {
    results.push(...response.selections)
  }

  // Commitment ID (formatted)
  if (response.commitment_id && results.length === 0) {
    results.push(response.commitment_id.replace('mc_', '').replace(/_/g, ' '))
  }

  return results
}

export default function SummaryPlan({
  content,
  onContinue,
  moduleColor,
  allScreenResponses,
}: SummaryPlanProps) {
  const colors = getModuleColors(moduleColor)

  // Border color mapping for section items
  const borderClasses: Record<string, string> = {
    emerald: 'border-emerald-200',
    purple: 'border-purple-200',
    blue: 'border-blue-200',
    amber: 'border-amber-200',
    rose: 'border-rose-200',
    cyan: 'border-cyan-200',
  }
  const itemBorder = borderClasses[moduleColor] || borderClasses.purple

  /**
   * Collects all responses from the specified screens for a section.
   */
  const getSectionItems = (screenIds: string[]): string[] => {
    const items: string[] = []

    for (const screenId of screenIds) {
      const response = allScreenResponses?.[screenId]
      const texts = extractDisplayText(response)
      items.push(...texts)

      // Dev warning for missing data
      if (process.env.NODE_ENV === 'development' && !response) {
        console.warn(
          `SummaryPlan: No data found for screen '${screenId}'`,
          { availableScreens: Object.keys(allScreenResponses || {}) }
        )
      }
    }

    return items
  }

  /**
   * Renders a section's items based on the display type.
   */
  const renderSectionItems = (
    items: string[],
    displayType: 'list' | 'numbered' | 'cards' = 'list'
  ) => {
    if (items.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-500 italic">No response recorded</p>
        </div>
      )
    }

    switch (displayType) {
      case 'numbered':
        return (
          <ol className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span
                  className={`flex-shrink-0 w-6 h-6 ${colors.bg} text-white rounded-full flex items-center justify-center text-sm font-medium`}
                >
                  {index + 1}
                </span>
                <span className="text-gray-800 pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        )

      case 'cards':
        return (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className={`${colors.bgLight} ${itemBorder} border-2 rounded-xl p-4`}
              >
                <p className={`${colors.text} font-medium`}>{item}</p>
              </div>
            ))}
          </div>
        )

      case 'list':
      default:
        return (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-2 h-2 ${colors.bg} rounded-full mt-2`} />
                <span className="text-gray-800">{item}</span>
              </li>
            ))}
          </ul>
        )
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className={`text-2xl font-bold ${colors.text} mb-6`}>{content.title}</h2>

        <div className="space-y-6">
          {content.sections.map((section, sectionIndex) => {
            const items = getSectionItems(section.display_from_screens)

            return (
              <div key={sectionIndex} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
                {renderSectionItems(items, section.display_type)}
              </div>
            )
          })}
        </div>

        {content.subtext && (
          <p className="text-gray-600 mt-8 text-center">{content.subtext}</p>
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
