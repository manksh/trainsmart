'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface UserMembership {
  organization_id: string
  organization_name: string
  role: string
  joined_at: string
}

interface FullUser {
  id: string
  email: string
  first_name: string
  last_name: string
  is_superadmin: boolean
  memberships: UserMembership[]
}

interface AssessmentStatus {
  has_completed: boolean
  response_id: string | null
  completed_at: string | null
}

interface AssessmentResult {
  id: string
  pillar_scores: Record<string, number>
  meta_scores: Record<string, number> | null
  strengths: string[]
  growth_areas: string[]
  completed_at: string
}

const PILLAR_DISPLAY_NAMES: Record<string, string> = {
  mindfulness: 'Mindfulness',
  confidence: 'Confidence',
  motivation: 'Motivation',
  attentional_focus: 'Attentional Focus',
  arousal_control: 'Arousal Control',
  resilience: 'Resilience',
}

const CORE_PILLARS = ['mindfulness', 'confidence', 'motivation', 'attentional_focus', 'arousal_control', 'resilience']

type TabType = 'dashboard' | 'checkins'

function ScoreBar({ score, maxScore = 7 }: { score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100
  let colorClass = 'bg-yellow-500'
  if (percentage >= 70) colorClass = 'bg-green-500'
  else if (percentage < 50) colorClass = 'bg-orange-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 w-10 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const pillars = CORE_PILLARS
  const centerX = 120
  const centerY = 120
  const maxRadius = 80

  const backgroundPoints = pillars.map((_, i) => {
    const angle = (i * 360) / pillars.length - 90
    const rad = (angle * Math.PI) / 180
    return {
      x: centerX + maxRadius * Math.cos(rad),
      y: centerY + maxRadius * Math.sin(rad),
    }
  })

  const scorePoints = pillars.map((pillar, i) => {
    const score = scores[pillar] || 0
    const radius = (score / 7) * maxRadius
    const angle = (i * 360) / pillars.length - 90
    const rad = (angle * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    }
  })

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={backgroundPoints.map((p) => {
            const x = centerX + (p.x - centerX) * scale
            const y = centerY + (p.y - centerY) * scale
            return `${x},${y}`
          }).join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      {backgroundPoints.map((point, i) => (
        <line
          key={i}
          x1={centerX}
          y1={centerY}
          x2={point.x}
          y2={point.y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={scorePoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3b82f6"
        strokeWidth="2"
      />
      {scorePoints.map((point, i) => (
        <circle key={i} cx={point.x} cy={point.y} r="3" fill="#3b82f6" />
      ))}
      {pillars.map((pillar, i) => {
        const angle = (i * 360) / pillars.length - 90
        const rad = (angle * Math.PI) / 180
        const labelRadius = maxRadius + 24
        const x = centerX + labelRadius * Math.cos(rad)
        const y = centerY + labelRadius * Math.sin(rad)
        return (
          <text
            key={pillar}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-gray-500"
          >
            {PILLAR_DISPLAY_NAMES[pillar]?.split(' ')[0]}
          </text>
        )
      })}
    </svg>
  )
}

function DashboardTab({
  results,
  hasCompletedAssessment,
  onStartAssessment
}: {
  results: AssessmentResult | null
  hasCompletedAssessment: boolean
  onStartAssessment: () => void
}) {
  if (!hasCompletedAssessment || !results) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Your Mental Performance Assessment
          </h2>
          <p className="text-gray-600 mb-6">
            Take a 10-minute assessment to discover your mental performance strengths
            and areas for growth.
          </p>
          <Button onClick={onStartAssessment} className="px-8">
            Start Assessment
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Strengths and Growth Areas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Your Strengths</h3>
          </div>
          <ul className="space-y-2">
            {results.strengths.map((strength) => (
              <li key={strength} className="flex items-center justify-between">
                <span className="text-gray-700">{PILLAR_DISPLAY_NAMES[strength]}</span>
                <span className="text-sm text-green-600 font-medium">
                  {(results.pillar_scores[strength] || 0).toFixed(1)}/7
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Growth Areas</h3>
          </div>
          <ul className="space-y-2">
            {results.growth_areas.map((area) => (
              <li key={area} className="flex items-center justify-between">
                <span className="text-gray-700">{PILLAR_DISPLAY_NAMES[area]}</span>
                <span className="text-sm text-orange-600 font-medium">
                  {(results.pillar_scores[area] || 0).toFixed(1)}/7
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Radar Chart and All Scores */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Mental Skills Profile</h3>
          <RadarChart scores={results.pillar_scores} />
        </div>

        {/* All Scores */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-900 mb-4">All Scores</h3>
          <div className="space-y-3">
            {CORE_PILLARS.map((pillar) => {
              const score = results.pillar_scores[pillar] || 0
              const isStrength = results.strengths.includes(pillar)
              const isGrowth = results.growth_areas.includes(pillar)
              return (
                <div key={pillar}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {PILLAR_DISPLAY_NAMES[pillar]}
                    </span>
                    {isStrength && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        Strength
                      </span>
                    )}
                    {isGrowth && (
                      <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                        Growth
                      </span>
                    )}
                  </div>
                  <ScoreBar score={score} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Assessment Info */}
      <div className="text-center text-sm text-gray-500">
        Assessment completed {new Date(results.completed_at).toLocaleDateString()}
      </div>
    </div>
  )
}

interface TodayCheckInStatus {
  has_checked_in_today: boolean
  check_in: CheckInRecord | null
}

interface CheckInRecord {
  id: string
  emotion: string
  intensity: number
  body_areas: string[]
  selected_action: string | null
  created_at: string
}

interface CheckInHistory {
  check_ins: CheckInRecord[]
  total: number
}

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

const EMOTION_NAMES: Record<string, string> = {
  happy: 'Happy',
  excited: 'Excited',
  calm: 'Calm',
  confident: 'Confident',
  grateful: 'Grateful',
  nervous: 'Nervous',
  stressed: 'Stressed',
  angry: 'Angry',
  sad: 'Sad',
  tired: 'Tired',
  bored: 'Bored',
  indifferent: 'Indifferent',
  fearful: 'Fearful',
  disgusted: 'Disgusted',
}

function CheckInsTab() {
  const router = useRouter()
  const [todayStatus, setTodayStatus] = useState<TodayCheckInStatus | null>(null)
  const [history, setHistory] = useState<CheckInHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCheckIns = async () => {
      try {
        const [status, historyData] = await Promise.all([
          apiGet<TodayCheckInStatus>('/checkins/me/today'),
          apiGet<CheckInHistory>('/checkins/me?page_size=7'),
        ])
        setTodayStatus(status)
        setHistory(historyData)
      } catch (err) {
        console.error('Failed to load check-ins:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadCheckIns()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Check-in Card */}
      <div className="bg-white rounded-lg shadow p-6">
        {todayStatus?.has_checked_in_today && todayStatus.check_in ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Today's Check-in Complete</h3>
                <p className="text-sm text-gray-500">
                  {new Date(todayStatus.check_in.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{EMOTION_EMOJIS[todayStatus.check_in.emotion]}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {EMOTION_NAMES[todayStatus.check_in.emotion]}
                  </p>
                  <p className="text-sm text-gray-500">
                    Intensity: {todayStatus.check_in.intensity}/5
                  </p>
                </div>
              </div>
              {todayStatus.check_in.selected_action && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-500">Your commitment:</p>
                  <p className="text-sm font-medium text-blue-600">{todayStatus.check_in.selected_action}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How are you feeling today?
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Take a moment to check in with yourself and build self-awareness.
            </p>
            <Button onClick={() => router.push('/checkin')}>
              Start Check-in
            </Button>
          </div>
        )}
      </div>

      {/* Recent Check-ins */}
      {history && history.check_ins.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Check-ins</h3>
          <div className="space-y-3">
            {history.check_ins.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{EMOTION_EMOJIS[checkIn.emotion]}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {EMOTION_NAMES[checkIn.emotion]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(checkIn.created_at).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= checkIn.intensity ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {history.total > 7 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all check-ins
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AthleteDashboard() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)
  const [results, setResults] = useState<AssessmentResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        // Load user data and assessment status in parallel
        const [userData, status] = await Promise.all([
          apiGet<FullUser>('/users/me/full'),
          apiGet<AssessmentStatus>('/assessments/me/status'),
        ])

        setFullUser(userData)
        setAssessmentStatus(status)

        // If assessment is completed, load results
        if (status.has_completed) {
          try {
            const resultsData = await apiGet<AssessmentResult>('/assessments/results/me/latest')
            setResults(resultsData)
          } catch (err) {
            console.error('Failed to load results:', err)
          }
        }
      } catch (err) {
        console.error('Failed to load user data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (!isLoading && user) {
      loadUserData()
    }
  }, [user, isLoading])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasCompletedAssessment = assessmentStatus?.has_completed || false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {fullUser?.first_name}!
            </h1>
            <p className="text-sm text-gray-500">
              {fullUser?.memberships?.[0]?.organization_name || 'Athlete Dashboard'}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('checkins')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'checkins'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Check-ins
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' ? (
          <DashboardTab
            results={results}
            hasCompletedAssessment={hasCompletedAssessment}
            onStartAssessment={() => router.push('/assessment')}
          />
        ) : (
          <CheckInsTab />
        )}
      </main>
    </div>
  )
}
