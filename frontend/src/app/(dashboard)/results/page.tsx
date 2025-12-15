'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface AssessmentResult {
  id: string
  assessment_id: string
  user_id: string
  organization_id: string
  pillar_scores: Record<string, number>
  meta_scores: Record<string, number> | null
  strengths: string[]
  growth_areas: string[]
  is_complete: boolean
  completed_at: string
  created_at: string
}

const PILLAR_DISPLAY_NAMES: Record<string, string> = {
  mindfulness: 'Mindfulness',
  confidence: 'Confidence',
  motivation: 'Motivation',
  attentional_focus: 'Attentional Focus',
  arousal_control: 'Arousal Control',
  resilience: 'Resilience',
  knowledge: 'Knowledge',
  self_awareness: 'Self-Awareness',
  wellness: 'Wellness',
  deliberate_practice: 'Deliberate Practice',
}

const PILLAR_DESCRIPTIONS: Record<string, string> = {
  mindfulness: 'Noticing thoughts and feelings without reactivity',
  confidence: 'Self-belief in your skills and ability to achieve goals',
  motivation: 'Drive, persistence, and commitment to improvement',
  attentional_focus: 'Concentration and focus under pressure',
  arousal_control: 'Managing energy levels - staying calm or getting energized',
  resilience: 'Bouncing back from setbacks and adversity',
  knowledge: 'Understanding mental processes and performance psychology',
  self_awareness: 'Recognizing patterns in your thoughts and behaviors',
  wellness: 'Maintaining healthy lifestyle habits',
  deliberate_practice: 'Quality and intentionality of training',
}

const CORE_PILLARS = ['mindfulness', 'confidence', 'motivation', 'attentional_focus', 'arousal_control', 'resilience']
const SUPPORTING_PILLARS = ['knowledge', 'self_awareness', 'wellness', 'deliberate_practice']

function ScoreBar({ score, maxScore = 7 }: { score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100
  let colorClass = 'bg-yellow-500'
  if (percentage >= 70) colorClass = 'bg-green-500'
  else if (percentage < 50) colorClass = 'bg-orange-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-12 text-right">
        {score.toFixed(1)}/7
      </span>
    </div>
  )
}

function PillarCard({
  pillar,
  score,
  isStrength,
  isGrowthArea,
}: {
  pillar: string
  score: number
  isStrength: boolean
  isGrowthArea: boolean
}) {
  return (
    <div
      className={`bg-white rounded-lg p-4 border-2 ${
        isStrength
          ? 'border-green-300 bg-green-50'
          : isGrowthArea
            ? 'border-orange-300 bg-orange-50'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900">{PILLAR_DISPLAY_NAMES[pillar] || pillar}</h3>
        {isStrength && (
          <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full">
            Strength
          </span>
        )}
        {isGrowthArea && (
          <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full">
            Growth Area
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-3">{PILLAR_DESCRIPTIONS[pillar]}</p>
      <ScoreBar score={score} />
    </div>
  )
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const pillars = CORE_PILLARS
  const centerX = 150
  const centerY = 150
  const maxRadius = 100

  // Calculate points for the hexagon background
  const backgroundPoints = pillars.map((_, i) => {
    const angle = (i * 360) / pillars.length - 90
    const rad = (angle * Math.PI) / 180
    return {
      x: centerX + maxRadius * Math.cos(rad),
      y: centerY + maxRadius * Math.sin(rad),
    }
  })

  // Calculate points for the score polygon
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
    <svg viewBox="0 0 300 300" className="w-full max-w-md mx-auto">
      {/* Background circles */}
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

      {/* Axis lines */}
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

      {/* Score polygon */}
      <polygon
        points={scorePoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Score points */}
      {scorePoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#3b82f6"
        />
      ))}

      {/* Labels */}
      {pillars.map((pillar, i) => {
        const angle = (i * 360) / pillars.length - 90
        const rad = (angle * Math.PI) / 180
        const labelRadius = maxRadius + 30
        const x = centerX + labelRadius * Math.cos(rad)
        const y = centerY + labelRadius * Math.sin(rad)

        return (
          <text
            key={pillar}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
          >
            {PILLAR_DISPLAY_NAMES[pillar]?.split(' ')[0] || pillar}
          </text>
        )
      })}
    </svg>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [results, setResults] = useState<AssessmentResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await apiGet<AssessmentResult>('/assessments/results/me/latest')
        setResults(data)
      } catch (err: any) {
        if (err.status === 404) {
          setError('No assessment results found. Complete an assessment first.')
        } else {
          setError('Failed to load results')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (!isAuthLoading && user) {
      loadResults()
    }
  }, [user, isAuthLoading])

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'No results found'}</p>
          <Button onClick={() => router.push('/assessment')}>Take Assessment</Button>
        </div>
      </div>
    )
  }

  const coreScores = CORE_PILLARS.map((p) => ({
    pillar: p,
    score: results.pillar_scores[p] || 0,
  }))

  const supportingScores = SUPPORTING_PILLARS.map((p) => ({
    pillar: p,
    score: results.pillar_scores[p] || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Results</h1>
            <p className="text-sm text-gray-500">
              Completed {new Date(results.completed_at).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/athlete')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Your Strengths</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              These are your top mental performance areas. Keep building on them!
            </p>
            <ul className="space-y-2">
              {results.strengths.map((strength) => (
                <li key={strength} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-medium text-gray-900">
                    {PILLAR_DISPLAY_NAMES[strength] || strength}
                  </span>
                  <span className="text-gray-500">
                    ({(results.pillar_scores[strength] || 0).toFixed(1)}/7)
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Areas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Growth Areas</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Focus your training here to see the biggest improvements.
            </p>
            <ul className="space-y-2">
              {results.growth_areas.map((area) => (
                <li key={area} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="font-medium text-gray-900">
                    {PILLAR_DISPLAY_NAMES[area] || area}
                  </span>
                  <span className="text-gray-500">
                    ({(results.pillar_scores[area] || 0).toFixed(1)}/7)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Core Mental Skills Profile
          </h2>
          <RadarChart scores={results.pillar_scores} />
        </div>

        {/* Core Pillars */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Mental Skills</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreScores.map(({ pillar, score }) => (
              <PillarCard
                key={pillar}
                pillar={pillar}
                score={score}
                isStrength={results.strengths.includes(pillar)}
                isGrowthArea={results.growth_areas.includes(pillar)}
              />
            ))}
          </div>
        </div>

        {/* Supporting Dimensions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporting Dimensions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {supportingScores.map(({ pillar, score }) => (
              <PillarCard
                key={pillar}
                pillar={pillar}
                score={score}
                isStrength={results.strengths.includes(pillar)}
                isGrowthArea={results.growth_areas.includes(pillar)}
              />
            ))}
          </div>
        </div>

        {/* Meta Scores */}
        {results.meta_scores && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Categories</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(results.meta_scores).map(([category, score]) => (
                <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 capitalize mb-1">{category}</p>
                  <p className="text-2xl font-bold text-gray-900">{score.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">out of 7</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Ready to start improving? Your personalized training pathway is being prepared.
          </p>
          <Button onClick={() => router.push('/athlete')} className="px-8">
            Go to Dashboard
          </Button>
        </div>
      </main>
    </div>
  )
}
