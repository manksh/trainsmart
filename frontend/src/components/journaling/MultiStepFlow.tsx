'use client'

import { useState, useCallback } from 'react'
import { MultiStepFlowProps } from './types'

/**
 * Progress indicator dots showing current step in a multi-step flow
 */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < current ? 'bg-gray-800' : i === current ? 'bg-gray-400' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * Back arrow icon for header
 */
function BackArrowIcon() {
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

/**
 * MultiStepFlow - A reusable component for multi-step journal flows
 *
 * Handles:
 * - Step state management
 * - Progress indicator
 * - Header with back button and icon
 * - Navigation footer (Back/Next/Save)
 * - Validation via canProceed
 *
 * Each step renders its own content via the step component.
 */
export function MultiStepFlow<T>({
  steps,
  initialData,
  colors,
  icon,
  title,
  onSave,
  onCancel,
  isSaving,
  buildPayload,
}: MultiStepFlowProps<T>) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<T>(initialData)

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1
  const canProceed = currentStep.canProceed(data)

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  const handleNext = () => {
    if (isLastStep) {
      onSave(buildPayload(data))
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const StepComponent = currentStep.component

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
            <BackArrowIcon />
          </button>
          <div className={colors.text}>{icon}</div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        <ProgressDots current={step} total={steps.length} />

        {/* Step Content */}
        <div className="space-y-4">
          {currentStep.title && (
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {currentStep.title}
            </h2>
          )}
          {currentStep.subtitle && (
            <p className="text-sm text-gray-500 text-center mb-4">{currentStep.subtitle}</p>
          )}

          <StepComponent data={data} updateData={updateData} colors={colors} />
        </div>

        {/* Navigation Footer */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed || isSaving}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              canProceed && !isSaving
                ? `${colors.buttonBg} text-white ${colors.buttonHover}`
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : isLastStep ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { ProgressDots }
