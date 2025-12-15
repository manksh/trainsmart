'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Question {
  id: number
  text: string
  pillar: string
  secondary_pillar: string | null
  is_reverse: boolean
  category: string | null
}

interface Assessment {
  id: string
  name: string
  description: string
  questions: Question[]
  pillar_config: any
}

interface UserMembership {
  organization_id: string
  organization_name: string
  role: string
}

const LIKERT_OPTIONS = [
  { value: 1, label: '1', description: 'Strongly Disagree' },
  { value: 2, label: '2', description: 'Disagree' },
  { value: 3, label: '3', description: 'Somewhat Disagree' },
  { value: 4, label: '4', description: 'Neutral' },
  { value: 5, label: '5', description: 'Somewhat Agree' },
  { value: 6, label: '6', description: 'Agree' },
  { value: 7, label: '7', description: 'Strongly Agree' },
]

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function AssessmentFormPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const { user, isLoading: isAuthLoading } = useAuth()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load assessment
        const assessmentData = await apiGet<Assessment>(`/assessments/${assessmentId}`)
        // Shuffle the questions to prevent bias
        const shuffledAssessment = {
          ...assessmentData,
          questions: shuffleArray(assessmentData.questions),
        }
        setAssessment(shuffledAssessment)

        // Get user's organization
        const fullUser = await apiGet<{ memberships: UserMembership[] }>('/users/me/full')
        const membership = fullUser.memberships?.[0]
        if (membership) {
          setOrganizationId(membership.organization_id)
        }
      } catch (err) {
        console.error('Failed to load assessment:', err)
        router.push('/assessment')
      } finally {
        setIsLoading(false)
      }
    }

    if (!isAuthLoading && user) {
      loadData()
    }
  }, [assessmentId, user, isAuthLoading, router])

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (!assessment || !organizationId) return

    setIsSubmitting(true)
    try {
      const submission = {
        assessment_id: assessmentId,
        organization_id: organizationId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          question_id: parseInt(questionId),
          value,
        })),
      }

      await apiPost('/assessments/submit', submission)
      router.push('/results')
    } catch (err: any) {
      console.error('Failed to submit assessment:', err)
      alert(err.data?.detail || 'Failed to submit assessment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Assessment not found</p>
      </div>
    )
  }

  const currentQuestion = assessment.questions[currentIndex]
  const totalQuestions = assessment.questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const answeredCount = Object.keys(answers).length
  const isCurrentAnswered = answers[currentQuestion.id] !== undefined
  const isLastQuestion = currentIndex === totalQuestions - 1
  const canSubmit = answeredCount === totalQuestions

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with progress */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to leave? Your progress will be lost.')) {
                  router.push('/assessment')
                }
              }}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </button>
            <span className="text-sm text-gray-500">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Question text */}
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-8">
              {currentQuestion.text}
            </h2>

            {/* Likert scale */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500 px-2">
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {LIKERT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    className={`
                      aspect-square rounded-lg border-2 font-medium text-lg
                      transition-all duration-200 hover:border-primary-400
                      ${answers[currentQuestion.id] === option.value
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <span className="text-xs text-gray-400">
                  {answers[currentQuestion.id] !== undefined &&
                    LIKERT_OPTIONS.find((o) => o.value === answers[currentQuestion.id])?.description}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              {answeredCount} / {totalQuestions} answered
            </span>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isCurrentAnswered}
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Question navigation dots */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-1">
            {assessment.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  w-3 h-3 rounded-full transition-all
                  ${idx === currentIndex
                    ? 'bg-primary-600 ring-2 ring-primary-200'
                    : answers[q.id] !== undefined
                      ? 'bg-primary-400'
                      : 'bg-gray-300'
                  }
                `}
                title={`Question ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
