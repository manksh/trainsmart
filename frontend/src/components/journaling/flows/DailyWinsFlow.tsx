'use client'

import { MultiStepFlow } from '../MultiStepFlow'
import { FlowStep, StepComponentProps, FlowProps } from '../types'
import { journalColors } from '../colors'
import { journalIcons } from '../icons'

// Data structure for daily wins flow
interface DailyWinsData {
  winDescription: string
  winFactors: string[]
  winFeeling: string | null
}

// Step 1: Win Description
function WinDescriptionStep({ data, updateData, colors }: StepComponentProps<DailyWinsData>) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center mb-4">
        Big or small, every win counts!
      </p>
      <textarea
        value={data.winDescription}
        onChange={(e) => updateData({ winDescription: e.target.value })}
        placeholder="I accomplished..."
        className={`w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} resize-none h-32`}
        maxLength={500}
        autoFocus
      />
    </div>
  )
}

// Step 2: What Helped (with config)
function createWinFactorsStep(factors: string[]) {
  return function WinFactorsStepWithConfig({ data, updateData, colors }: StepComponentProps<DailyWinsData>) {
    const { winFactors } = data

    return (
      <div className="flex flex-wrap gap-2">
        {factors.map((factor) => (
          <button
            key={factor}
            onClick={() => {
              const newFactors = winFactors.includes(factor)
                ? winFactors.filter(f => f !== factor)
                : [...winFactors, factor]
              updateData({ winFactors: newFactors })
            }}
            className={`px-4 py-2 rounded-full border transition-colors ${
              winFactors.includes(factor)
                ? `${colors.bg} ${colors.text} ${colors.border}`
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {factor}
          </button>
        ))}
      </div>
    )
  }
}

// Step 3: How It Felt (with config)
function createWinFeelingStep(emotions: Array<{ key: string; label: string; emoji: string }>) {
  return function WinFeelingStepWithConfig({ data, updateData, colors }: StepComponentProps<DailyWinsData>) {
    const { winDescription, winFactors, winFeeling } = data

    return (
      <div className="space-y-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {emotions.map((emotion) => (
            <button
              key={emotion.key}
              onClick={() => updateData({ winFeeling: winFeeling === emotion.key ? null : emotion.key })}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                winFeeling === emotion.key
                  ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-3xl mb-1">{emotion.emoji}</span>
              <span className="text-xs text-gray-600">{emotion.label}</span>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className={`mt-6 p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
          <p className="text-gray-700 mb-2">{winDescription}</p>
          {winFactors.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {winFactors.map(f => (
                <span key={f} className="text-xs px-2 py-1 bg-white rounded-full text-green-600">{f}</span>
              ))}
            </div>
          )}
          {winFeeling && (
            <span className="text-2xl">{emotions.find(e => e.key === winFeeling)?.emoji}</span>
          )}
        </div>
      </div>
    )
  }
}

export function DailyWinsFlow({ config, onSave, onCancel, isSaving }: FlowProps) {
  const colors = journalColors.daily_wins

  const initialData: DailyWinsData = {
    winDescription: '',
    winFactors: [],
    winFeeling: null,
  }

  const steps: FlowStep<DailyWinsData>[] = [
    {
      id: 'win-description',
      title: "What's your win today?",
      component: WinDescriptionStep,
      canProceed: (data) => data.winDescription.trim().length > 0,
    },
    {
      id: 'win-factors',
      title: 'What helped you achieve this?',
      subtitle: '(Optional - select all that apply)',
      component: createWinFactorsStep(config.daily_win_factors),
      canProceed: () => true,
    },
    {
      id: 'win-feeling',
      title: 'How does this win make you feel?',
      subtitle: '(Optional)',
      component: createWinFeelingStep(config.emotion_options.wins),
      canProceed: () => true,
    },
  ]

  const buildPayload = (data: DailyWinsData): Record<string, unknown> => ({
    journal_type: 'daily_wins',
    win_description: data.winDescription,
    win_factors: data.winFactors.length > 0 ? data.winFactors : null,
    win_feeling: data.winFeeling,
  })

  return (
    <MultiStepFlow
      steps={steps}
      initialData={initialData}
      colors={colors}
      icon={journalIcons.trophy}
      title="Daily Win"
      onSave={onSave}
      onCancel={onCancel}
      isSaving={isSaving}
      buildPayload={buildPayload}
    />
  )
}
