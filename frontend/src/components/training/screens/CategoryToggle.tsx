'use client'

import { useState, useEffect } from 'react'
import { CategoryToggleContent, ScreenComponentProps } from '../types'
import { getModuleColors } from '@/lib/colors'

interface CategoryToggleProps extends ScreenComponentProps {
  content: CategoryToggleContent
}

export default function CategoryToggle({
  content,
  onContinue,
  onSaveResponse,
  savedResponse,
  moduleColor,
}: CategoryToggleProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>(
    savedResponse?.category_assignments || {}
  )
  const [showFeedback, setShowFeedback] = useState(false)

  const colors = getModuleColors(moduleColor)

  // Category-specific colors
  const categoryColors: Record<string, { bg: string; bgLight: string; text: string; border: string }> = {
    internal: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-300' },
    external: { bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-300' },
  }

  useEffect(() => {
    if (savedResponse?.category_assignments) {
      setAssignments(savedResponse.category_assignments)
    }
  }, [savedResponse])

  const handleToggle = (itemId: string) => {
    const currentCategory = assignments[itemId]
    const categoryIds = content.categories.map((c) => c.id)

    let nextCategory: string
    if (!currentCategory) {
      // First tap - assign to first category
      nextCategory = categoryIds[0]
    } else {
      // Cycle to next category
      const currentIndex = categoryIds.indexOf(currentCategory)
      nextCategory = categoryIds[(currentIndex + 1) % categoryIds.length]
    }

    const newAssignments = { ...assignments, [itemId]: nextCategory }
    setAssignments(newAssignments)
  }

  const handleContinue = () => {
    onSaveResponse({ category_assignments: assignments })

    if (content.show_feedback) {
      setShowFeedback(true)
      // Auto-continue after showing feedback
      setTimeout(() => {
        onContinue()
      }, 2000)
    } else {
      onContinue()
    }
  }

  const allAssigned = content.items.every((item) => assignments[item.id])

  // Calculate score if showing feedback
  const correctCount = content.items.filter(
    (item) => assignments[item.id] === item.correct_category
  ).length

  if (showFeedback) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className={`${colors.bgLight} rounded-2xl p-8 text-center`}>
            <div className={`w-16 h-16 ${colors.bg} rounded-full mx-auto mb-4 flex items-center justify-center`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nice work!</h3>
            <p className="text-gray-600">
              You got {correctCount} out of {content.items.length} correct
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.prompt}</h2>
        <p className="text-gray-500 text-sm mb-4">Tap each item to categorize it</p>

        {/* Category legend */}
        <div className="flex gap-4 mb-6">
          {content.categories.map((cat) => {
            const catColors = categoryColors[cat.id] || colors
            return (
              <div key={cat.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${catColors.bg}`} />
                <span className="text-sm font-medium text-gray-700">{cat.label}</span>
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          {content.items.map((item) => {
            const assignedCategory = assignments[item.id]
            const catColors = assignedCategory
              ? categoryColors[assignedCategory] || colors
              : null

            return (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  assignedCategory
                    ? `${catColors?.bgLight} ${catColors?.border}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`${assignedCategory ? catColors?.text : 'text-gray-900'}`}>
                    {item.text}
                  </span>
                  {assignedCategory && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${catColors?.bg} text-white`}
                    >
                      {content.categories.find((c) => c.id === assignedCategory)?.label}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!allAssigned}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
