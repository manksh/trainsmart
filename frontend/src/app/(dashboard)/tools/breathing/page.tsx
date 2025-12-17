'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface BreathingTiming {
  inhale: number
  hold_in: number
  exhale: number
  hold_out: number
  second_inhale?: number
}

interface BreathingExercise {
  key: string
  display_name: string
  technique: string
  description: string
  triggers: string[]
  timing: BreathingTiming
  cycles: number
  instructions: string[]
  category: string
}

interface BreathingConfigResponse {
  exercises: BreathingExercise[]
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

type Step = 'intro' | 'select' | 'trigger' | 'prepare' | 'exercise' | 'rating' | 'complete'

type BreathPhase = 'inhale' | 'hold_in' | 'second_inhale' | 'exhale' | 'hold_out' | 'rest'

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe In',
  hold_in: 'Hold',
  second_inhale: 'Quick Inhale',
  exhale: 'Breathe Out',
  hold_out: 'Hold',
  rest: 'Rest',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  activation: { bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-400' },
  calming: { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-400' },
  focus: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-400' },
}

const EDUCATION_STORAGE_KEY = 'trainsmart_breathing_education_seen'

export default function BreathingCheckInPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [exercisesConfig, setExercisesConfig] = useState<BreathingConfigResponse | null>(null)
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null)
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [currentCycle, setCurrentCycle] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [effectivenessRating, setEffectivenessRating] = useState<number>(3)

