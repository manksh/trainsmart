'use client'

interface ScoreBarProps {
  score: number
  maxScore?: number
  colorScheme?: 'default' | 'purple'
}

export function ScoreBar({ score, maxScore = 7, colorScheme = 'default' }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100

  let colorClass: string
  if (colorScheme === 'purple') {
    // Purple scheme for supporting dimensions
    if (percentage >= 70) colorClass = 'bg-purple-500'
    else if (percentage >= 50) colorClass = 'bg-purple-400'
    else colorClass = 'bg-purple-300'
  } else {
    // Default scheme (green/yellow/orange)
    if (percentage >= 70) colorClass = 'bg-green-500'
    else if (percentage >= 50) colorClass = 'bg-yellow-500'
    else colorClass = 'bg-orange-500'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8">{score.toFixed(1)}</span>
    </div>
  )
}
