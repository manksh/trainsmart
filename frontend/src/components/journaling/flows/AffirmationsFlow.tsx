'use client'

import { MultiStepFlow } from '../MultiStepFlow'
import { FlowStep, StepComponentProps, FlowProps } from '../types'
import { journalColors } from '../colors'
import { journalIcons } from '../icons'

// Data structure for affirmations flow
interface AffirmationsData {
  focusArea: string | null
  selectedAffirmation: string | null
  customAffirmation: string
  isCustom: boolean
  whenHelpful: string[]
}

// Create step components with config bound
function createFocusAreaStep(focusAreas: Array<{ key: string; label: string }>) {
  return function FocusAreaStepWithConfig({ data, updateData, colors }: StepComponentProps<AffirmationsData>) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {focusAreas.map((area) => (
          <button
            key={area.key}
            onClick={() => updateData({ focusArea: area.key })}
            className={`p-4 rounded-xl border-2 transition-all ${
              data.focusArea === area.key
                ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className={`font-medium ${data.focusArea === area.key ? colors.text : 'text-gray-700'}`}>
              {area.label}
            </p>
          </button>
        ))}
      </div>
    )
  }
}

function createAffirmationSelectStep(
  affirmationsConfig: Record<string, { key: string; label: string; affirmations: string[] }>
) {
  return function AffirmationSelectStepWithConfig({ data, updateData, colors }: StepComponentProps<AffirmationsData>) {
    const { focusArea, selectedAffirmation, customAffirmation, isCustom } = data
    const affirmations = focusArea ? affirmationsConfig[focusArea]?.affirmations || [] : []

    return (
      <div className="space-y-4">
        {/* Toggle for custom */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => updateData({ isCustom: false })}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              !isCustom ? `${colors.bg} ${colors.text}` : 'bg-gray-100 text-gray-600'
            }`}
          >
            Choose
          </button>
          <button
            onClick={() => updateData({ isCustom: true })}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              isCustom ? `${colors.bg} ${colors.text}` : 'bg-gray-100 text-gray-600'
            }`}
          >
            Write My Own
          </button>
        </div>

        {isCustom ? (
          <textarea
            value={customAffirmation}
            onChange={(e) => updateData({ customAffirmation: e.target.value })}
            placeholder="Write your affirmation..."
            className={`w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${colors.ring} resize-none h-32`}
            maxLength={500}
          />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {affirmations.map((aff, idx) => (
              <button
                key={idx}
                onClick={() => updateData({ selectedAffirmation: aff })}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  selectedAffirmation === aff
                    ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className={`text-sm ${selectedAffirmation === aff ? colors.text : 'text-gray-700'}`}>
                  &quot;{aff}&quot;
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
}

function createWhenHelpfulStep(timingOptions: string[]) {
  return function WhenHelpfulStepWithConfig({ data, updateData, colors }: StepComponentProps<AffirmationsData>) {
    const { whenHelpful, isCustom, customAffirmation, selectedAffirmation } = data
    const affirmationText = isCustom ? customAffirmation : selectedAffirmation

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {timingOptions.map((timing) => (
            <button
              key={timing}
              onClick={() => {
                const newWhenHelpful = whenHelpful.includes(timing)
                  ? whenHelpful.filter(t => t !== timing)
                  : [...whenHelpful, timing]
                updateData({ whenHelpful: newWhenHelpful })
              }}
              className={`px-4 py-2 rounded-full border transition-colors ${
                whenHelpful.includes(timing)
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {timing}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className={`mt-6 p-6 rounded-xl ${colors.bg} border ${colors.border}`}>
          <p className={`text-lg font-medium ${colors.text} text-center italic`}>
            &quot;{affirmationText}&quot;
          </p>
        </div>
      </div>
    )
  }
}

export function AffirmationsFlow({ config, onSave, onCancel, isSaving }: FlowProps) {
  const colors = journalColors.affirmations
  const focusAreas = Object.values(config.affirmations)

  const initialData: AffirmationsData = {
    focusArea: null,
    selectedAffirmation: null,
    customAffirmation: '',
    isCustom: false,
    whenHelpful: [],
  }

  const steps: FlowStep<AffirmationsData>[] = [
    {
      id: 'focus-area',
      title: 'What area would you like to focus on?',
      component: createFocusAreaStep(focusAreas),
      canProceed: (data) => data.focusArea !== null,
    },
    {
      id: 'select-affirmation',
      title: 'Choose an affirmation or write your own',
      component: createAffirmationSelectStep(config.affirmations),
      canProceed: (data) => data.isCustom ? data.customAffirmation.trim().length > 0 : data.selectedAffirmation !== null,
    },
    {
      id: 'when-helpful',
      title: 'When would this affirmation help you?',
      subtitle: '(Optional - select all that apply)',
      component: createWhenHelpfulStep(config.affirmation_timing_options),
      canProceed: () => true,
    },
  ]

  const buildPayload = (data: AffirmationsData): Record<string, unknown> => ({
    journal_type: 'affirmations',
    affirmation_focus_area: data.focusArea,
    affirmation_text: data.isCustom ? data.customAffirmation : data.selectedAffirmation,
    affirmation_is_custom: data.isCustom,
    affirmation_when_helpful: data.whenHelpful.length > 0 ? data.whenHelpful : null,
  })

  return (
    <MultiStepFlow
      steps={steps}
      initialData={initialData}
      colors={colors}
      icon={journalIcons.sparkles}
      title="Affirmations"
      onSave={onSave}
      onCancel={onCancel}
      isSaving={isSaving}
      buildPayload={buildPayload}
    />
  )
}
