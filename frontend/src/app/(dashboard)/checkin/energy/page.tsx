'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'

interface EnergyFactor {
  key: string
  label: string
  icon: string
}

interface StateActions {
  label: string
  message: string
  actions: string[]
}

interface EnergyConfig {
  physical_factors: EnergyFactor[]
  mental_factors: EnergyFactor[]
  state_actions: Record<string, StateActions>
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

type Step = 'intro' | 'physical' | 'mental' | 'physical_factors' | 'mental_factors' | 'actions' | 'complete'

export default function EnergyCheckInPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [config, setConfig] = useState<EnergyConfig | null>(null)
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [physicalEnergy, setPhysicalEnergy] = useState<number>(4)
  const [mentalEnergy, setMentalEnergy] = useState<number>(4)
  const [selectedPhysicalFactors, setSelectedPhysicalFactors] = useState<string[]>([])
  const [selectedMentalFactors, setSelectedMentalFactors] = useState<string[]>([])
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch config and user data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [configData, userData] = await Promise.all([
          apiGet<EnergyConfig>('/checkins/energy/config'),
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

  const getEnergyState = (physical: number, mental: number): string => {
    const pLow = physical <= 3
    const pHigh = physical >= 5
    const mLow = mental <= 3
    const mHigh = mental >= 5

    if (pLow && mLow) return 'low_low'
    if (pLow && mHigh) return 'low_high'
    if (pHigh && mLow) return 'high_low'
    if (pHigh && mHigh) return 'high_high'
    return 'moderate'
  }

  const getEnergyColor = (level: number): string => {
    if (level <= 2) return 'text-red-500'
    if (level <= 4) return 'text-amber-500'
    return 'text-green-500'
  }

  const getEnergyBgColor = (level: number): string => {
    if (level <= 2) return 'bg-red-500'
    if (level <= 4) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getEnergyLabel = (level: number): string => {
    if (level <= 2) return 'Low'
    if (level <= 4) return 'Moderate'
    if (level <= 6) return 'High'
    return 'Peak'
  }

  const getCurrentStateActions = (): StateActions | null => {
    if (!config) return null
    const state = getEnergyState(physicalEnergy, mentalEnergy)
    return config.state_actions[state] || null
  }

  const togglePhysicalFactor = (key: string) => {
    setSelectedPhysicalFactors(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const toggleMentalFactor = (key: string) => {
    setSelectedMentalFactors(prev =>
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
      const payload = {
        organization_id: fullUser.memberships[0].organization_id,
        physical_energy: physicalEnergy,
        mental_energy: mentalEnergy,
        physical_factors: selectedPhysicalFactors,
        mental_factors: selectedMentalFactors,
        selected_action: selectedAction || null,
      }

      await apiPost('/checkins/energy', payload)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Step: Intro
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Energy Check-In
            </h1>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Understanding your energy levels helps you train smarter and
              optimize your performance throughout the day.
            </p>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
              <h3 className="font-medium text-gray-900 mb-3">What we&apos;ll explore:</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">1</span>
                  Rate your physical energy
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">2</span>
                  Rate your mental energy
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">3</span>
                  Identify influencing factors
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">4</span>
                  Get personalized recommendations
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep('physical')}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Let&apos;s Begin
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step: Physical Energy
  if (step === 'physical') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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
            <p className="text-sm text-green-600 font-medium mb-2">Step 1 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Physical Energy
            </h2>
            <p className="text-gray-600">
              How does your body feel right now?
            </p>
          </div>

          {/* Energy Scale */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-4xl">🏃</span>
              <div className="text-center">
                <span className={`text-5xl font-bold ${getEnergyColor(physicalEnergy)}`}>
                  {physicalEnergy}
                </span>
                <p className="text-gray-500 mt-1">out of 7</p>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="7"
                value={physicalEnergy}
                onChange={(e) => setPhysicalEnergy(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    ${getEnergyBgColor(physicalEnergy)} 0%,
                    ${getEnergyBgColor(physicalEnergy)} ${((physicalEnergy - 1) / 6) * 100}%,
                    #e5e7eb ${((physicalEnergy - 1) / 6) * 100}%,
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
            <div className={`text-center p-4 rounded-lg ${getEnergyColor(physicalEnergy)}`}
              style={{ backgroundColor: `${getEnergyBgColor(physicalEnergy)}15` }}>
              <p className={`font-semibold ${getEnergyColor(physicalEnergy)}`}>
                {getEnergyLabel(physicalEnergy)} Physical Energy
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {physicalEnergy <= 3 && "Your body feels tired or depleted"}
                {physicalEnergy === 4 && "Your body feels okay, neutral"}
                {physicalEnergy >= 5 && physicalEnergy <= 6 && "Your body feels energized and ready"}
                {physicalEnergy === 7 && "Your body feels at peak performance level"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep('mental')}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step: Mental Energy
  if (step === 'mental') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('physical')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-green-600 font-medium mb-2">Step 2 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mental Energy
            </h2>
            <p className="text-gray-600">
              How does your mind feel right now?
            </p>
          </div>

          {/* Energy Scale */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-4xl">🧠</span>
              <div className="text-center">
                <span className={`text-5xl font-bold ${getEnergyColor(mentalEnergy)}`}>
                  {mentalEnergy}
                </span>
                <p className="text-gray-500 mt-1">out of 7</p>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="7"
                value={mentalEnergy}
                onChange={(e) => setMentalEnergy(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    ${getEnergyBgColor(mentalEnergy)} 0%,
                    ${getEnergyBgColor(mentalEnergy)} ${((mentalEnergy - 1) / 6) * 100}%,
                    #e5e7eb ${((mentalEnergy - 1) / 6) * 100}%,
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
            <div className={`text-center p-4 rounded-lg ${getEnergyColor(mentalEnergy)}`}
              style={{ backgroundColor: `${getEnergyBgColor(mentalEnergy)}15` }}>
              <p className={`font-semibold ${getEnergyColor(mentalEnergy)}`}>
                {getEnergyLabel(mentalEnergy)} Mental Energy
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {mentalEnergy <= 3 && "Your mind feels foggy or distracted"}
                {mentalEnergy === 4 && "Your mind feels okay, neutral"}
                {mentalEnergy >= 5 && mentalEnergy <= 6 && "Your mind feels sharp and focused"}
                {mentalEnergy === 7 && "Your mind feels crystal clear and locked in"}
              </p>
            </div>
          </div>

          {/* Energy Matrix Preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 text-center mb-3">Your Energy State</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl">🏃</p>
                <p className={`font-bold ${getEnergyColor(physicalEnergy)}`}>{physicalEnergy}</p>
                <p className="text-xs text-gray-500">Physical</p>
              </div>
              <div className="text-2xl text-gray-300">+</div>
              <div className="text-center">
                <p className="text-2xl">🧠</p>
                <p className={`font-bold ${getEnergyColor(mentalEnergy)}`}>{mentalEnergy}</p>
                <p className="text-xs text-gray-500">Mental</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('physical_factors')}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Step: Physical Factors
  if (step === 'physical_factors') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('mental')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-green-600 font-medium mb-2">Step 3 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Physical Factors
            </h2>
            <p className="text-gray-600">
              What&apos;s affecting your physical energy?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {config.physical_factors.map((factor) => (
              <button
                key={factor.key}
                onClick={() => togglePhysicalFactor(factor.key)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedPhysicalFactors.includes(factor.key)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">{factor.icon}</span>
                <p className="text-sm font-medium text-gray-900">{factor.label}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('mental_factors')}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => setStep('mental_factors')}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step: Mental Factors
  if (step === 'mental_factors') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('physical_factors')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-green-600 font-medium mb-2">Step 3 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mental Factors
            </h2>
            <p className="text-gray-600">
              What&apos;s affecting your mental energy?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {config.mental_factors.map((factor) => (
              <button
                key={factor.key}
                onClick={() => toggleMentalFactor(factor.key)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedMentalFactors.includes(factor.key)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">{factor.icon}</span>
                <p className="text-sm font-medium text-gray-900">{factor.label}</p>
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
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
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
    const stateActions = getCurrentStateActions()

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('mental_factors')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <p className="text-sm text-green-600 font-medium mb-2">Step 4 of 4</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Recommendations
            </h2>
            <p className="text-gray-600">
              Based on your energy levels, here&apos;s what we suggest
            </p>
          </div>

          {stateActions && (
            <>
              {/* Energy State Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-2xl">🏃</p>
                    <p className={`text-xl font-bold ${getEnergyColor(physicalEnergy)}`}>{physicalEnergy}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl">🧠</p>
                    <p className={`text-xl font-bold ${getEnergyColor(mentalEnergy)}`}>{mentalEnergy}</p>
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="font-semibold text-green-700">{stateActions.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{stateActions.message}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {stateActions.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAction(action)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedAction === action
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900">{action}</p>
                      {selectedAction === action && (
                        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Complete Check-In'}
          </button>
        </div>
      </div>
    )
  }

  // Step: Complete
  if (step === 'complete') {
    const stateActions = getCurrentStateActions()

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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
              Great job tracking your energy levels
            </p>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Check-In Summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span>🏃</span> Physical Energy
                  </span>
                  <span className={`font-bold text-lg ${getEnergyColor(physicalEnergy)}`}>
                    {physicalEnergy}/7
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span>🧠</span> Mental Energy
                  </span>
                  <span className={`font-bold text-lg ${getEnergyColor(mentalEnergy)}`}>
                    {mentalEnergy}/7
                  </span>
                </div>

                {stateActions && (
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-gray-600">State</span>
                    <span className="font-medium text-gray-900">{stateActions.label}</span>
                  </div>
                )}

                {selectedAction && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">Your action:</p>
                    <p className="text-gray-900">{selectedAction}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/athlete')}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
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
