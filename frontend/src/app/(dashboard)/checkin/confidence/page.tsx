'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'

interface ConfidenceSource {
  key: string
  label: string
  description: string
}

interface LevelActions {
  label: string
  message: string
  actions: string[]
}

interface ConfidenceConfig {
  confidence_sources: ConfidenceSource[]
  doubt_sources: ConfidenceSource[]
  level_actions: Record<string, LevelActions>
}

interface UserMembership {
  organization_id: string
  organization_name: string
  role: string
}

interface FullUser {
  id: string
  email: string
  memberships: UserMembership[]
}

type Step = 'intro' | 'level' | 'sources' | 'actions' | 'commitment' | 'complete'

export default function ConfidenceCheckInPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [config, setConfig] = useState<ConfidenceConfig | null>(null)
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [confidenceLevel, setConfidenceLevel] = useState<number>(4)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [commitment, setCommitment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch config and user data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [configData, userData] = await Promise.all([
          apiGet<ConfidenceConfig>('/checkins/confidence/config'),
          apiGet<FullUser>('/users/me/full'),
        ])
        setConfig(configData)
        setFullUser(userData)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      loadData()
    }
  }, [user, authLoading])

  const getLevelCategory = (level: number): string => {
    if (level <= 2) return 'low'
    if (level <= 4) return 'moderate'
    if (level <= 6) return 'high'
    return 'peak'
  }

  const getLevelColor = (level: number): string => {
    if (level <= 2) return 'text-red-500'
    if (level <= 4) return 'text-amber-500'
    if (level <= 6) return 'text-blue-500'
    return 'text-green-500'
  }

  const getLevelBgColor = (level: number): string => {
    if (level <= 2) return 'bg-red-500'
    if (level <= 4) return 'bg-amber-500'
    if (level <= 6) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getSourcesForLevel = (): { sources: ConfidenceSource[], isDoubt: boolean } => {
    if (!config) return { sources: [], isDoubt: false }
    const category = getLevelCategory(confidenceLevel)
    if (category === 'low' || category === 'moderate') {
      return { sources: config.doubt_sources, isDoubt: true }
    }
    return { sources: config.confidence_sources, isDoubt: false }
  }

  const getCurrentLevelActions = (): LevelActions | null => {
    if (!config) return null
    const category = getLevelCategory(confidenceLevel)
    return config.level_actions[category] || null
  }

  const toggleSource = (key: string) => {
    setSelectedSources(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const handleSubmit = async () => {
    if (!fullUser?.memberships?.[0]) return
    setIsSubmitting(true)
    setError(null)

    try {
      const { isDoubt } = getSourcesForLevel()

      const payload = {
        organization_id: fullUser.memberships[0].organization_id,
        confidence_level: confidenceLevel,
        confidence_sources: isDoubt ? [] : selectedSources,
        doubt_sources: isDoubt ? selectedSources : [],
        confidence_commitment: commitment || null,
        selected_action: selectedAction || null,
      }

      await apiPost('/checkins/confidence', payload)
      setStep('complete')
    } catch (err) {
      setError('Failed to save your check-in. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isLoading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  // Step: Intro
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/checkin')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to check-ins
          </button>

          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Confidence Check-In
            </h1>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Understanding your confidence level helps you prepare mentally for challenges ahead.
              Let&apos;s see where you&apos;re at right now.
            </p>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
              <h3 className="font-medium text-gray-900 mb-3">What we&apos;ll explore:</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-medium">1</span>
                  Rate your current confidence level
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-medium">2</span>
                  Identify what&apos;s affecting your confidence
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-medium">3</span>
                  Get personalized strategies
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-medium">4</span>
                  Lock in your commitment
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep('level')}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
            >
              Let&apos;s Begin
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step: Rate Confidence Level
  if (step === 'level') {
    const levelActions = getCurrentLevelActions()

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('intro')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-amber-600 font-medium mb-2">Step 1 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Rate Your Confidence
            </h2>
            <p className="text-gray-600">
              How confident do you feel right now?
            </p>
          </div>

          {/* Confidence Scale */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="text-center mb-6">
              <span className={`text-6xl font-bold ${getLevelColor(confidenceLevel)}`}>
                {confidenceLevel}
              </span>
              <p className="text-gray-500 mt-2">out of 7</p>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="7"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    ${getLevelBgColor(confidenceLevel)} 0%,
                    ${getLevelBgColor(confidenceLevel)} ${((confidenceLevel - 1) / 6) * 100}%,
                    #e5e7eb ${((confidenceLevel - 1) / 6) * 100}%,
                    #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
              </div>
            </div>

            {/* Level Label */}
            {levelActions && (
              <div className={`text-center p-4 rounded-lg ${getLevelColor(confidenceLevel)} bg-opacity-10`}
                style={{ backgroundColor: `${getLevelBgColor(confidenceLevel)}15` }}>
                <p className={`font-semibold ${getLevelColor(confidenceLevel)}`}>
                  {levelActions.label}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {levelActions.message}
                </p>
              </div>
            )}
          </div>

          {/* Scale Reference */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-500 text-center mb-3">Scale Reference</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-gray-600">1-2: Low confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-gray-600">3-4: Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">5-6: High confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">7: Peak confidence</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('sources')}
            className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step: Select Sources
  if (step === 'sources') {
    const { sources, isDoubt } = getSourcesForLevel()

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('level')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-amber-600 font-medium mb-2">Step 2 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isDoubt ? "What's Holding You Back?" : "What's Building Your Confidence?"}
            </h2>
            <p className="text-gray-600">
              {isDoubt
                ? "Select any sources of doubt you're experiencing"
                : "Select what's contributing to your confidence"}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {sources.map((source) => (
              <button
                key={source.key}
                onClick={() => toggleSource(source.key)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedSources.includes(source.key)
                    ? isDoubt
                      ? 'border-red-500 bg-red-50'
                      : 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{source.label}</p>
                    <p className="text-sm text-gray-500">{source.description}</p>
                  </div>
                  {selectedSources.includes(source.key) && (
                    <svg className={`w-6 h-6 ${isDoubt ? 'text-red-500' : 'text-amber-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('actions')}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => setStep('actions')}
              className="flex-1 bg-amber-600 text-white py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step: Actions
  if (step === 'actions') {
    const levelActions = getCurrentLevelActions()

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('sources')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-amber-600 font-medium mb-2">Step 3 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Suggested Actions
            </h2>
            <p className="text-gray-600">
              Based on your confidence level, here are some strategies
            </p>
          </div>

          {levelActions && (
            <>
              <div className={`p-4 rounded-xl mb-6 ${getLevelColor(confidenceLevel)}`}
                style={{ backgroundColor: `${getLevelBgColor(confidenceLevel)}15` }}>
                <p className="font-medium">{levelActions.label}</p>
                <p className="text-sm opacity-75 mt-1">{levelActions.message}</p>
              </div>

              <div className="space-y-3 mb-8">
                {levelActions.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAction(action)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedAction === action
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900">{action}</p>
                      {selectedAction === action && (
                        <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('commitment')}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => setStep('commitment')}
              className="flex-1 bg-amber-600 text-white py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step: Commitment
  if (step === 'commitment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('actions')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-amber-600 font-medium mb-2">Step 4 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Lock It In
            </h2>
            <p className="text-gray-600">
              Write a brief commitment to yourself (optional)
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            {selectedAction && (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600 font-medium mb-1">Your chosen action:</p>
                <p className="text-gray-900">{selectedAction}</p>
              </div>
            )}

            <label className="block text-gray-700 font-medium mb-2">
              Your Commitment
            </label>
            <textarea
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder="e.g., 'I will trust my preparation and stay present during today's practice.'"
              className="w-full p-4 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-right text-sm text-gray-400 mt-1">
              {commitment.length}/500
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Complete Check-In'}
          </button>
        </div>
      </div>
    )
  }

  // Step: Complete
  if (step === 'complete') {
    const levelActions = getCurrentLevelActions()

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check-In Complete!
            </h2>
            <p className="text-gray-600 mb-8">
              Great job taking time to assess your confidence
            </p>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Check-In Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confidence Level</span>
                  <span className={`font-bold text-lg ${getLevelColor(confidenceLevel)}`}>
                    {confidenceLevel}/7
                  </span>
                </div>

                {levelActions && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">State</span>
                    <span className="font-medium text-gray-900">{levelActions.label}</span>
                  </div>
                )}

                {selectedAction && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">Your action:</p>
                    <p className="text-gray-900">{selectedAction}</p>
                  </div>
                )}

                {commitment && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">Your commitment:</p>
                    <p className="text-gray-900 italic">&quot;{commitment}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/athlete')}
                className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium hover:bg-amber-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => router.push('/checkin')}
                className="w-full bg-white text-gray-700 py-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Do Another Check-In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
