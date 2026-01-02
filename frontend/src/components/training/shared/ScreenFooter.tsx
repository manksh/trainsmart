'use client'

interface ScreenFooterProps {
  onContinue: () => void
  disabled?: boolean
  loading?: boolean
  buttonText?: string
  moduleColor: string
}

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
  cyan: 'bg-cyan-600 hover:bg-cyan-700',
  rose: 'bg-rose-600 hover:bg-rose-700',
}

export default function ScreenFooter({
  onContinue,
  disabled = false,
  loading = false,
  buttonText = 'Continue',
  moduleColor,
}: ScreenFooterProps) {
  const bgColor = colorClasses[moduleColor] || colorClasses.purple

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <button
          onClick={onContinue}
          disabled={disabled || loading}
          className={`w-full ${bgColor} text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </div>
  )
}
