'use client'

import { MultiStepFlow } from '../MultiStepFlow'
import { FlowStep, StepComponentProps, FlowProps } from '../types'
import { journalColors } from '../colors'
import { journalIcons } from '../icons'

// Data structure for I Know flow
interface IKnowData {
  statement: string
  whyMatters: string
  feeling: string | null
}

// Feelings options for I Know journal
const feelingOptions = [
  { key: 'grounded', label: 'Grounded', emoji: '🌱' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'reassured', label: 'Reassured', emoji: '🤗' },
  { key: 'focused', label: 'Focused', emoji: '🎯' },
  { key: 'supported', label: 'Supported', emoji: '🤝' },
  { key: 'motivated', label: 'Motivated', emoji: '🔥' },
  { key: 'neutral', label: 'Neutral', emoji: '😐' },
]

// Example prompts for the statement
const examplePrompts = [
  'I am capable of handling challenges',
  'my effort matters more than the outcome',
  'I have people who support me',
  'I have overcome difficult things before',
  'my worth is not defined by my performance',
  "it's okay to ask for help",
]

// Step 1: Statement Input
function StatementStep({ data, updateData, colors }: StepComponentProps<IKnowData>) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center mb-4">
        Ground yourself in something you know, even when doubt creeps in.
      </p>

      {/* Input with I know... prefix */}
      <div className={`p-4 rounded-xl border ${colors.border} bg-white`}>
        <div className="flex items-start gap-2">
          <span className={`font-medium ${colors.text} whitespace-nowrap pt-1`}>I know</span>
          <textarea
            value={data.statement}
            onChange={(e) => updateData({ statement: e.target.value })}
            placeholder="..."
            className="flex-1 resize-none focus:outline-none text-gray-900 min-h-[80px]"
            maxLength={500}
            autoFocus
          />
        </div>
      </div>

      {/* Example prompts */}
      <div>
        <p className="text-sm text-gray-500 mb-2">Need inspiration?</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => updateData({ statement: prompt })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                data.statement === prompt
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Step 2: Why It Matters
function WhyMattersStep({ data, updateData, colors }: StepComponentProps<IKnowData>) {
  return (
    <div className="space-y-4">
      <textarea
        value={data.whyMatters}
        onChange={(e) => updateData({ whyMatters: e.target.value })}
        placeholder="This matters because..."
        className={`w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} resize-none h-32`}
        maxLength={500}
      />

      {/* Preview of statement */}
      <div className={`mt-4 p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
        <p className={`${colors.text} font-medium`}>
          I know {data.statement}
        </p>
      </div>
    </div>
  )
}

// Step 3: Feeling Selection
function FeelingStep({ data, updateData, colors }: StepComponentProps<IKnowData>) {
  const { statement, whyMatters, feeling } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {feelingOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => updateData({ feeling: feeling === option.key ? null : option.key })}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
              feeling === option.key
                ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-2xl mb-1">{option.emoji}</span>
            <span className="text-xs text-gray-600">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className={`mt-6 p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
        <p className={`${colors.text} font-medium mb-2`}>
          I know {statement}
        </p>
        {whyMatters && (
          <p className="text-sm text-gray-500 italic mb-2">{whyMatters}</p>
        )}
        {feeling && (
          <span className="text-2xl">{feelingOptions.find(f => f.key === feeling)?.emoji}</span>
        )}
      </div>
    </div>
  )
}

export function IKnowFlow({ config, onSave, onCancel, isSaving }: FlowProps) {
  // config is passed but not used - keeping for interface consistency
  void config

  const colors = journalColors.i_know

  const initialData: IKnowData = {
    statement: '',
    whyMatters: '',
    feeling: null,
  }

  const steps: FlowStep<IKnowData>[] = [
    {
      id: 'statement',
      title: 'What do you know to be true?',
      component: StatementStep,
      canProceed: (data) => data.statement.trim().length > 0,
    },
    {
      id: 'why-matters',
      title: 'Why does this matter to you?',
      subtitle: '(Optional)',
      component: WhyMattersStep,
      canProceed: () => true,
    },
    {
      id: 'feeling',
      title: 'How does knowing this make you feel?',
      subtitle: 'Select one',
      component: FeelingStep,
      canProceed: (data) => data.feeling !== null,
    },
  ]

  const buildPayload = (data: IKnowData): Record<string, unknown> => ({
    journal_type: 'i_know',
    i_know_statement: data.statement,
    i_know_why_matters: data.whyMatters || null,
    i_know_feeling: data.feeling,
  })

  return (
    <MultiStepFlow
      steps={steps}
      initialData={initialData}
      colors={colors}
      icon={journalIcons.lightbulb}
      title="I Know..."
      onSave={onSave}
      onCancel={onCancel}
      isSaving={isSaving}
      buildPayload={buildPayload}
    />
  )
}
