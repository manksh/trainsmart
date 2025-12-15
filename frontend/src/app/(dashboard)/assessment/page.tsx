'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiDelete } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Assessment {
  id: string
  name: string
  description: string
  sport: string | null
  question_count: number
  is_active: boolean
}

export default function AssessmentIntroPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleRedoAssessment = async () => {
    if (!confirm('Are you sure you want to redo the assessment? Your previous results will be deleted.')) {
      return
    }

    setIsResetting(true)
    try {
      await apiDelete('/assessments/me/reset')
      setHasCompleted(false)
    } catch (err) {
      console.error('Failed to reset assessment:', err)
      alert('Failed to reset assessment. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        // Check if user already completed
        const status = await apiGet<{ has_completed: boolean; response_id?: string }>('/assessments/me/status')
        if (status.has_completed) {
          setHasCompleted(true)
        }

        // Get available assessments
        const assessments = await apiGet<Assessment[]>('/assessments')
        if (assessments.length > 0) {
          setAssessment(assessments[0])
        }
      } catch (err) {
        console.error('Failed to load assessment:', err)
      } finally {
        setIsLoadingAssessment(false)
      }
    }

    if (!isLoading && user) {
      loadAssessment()
    }
  }, [user, isLoading])

  if (isLoading || isLoadingAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (hasCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Completed</h1>
            <p className="text-gray-600 mb-6">
              You've already completed your mental performance assessment. View your results to see your personalized profile.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/results')}>
                  View Results
                </Button>
                <Button variant="outline" onClick={() => router.push('/athlete')}>
                  Back to Dashboard
                </Button>
              </div>
              {/* Testing only - Redo button */}
              <div className="pt-4 border-t border-gray-200 w-full text-center">
                <p className="text-xs text-gray-400 mb-2">Testing Mode</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedoAssessment}
                  disabled={isResetting}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  {isResetting ? 'Resetting...' : 'Redo Assessment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">No assessment available at this time.</p>
          <Button className="mt-4" onClick={() => router.push('/athlete')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/athlete')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-12 text-white">
            <h1 className="text-3xl font-bold mb-2">{assessment.name}</h1>
            <p className="text-primary-100 text-lg">
              Discover your mental performance strengths and growth areas
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <p className="text-gray-600 text-lg mb-8">
              {assessment.description}
            </p>

            {/* What to expect */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">~10 minutes</p>
                    <p className="text-sm text-gray-500">Estimated time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{assessment.question_count} questions</p>
                    <p className="text-sm text-gray-500">Rate each 1-7</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Instant results</p>
                    <p className="text-sm text-gray-500">See your profile</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillars overview */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas We'll Measure</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Core Mental Skills</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>Mindfulness</li>
                    <li>Confidence</li>
                    <li>Motivation</li>
                    <li>Attentional Focus</li>
                    <li>Arousal Control</li>
                    <li>Resilience</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Supporting Dimensions</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>Knowledge</li>
                    <li>Self-Awareness</li>
                    <li>Wellness</li>
                    <li>Deliberate Practice</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-medium text-blue-900 mb-2">Tips for Best Results</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>Answer honestly - there are no right or wrong answers</li>
                <li>Go with your first instinct</li>
                <li>Answer based on how you typically are, not how you want to be</li>
                <li>Find a quiet place where you can focus</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => router.push(`/assessment/${assessment.id}`)}
                className="px-12"
              >
                Start Assessment
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
