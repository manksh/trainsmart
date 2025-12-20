'use client'

interface ScreenHeaderProps {
  currentScreen: number
  totalScreens: number
  onBack: () => void
  onExit: () => void
  activityName: string
  moduleColor: string
}

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-600',
  purple: 'bg-purple-600',
  blue: 'bg-blue-600',
  amber: 'bg-amber-600',
}

export default function ScreenHeader({
  currentScreen,
  totalScreens,
  onBack,
  onExit,
  activityName,
  moduleColor,
}: ScreenHeaderProps) {
  const progressPercent = ((currentScreen + 1) / totalScreens) * 100
  const bgColor = colorClasses[moduleColor] || colorClasses.purple

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm font-medium text-gray-600 truncate max-w-[200px]">{activityName}</span>

          <button
            onClick={onExit}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Exit activity"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} rounded-full transition-all duration-300`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="text-xs text-gray-400 mt-1 text-center">
          {currentScreen + 1} of {totalScreens}
        </div>
      </div>
    </div>
  )
}
