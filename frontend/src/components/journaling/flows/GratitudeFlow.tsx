'use client'

import { MultiStepFlow } from '../MultiStepFlow'
import { FlowStep, StepComponentProps, FlowProps } from '../types'
import { journalColors } from '../colors'
import { journalIcons } from '../icons'

// Data structure for gratitude flow
interface GratitudeData {
  gratitudeItem: string
  whyMeaningful: string
  gratitudeFeeling: string | null
}

// Step 1: Gratitude Item
function GratitudeItemStep({ data, updateData, colors }: StepComponentProps<GratitudeData>) {
  return (
    <textarea
      value={data.gratitudeItem}
      onChange={(e) => updateData({ gratitudeItem: e.target.value })}
      placeholder="I'm grateful for..."
      className={`w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} resize-none h-32`}
      maxLength={500}
      autoFocus
    />
  )
}

// Step 2: Why Meaningful
function WhyMeaningfulStep({ data, updateData, colors }: StepComponentProps<GratitudeData>) {
  return (
    <textarea
      value={data.whyMeaningful}
      onChange={(e) => updateData({ whyMeaningful: e.target.value })}
      placeholder="It matters because..."
      className={`w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} resize-none h-32`}
      maxLength={500}
    />
  )
}

// Step 3: Feeling Selection (with config)
function createGratitudeFeelingStep(emotions: Array<{ key: string; label: string; emoji: string }>) {
  return function GratitudeFeelingStepWithConfig({ data, updateData, colors }: StepComponentProps<GratitudeData>) {
    const { gratitudeItem, whyMeaningful, gratitudeFeeling } = data

    return (
      <div className="space-y-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {emotions.map((emotion) => (
            <button
              key={emotion.key}
              onClick={() => updateData({ gratitudeFeeling: gratitudeFeeling === emotion.key ? null : emotion.key })}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                gratitudeFeeling === emotion.key
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
          <p className="text-gray-700 mb-2">{gratitudeItem}</p>
          {whyMeaningful && (
            <p className="text-sm text-gray-500 italic mb-2">{whyMeaningful}</p>
          )}
          {gratitudeFeeling && (
            <span className="text-2xl">{emotions.find(e => e.key === gratitudeFeeling)?.emoji}</span>
          )}
        </div>
      </div>
    )
  }
}

export function GratitudeFlow({ config, onSave, onCancel, isSaving }: FlowProps) {
  const colors = journalColors.gratitude

  const initialData: GratitudeData = {
    gratitudeItem: '',
    whyMeaningful: '',
    gratitudeFeeling: null,
  }

  const steps: FlowStep<GratitudeData>[] = [
    {
      id: 'gratitude-item',
      title: 'What are you grateful for today?',
      component: GratitudeItemStep,
      canProceed: (data) => data.gratitudeItem.trim().length > 0,
    },
    {
      id: 'why-meaningful',
      title: 'Why is this meaningful to you?',
      subtitle: '(Optional)',
      component: WhyMeaningfulStep,
      canProceed: () => true,
    },
    {
      id: 'gratitude-feeling',
      title: 'How does this make you feel?',
      subtitle: '(Optional)',
      component: createGratitudeFeelingStep(config.emotion_options.gratitude),
      canProceed: () => true,
    },
  ]

  const buildPayload = (data: GratitudeData): Record<string, unknown> => ({
    journal_type: 'gratitude',
    gratitude_item: data.gratitudeItem,
    gratitude_why_meaningful: data.whyMeaningful || null,
    gratitude_feeling: data.gratitudeFeeling,
  })

  return (
    <MultiStepFlow
      steps={steps}
      initialData={initialData}
      colors={colors}
      icon={journalIcons.heart}
      title="Gratitude"
      onSave={onSave}
      onCancel={onCancel}
      isSaving={isSaving}
      buildPayload={buildPayload}
    />
  )
}
