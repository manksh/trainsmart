'use client'

import { useState } from 'react'
import { SwipeCardContent, ScreenComponentProps } from '../types'

interface SwipeCardProps extends ScreenComponentProps {
  content: SwipeCardContent
}

export default function SwipeCard({ content, onContinue, moduleColor }: SwipeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const colorClasses: Record<string, { bg: string; bgLight: string; text: string; gradient: string }> = {
    emerald: { bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-600' },
    purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
    blue: { bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    amber: { bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-600', gradient: 'from-amber-500 to-amber-600' },
  }

  const colors = colorClasses[moduleColor] || colorClasses.purple

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true)
    }
  }

  const canContinue = !content.follow_up || isFlipped

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {/* Main content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {content.title && (
            <h2 className={`text-lg font-semibold ${colors.text}`}>{content.title}</h2>
          )}

          <p className="text-xl text-gray-900 leading-relaxed">{content.body}</p>

          {content.subtext && (
            <p className="text-gray-500 text-sm italic">{content.subtext}</p>
          )}
        </div>

        {/* Flip card for follow_up content */}
        {content.follow_up && (
          <div
            className="flip-card-container"
            style={{ perspective: '1000px' }}
          >
            <div
              onClick={handleFlip}
              className={`flip-card relative w-full cursor-pointer ${
                isFlipped ? '' : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '80px',
              }}
            >
              {/* Front of card - Tap to reveal */}
              <div
                className={`flip-card-front absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br ${colors.gradient} shadow-lg flex items-center justify-center`}
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <div className="flex items-center justify-center gap-3 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span className="font-medium">Tap to reveal more</span>
                </div>
              </div>

              {/* Back of card - Follow up content */}
              <div
                className={`flip-card-back w-full rounded-2xl p-6 ${colors.bgLight} border-2 border-gray-100`}
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <p className="text-gray-800 leading-relaxed">{content.follow_up}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl transition-all ${
            canContinue ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
