'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'

interface JournalConfig {
  journal_types: Array<{
    key: string
    label: string
    description: string
    icon: string
  }>
}

// Icons
const icons: Record<string, React.ReactNode> = {
  sparkles: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  trophy: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  heart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  pencil: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
}

const typeColors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  affirmations: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:bg-amber-100' },
  daily_wins: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-100' },
  gratitude: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', hover: 'hover:bg-pink-100' },
  open_ended: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
  i_know: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
}

export default function JournalingPage() {
  const router = useRouter()
  const [config, setConfig] = useState<JournalConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await apiGet<JournalConfig>('/journals/config')
        setConfig(data)
      } catch (err) {
        console.error('Failed to load journal config:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleTypeSelect = (type: string) => {
    router.push(`/tools/journaling/${type}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/athlete')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Journaling</h1>
        </div>
        <p className="text-gray-500 mb-8 ml-12">
          Choose a journaling practice to reflect, grow, and build mental strength.
        </p>

        {/* Journal Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config?.journal_types.map((type) => {
            const colors = typeColors[type.key] || typeColors.open_ended
            return (
              <button
                key={type.key}
                onClick={() => handleTypeSelect(type.key)}
                className={`${colors.bg} ${colors.border} ${colors.hover} border-2 rounded-2xl p-6 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className={`${colors.text} mb-4`}>
                  {icons[type.icon]}
                </div>
                <h3 className={`text-lg font-semibold ${colors.text} mb-1`}>
                  {type.label}
                </h3>
                <p className="text-gray-600 text-sm">
                  {type.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Tip */}
        <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex gap-3">
            <div className="text-purple-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Tip:</span> Start with Affirmations or Gratitude for a quick 2-minute practice, or try Free Write when you need to process deeper thoughts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
