'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface EmotionConfig {
  key: string
  display_name: string
  category: string
  signals: string[]
  actions: string[]
}

interface BodyArea {
  key: string
  display_name: string
}

interface EmotionsConfigResponse {
  emotions: EmotionConfig[]
  body_areas: BodyArea[]
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

type Step =
  | 'education'
  | 'intro'
  | 'emotion'
  | 'signal'
  | 'intensity'
  | 'body'
  | 'action'
  | 'commit'
  | 'complete'

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  calm: '😌',
  confident: '💪',
  grateful: '🙏',
  nervous: '😰',
  stressed: '😫',
  angry: '😠',
  sad: '😢',
  tired: '😴',
  bored: '😐',
  indifferent: '😶',
  fearful: '😨',
  disgusted: '🤢',
}

const INTENSITY_LABELS = [
  { value: 1, label: 'Barely feeling it' },
  { value: 2, label: 'A little bit' },
  { value: 3, label: 'Moderately' },
  { value: 4, label: 'Quite a bit' },
  { value: 5, label: 'Very strongly' },
]

const EDUCATION_STORAGE_KEY = 'trainsmart_mood_checkin_education_seen'

export default function MoodCheckInPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [emotionsConfig, setEmotionsConfig] = useState<EmotionsConfigResponse | null>(null)
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSeenEducation, setHasSeenEducation] = useState(true) // Default to true, will check localStorage

  // Form state
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null)
  const [intensity, setIntensity] = useState<number>(3)
  const [selectedBodyAreas, setSelectedBodyAreas] = useState<string[]>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  useEffect(() => {
    // Check if user has seen education screen
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(EDUCATION_STORAGE_KEY)
      if (!seen) {
        setHasSeenEducation(false)
        setStep('education')
      }
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [config, userData] = await Promise.all([
          apiGet<EmotionsConfigResponse>('/checkins/emotions'),
          apiGet<FullUser>('/users/me/full'),
        ])
        setEmotionsConfig(config)
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

  const handleEducationComplete = () => {
    localStorage.setItem(EDUCATION_STORAGE_KEY, 'true')
    setHasSeenEducation(true)
    setStep('intro')
  }

  const handleSubmit = async () => {
    if (!selectedEmotion || !fullUser?.memberships?.[0]) return

    setIsSubmitting(true)
    try {
      await apiPost('/checkins/', {
        organization_id: fullUser.memberships[0].organization_id,
        check_in_type: 'mood',
        emotion: selectedEmotion,
        intensity,
        body_areas: selectedBodyAreas.length > 0 ? selectedBodyAreas : ['not_sure'],
        signal_resonated: selectedSignal,
        selected_action: selectedAction,
      })
      setStep('complete')
    } catch (err) {
      console.error('Failed to submit check-in:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedEmotionConfig = emotionsConfig?.emotions.find(e => e.key === selectedEmotion)

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back to selection button */}
        {step !== 'complete' && (
          <button
            onClick={() => router.push('/checkin')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to check-ins
          </button>
        )}

        {/* Progress indicator */}
        {step !== 'intro' && step !== 'complete' && step !== 'education' && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {['emotion', 'signal', 'intensity', 'body', 'action', 'commit'].map((s, i) => (
                <div
                  key={s}
                  className={`w-8 h-2 rounded-full ${
                    ['emotion', 'signal', 'intensity', 'body', 'action', 'commit'].indexOf(step) >= i
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step: Education (First-time only) */}
        {step === 'education' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Understanding Your Emotions
              </h1>
              <p className="text-gray-600 text-sm">
                Before your first check-in, let's learn about emotional awareness
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {/* What are emotions */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">💭</span> What are emotions?
                </h3>
                <p className="text-gray-600 text-sm">
                  Emotions are signals from your body and mind. They tell you important information
                  about what's happening around you and inside you. There are no "bad" emotions -
                  they all serve a purpose!
                </p>
              </div>

              {/* Body awareness */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">🧘</span> Body awareness
                </h3>
                <p className="text-gray-600 text-sm">
                  Emotions show up in your body too! You might feel butterflies in your stomach
                  when nervous, or tension in your shoulders when stressed. Noticing where you
                  feel emotions helps you understand them better.
                </p>
              </div>

              {/* Taking action */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚡</span> Taking action
                </h3>
                <p className="text-gray-600 text-sm">
                  Once you recognize an emotion, you can choose how to respond. We'll suggest
                  helpful actions based on how you're feeling. These small steps can make a
                  big difference in your mental performance!
                </p>
              </div>

              {/* Why check in */}
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">📈</span> Why check in daily?
                </h3>
                <p className="text-gray-600 text-sm">
                  Regular check-ins build self-awareness over time. You'll start to notice
                  patterns, understand your triggers, and develop better emotional regulation -
                  key skills for peak athletic performance.
                </p>
              </div>
            </div>

            <Button onClick={handleEducationComplete} className="w-full">
              Got it, let's start!
            </Button>
          </div>
        )}

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mood Check-In
            </h1>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Take a moment to notice how you're feeling right now.
              This helps build self-awareness and emotional intelligence.
            </p>
            <Button onClick={() => setStep('emotion')} className="px-8">
              Let's Begin
            </Button>
          </div>
        )}

        {/* Step: Emotion Selection */}
        {step === 'emotion' && emotionsConfig && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              How are you feeling?
            </h2>
            <p className="text-gray-500 mb-6 text-center text-sm">
              Select the emotion that best describes how you feel right now
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {emotionsConfig.emotions.map((emotion) => (
                <button
                  key={emotion.key}
                  onClick={() => setSelectedEmotion(emotion.key)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedEmotion === emotion.key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{EMOTION_EMOJIS[emotion.key]}</div>
                  <div className="text-sm font-medium text-gray-700">
                    {emotion.display_name}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('signal')}
                disabled={!selectedEmotion}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Signal Recognition */}
        {step === 'signal' && selectedEmotionConfig && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{EMOTION_EMOJIS[selectedEmotion!]}</div>
              <h2 className="text-xl font-semibold text-gray-900">
                You're feeling {selectedEmotionConfig.display_name}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Here are some signals you might notice
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {selectedEmotionConfig.signals.map((signal) => (
                <button
                  key={signal}
                  onClick={() => setSelectedSignal(signal)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedSignal === signal
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedSignal === signal ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedSignal === signal && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700">{signal}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('emotion')} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep('intensity')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Intensity */}
        {step === 'intensity' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">{EMOTION_EMOJIS[selectedEmotion!]}</div>
              <h2 className="text-xl font-semibold text-gray-900">
                How intense is this feeling?
              </h2>
            </div>

            <div className="mb-8">
              <div className="flex justify-between mb-4">
                {INTENSITY_LABELS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setIntensity(item.value)}
                    className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                      intensity === item.value
                        ? 'bg-blue-600 text-white scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item.value}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <span className="text-gray-600 font-medium">
                  {INTENSITY_LABELS.find(i => i.value === intensity)?.label}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('signal')} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep('body')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Body Check */}
        {step === 'body' && emotionsConfig && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Where do you feel it in your body?
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Select all that apply
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {emotionsConfig.body_areas.map((area) => (
                <button
                  key={area.key}
                  onClick={() => {
                    if (selectedBodyAreas.includes(area.key)) {
                      setSelectedBodyAreas(selectedBodyAreas.filter(a => a !== area.key))
                    } else {
                      setSelectedBodyAreas([...selectedBodyAreas, area.key])
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedBodyAreas.includes(area.key)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedBodyAreas.includes(area.key) ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedBodyAreas.includes(area.key) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium">{area.display_name}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('intensity')} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep('action')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Action Selection */}
        {step === 'action' && selectedEmotionConfig && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Choose an action
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                What would help you right now?
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {selectedEmotionConfig.actions.map((action) => (
                <button
                  key={action}
                  onClick={() => setSelectedAction(action)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAction === action
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAction === action ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedAction === action && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700">{action}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('body')} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep('commit')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Commitment */}
        {step === 'commit' && selectedEmotionConfig && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{EMOTION_EMOJIS[selectedEmotion!]}</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to commit?
              </h2>
              <p className="text-gray-500 text-sm">
                Here's your check-in summary
              </p>
            </div>

            <div className="bg-white rounded-xl shadow p-6 mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Feeling</span>
                <span className="font-medium text-gray-900">
                  {selectedEmotionConfig.display_name} ({intensity}/5)
                </span>
              </div>
              {selectedSignal && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-500">Signal</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">
                    {selectedSignal}
                  </span>
                </div>
              )}
              {selectedBodyAreas.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-500">Body</span>
                  <span className="font-medium text-gray-900 text-right">
                    {selectedBodyAreas.map(a =>
                      emotionsConfig?.body_areas.find(b => b.key === a)?.display_name
                    ).join(', ')}
                  </span>
                </div>
              )}
              {selectedAction && (
                <div className="pt-4 border-t">
                  <span className="text-gray-500 block mb-2">Your commitment:</span>
                  <span className="font-medium text-blue-600">{selectedAction}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('action')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Complete Check-in'}
              </Button>
            </div>
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
              Great job!
            </h1>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              You've completed your mood check-in. Keep building that self-awareness!
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