  // Exercise state
  const [isExerciseRunning, setIsExerciseRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('rest')
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0)
  const [animationScale, setAnimationScale] = useState(1)
  const startTimeRef = useRef<number>(0)
  const shouldStopRef = useRef<boolean>(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [config, userData] = await Promise.all([
          apiGet<BreathingConfigResponse>('/checkins/breathing/exercises'),
          apiGet<FullUser>('/users/me/full'),
        ])
        setExercisesConfig(config)
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

  // Exercise timer logic
  const runExercise = useCallback(async () => {
    if (!selectedExercise) return

    shouldStopRef.current = false
    setIsExerciseRunning(true)
    startTimeRef.current = Date.now()
    const timing = selectedExercise.timing
    const totalCycles = selectedExercise.cycles

    for (let cycle = 1; cycle <= totalCycles; cycle++) {
      if (shouldStopRef.current) break
      setCurrentCycle(cycle)

      // Determine phases based on exercise type
      const phases: { phase: BreathPhase; duration: number }[] = []

      if (timing.inhale > 0) phases.push({ phase: 'inhale', duration: timing.inhale })
      if (timing.second_inhale && timing.second_inhale > 0) {
        phases.push({ phase: 'second_inhale', duration: timing.second_inhale })
      }
      if (timing.hold_in > 0) phases.push({ phase: 'hold_in', duration: timing.hold_in })
      if (timing.exhale > 0) phases.push({ phase: 'exhale', duration: timing.exhale })
      if (timing.hold_out > 0) phases.push({ phase: 'hold_out', duration: timing.hold_out })

      for (const { phase, duration } of phases) {
        if (shouldStopRef.current) break
        setCurrentPhase(phase)
        setPhaseTimeLeft(duration)

        // Run phase timer
        for (let t = duration; t > 0; t--) {
          if (shouldStopRef.current) break
          setPhaseTimeLeft(t)

          // Interpolate scale based on phase
          const progress = (duration - t) / duration
          if (phase === 'inhale' || phase === 'second_inhale') {
            setAnimationScale(1 + (0.5 * progress))
          } else if (phase === 'exhale') {
            setAnimationScale(1.5 - (0.5 * progress))
          }

          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (!shouldStopRef.current) {
        setCyclesCompleted(cycle)
      }
    }

    // Calculate total duration
    const endTime = Date.now()
    setTotalDuration(Math.round((endTime - startTimeRef.current) / 1000))
    setIsExerciseRunning(false)
    setCurrentPhase('rest')

    if (!shouldStopRef.current) {
      setStep('rating')
    }
  }, [selectedExercise])

  const handleStartExercise = () => {
    setStep('exercise')
    setCyclesCompleted(0)
    setCurrentCycle(0)
    setAnimationScale(1)
    // Start exercise after a brief delay
    setTimeout(() => {
      runExercise()
    }, 500)
  }

  const handleSkipExercise = () => {
    shouldStopRef.current = true
    setCyclesCompleted(currentCycle > 0 ? currentCycle : 1)
    setTotalDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
    setStep('rating')
  }

  const handleSubmit = async () => {
    if (!selectedExercise || !fullUser?.memberships?.[0]) return

    setIsSubmitting(true)
    try {
      await apiPost('/checkins/breathing', {
        organization_id: fullUser.memberships[0].organization_id,
        breathing_exercise_type: selectedExercise.key,
        cycles_completed: cyclesCompleted,
        duration_seconds: totalDuration,
        trigger_selected: selectedTrigger,
        effectiveness_rating: effectivenessRating,
      })
      setStep('complete')
    } catch (err) {
      console.error('Failed to submit check-in:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  const categoryColor = selectedExercise ? CATEGORY_COLORS[selectedExercise.category] || CATEGORY_COLORS.calming : CATEGORY_COLORS.calming

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back button */}
        {step !== 'exercise' && step !== 'complete' && (
          <button
            onClick={() => router.push('/athlete')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </button>
        )}

        {/* Progress indicator */}
        {step !== 'intro' && step !== 'complete' && step !== 'exercise' && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {['select', 'trigger', 'prepare', 'rating'].map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full mx-1 ${
                    ['select', 'trigger', 'prepare', 'exercise', 'rating'].indexOf(step) >= i
                      ? 'bg-cyan-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Breathing Exercise
            </h1>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Take a moment to breathe. Choose an exercise that matches what you need right now.
            </p>
            <Button onClick={() => setStep('select')} className="px-8 bg-cyan-600 hover:bg-cyan-700">
              Let's Begin
            </Button>
          </div>
        )}

        {/* Step: Select Exercise */}
        {step === 'select' && exercisesConfig && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              What do you need right now?
            </h2>
            <p className="text-gray-500 mb-6 text-center text-sm">
              Choose the exercise that fits your current state
            </p>

            <div className="space-y-4 mb-8">
              {exercisesConfig.exercises.map((exercise) => {
                const colors = CATEGORY_COLORS[exercise.category] || CATEGORY_COLORS.calming
                return (
                  <button
                    key={exercise.key}
                    onClick={() => setSelectedExercise(exercise)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedExercise?.key === exercise.key
                        ? `border-cyan-600 ${colors.bg}`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${colors.bg} ${colors.text} p-2 rounded-lg`}>
                        {exercise.category === 'activation' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {exercise.category === 'calming' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {exercise.category === 'focus' && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{exercise.display_name}</h3>
                        <p className="text-sm text-gray-500">{exercise.technique}</p>
                        <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('trigger')}
                disabled={!selectedExercise}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Select Trigger */}
        {step === 'trigger' && selectedExercise && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className={`inline-block ${categoryColor.bg} ${categoryColor.text} px-4 py-2 rounded-full text-sm font-medium mb-2`}>
                {selectedExercise.display_name}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Why are you doing this exercise?
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Select what resonates with you (optional)
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {selectedExercise.triggers.map((trigger) => (
                <button
                  key={trigger}
                  onClick={() => setSelectedTrigger(trigger === selectedTrigger ? null : trigger)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTrigger === trigger
                      ? 'border-cyan-600 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedTrigger === trigger ? 'border-cyan-600 bg-cyan-600' : 'border-gray-300'
                    }`}>
                      {selectedTrigger === trigger && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700">{trigger}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep('prepare')} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Prepare */}
        {step === 'prepare' && selectedExercise && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className={`inline-block ${categoryColor.bg} ${categoryColor.text} px-4 py-2 rounded-full text-sm font-medium mb-2`}>
                {selectedExercise.display_name}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Get Ready
              </h2>
            </div>

            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">How it works:</h3>
              <ul className="space-y-3">
                {selectedExercise.instructions.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`${categoryColor.bg} ${categoryColor.text} w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cycles</span>
                <span className="font-medium text-gray-900">{selectedExercise.cycles}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Estimated time</span>
                <span className="font-medium text-gray-900">
                  {Math.ceil((selectedExercise.timing.inhale + selectedExercise.timing.hold_in + selectedExercise.timing.exhale + selectedExercise.timing.hold_out + (selectedExercise.timing.second_inhale || 0)) * selectedExercise.cycles / 60)} min
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('trigger')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStartExercise} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                Start Exercise
              </Button>
            </div>
          </div>
        )}

        {/* Step: Exercise */}
        {step === 'exercise' && selectedExercise && (
          <div className="animate-fadeIn min-h-[80vh] flex flex-col items-center justify-center">
            {/* Breathing circle */}
            <div className="relative mb-8">
              <div
                className={`w-48 h-48 rounded-full ${categoryColor.bg} flex items-center justify-center transition-transform duration-1000 ease-in-out`}
                style={{ transform: `scale(${animationScale})` }}
              >
                <div className={`w-40 h-40 rounded-full bg-white flex flex-col items-center justify-center`}>
                  <span className={`text-2xl font-bold ${categoryColor.text}`}>
                    {phaseTimeLeft}
                  </span>
                  <span className="text-gray-600 text-sm">
                    {PHASE_LABELS[currentPhase]}
                  </span>
                </div>
              </div>
            </div>

            {/* Cycle counter */}
            <div className="text-center mb-8">
              <p className="text-gray-600">
                Cycle {currentCycle} of {selectedExercise.cycles}
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: selectedExercise.cycles }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < cyclesCompleted ? 'bg-cyan-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkipExercise}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Skip to finish
            </button>
          </div>
        )}

        {/* Step: Rating */}
        {step === 'rating' && selectedExercise && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Exercise Complete!
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {cyclesCompleted} cycles completed in {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-4 text-center">
                How effective was this exercise?
              </h3>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setEffectivenessRating(value)}
                    className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                      effectivenessRating === value
                        ? 'bg-cyan-600 text-white scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                <span>Not helpful</span>
                <span>Very helpful</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? 'Saving...' : 'Complete Check-in'}
            </Button>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Great work!
            </h1>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              You've completed your breathing exercise. Notice how your body feels now compared to before.
            </p>
            <Button onClick={() => router.push('/athlete')} className="px-8">
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
