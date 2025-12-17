'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'

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

function AssessmentResults({ results }: { results: AssessmentResult }) {
  return (
    <div className="space-y-6">
      {/* Strengths and Growth Areas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Mental Skills Profile</h3>
          <RadarChart scores={results.pillar_scores} />
        </div>

        {/* All Scores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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

function NoAssessment({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Assessment Results Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Complete your mental performance assessment to see your results here.
        </p>
        <button
          onClick={onStart}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Start Assessment
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)
  const [results, setResults] = useState<AssessmentResult | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        const [userData, status] = await Promise.all([
          apiGet<FullUser>('/users/me/full'),
          apiGet<AssessmentStatus>('/assessments/me/status'),
        ])

        setFullUser(userData)
        setAssessmentStatus(status)

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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasCompletedAssessment = assessmentStatus?.has_completed || false

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {fullUser?.first_name?.[0]}{fullUser?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {fullUser?.first_name} {fullUser?.last_name}
            </h1>
            <p className="text-gray-500">
              {fullUser?.memberships?.[0]?.organization_name || 'Athlete'}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Results Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Results</h2>
        {hasCompletedAssessment && results ? (
          <AssessmentResults results={results} />
        ) : (
          <NoAssessment onStart={() => router.push('/assessment')} />
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{fullUser?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Organization</span>
            <span className="text-gray-900">
              {fullUser?.memberships?.[0]?.organization_name || 'None'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-900">
              {fullUser?.memberships?.[0]?.joined_at
                ? new Date(fullUser.memberships[0].joined_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
