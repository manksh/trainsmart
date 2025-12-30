'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

// Types
interface JournalConfig {
  journal_types: Array<{
    key: string
    label: string
    description: string
    icon: string
  }>
  affirmations: Record<string, {
    key: string
    label: string
    affirmations: string[]
  }>
  affirmation_timing_options: string[]
  daily_win_factors: string[]
  emotion_options: {
    wins: Array<{ key: string; label: string; emoji: string }>
    gratitude: Array<{ key: string; label: string; emoji: string }>
  }
  open_ended_tags: string[]
  open_ended_prompts: string[]
}

// Icons
const icons: Record<string, React.ReactNode> = {
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  heart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  pencil: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
}

const typeColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  affirmations: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-50 to-white' },
  daily_wins: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-50 to-white' },
  gratitude: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', gradient: 'from-pink-50 to-white' },
  open_ended: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-50 to-white' },
  i_know: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-50 to-white' },
}

// Progress indicator
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

// Affirmations Flow Component
function AffirmationsFlow({
  config,
  onSave,
  onCancel,
  isSaving
}: {
  config: JournalConfig
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [step, setStep] = useState(0)
  const [focusArea, setFocusArea] = useState<string | null>(null)
  const [selectedAffirmation, setSelectedAffirmation] = useState<string | null>(null)
  const [customAffirmation, setCustomAffirmation] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [whenHelpful, setWhenHelpful] = useState<string[]>([])

  const focusAreas = Object.values(config.affirmations)
  const colors = typeColors.affirmations

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else {
      onSave({
        journal_type: 'affirmations',
        affirmation_focus_area: focusArea,
        affirmation_text: isCustom ? customAffirmation : selectedAffirmation,
        affirmation_is_custom: isCustom,
        affirmation_when_helpful: whenHelpful.length > 0 ? whenHelpful : null,
      })
    }
  }

  const canProceed = () => {
    if (step === 0) return focusArea !== null
    if (step === 1) return isCustom ? customAffirmation.trim().length > 0 : selectedAffirmation !== null
    return true
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={`${colors.text}`}>{icons.sparkles}</div>
          <h1 className="text-xl font-bold text-gray-900">Affirmations</h1>
        </div>

        <ProgressDots current={step} total={3} />

        {/* Step 0: Focus Area */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
              What area would you like to focus on?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {focusAreas.map((area) => (
                <button
                  key={area.key}
                  onClick={() => setFocusArea(area.key)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    focusArea === area.key
                      ? `${colors.border} ${colors.bg} ring-2 ring-amber-300`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium ${focusArea === area.key ? colors.text : 'text-gray-700'}`}>
                    {area.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Select Affirmation */}
        {step === 1 && focusArea && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
              Choose an affirmation or write your own
            </h2>

            {/* Toggle for custom */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsCustom(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  !isCustom ? `${colors.bg} ${colors.text}` : 'bg-gray-100 text-gray-600'
                }`}
              >
                Choose
              </button>
              <button
                onClick={() => setIsCustom(true)}
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
                onChange={(e) => setCustomAffirmation(e.target.value)}
                placeholder="Write your affirmation..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none h-32"
                maxLength={500}
              />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {config.affirmations[focusArea]?.affirmations.map((aff, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAffirmation(aff)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      selectedAffirmation === aff
                        ? `${colors.border} ${colors.bg} ring-2 ring-amber-300`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm ${selectedAffirmation === aff ? colors.text : 'text-gray-700'}`}>
                      "{aff}"
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: When Helpful */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              When would this affirmation help you?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">(Optional - select all that apply)</p>

            <div className="flex flex-wrap gap-2">
              {config.affirmation_timing_options.map((timing) => (
                <button
                  key={timing}
                  onClick={() => {
                    setWhenHelpful(prev =>
                      prev.includes(timing) ? prev.filter(t => t !== timing) : [...prev, timing]
                    )
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
                "{isCustom ? customAffirmation : selectedAffirmation}"
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              canProceed() && !isSaving
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : step === 2 ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Daily Wins Flow Component
function DailyWinsFlow({
  config,
  onSave,
  onCancel,
  isSaving
}: {
  config: JournalConfig
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [step, setStep] = useState(0)
  const [winDescription, setWinDescription] = useState('')
  const [winFactors, setWinFactors] = useState<string[]>([])
  const [winFeeling, setWinFeeling] = useState<string | null>(null)

  const colors = typeColors.daily_wins

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else {
      onSave({
        journal_type: 'daily_wins',
        win_description: winDescription,
        win_factors: winFactors.length > 0 ? winFactors : null,
        win_feeling: winFeeling,
      })
    }
  }

  const canProceed = () => {
    if (step === 0) return winDescription.trim().length > 0
    return true
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={`${colors.text}`}>{icons.trophy}</div>
          <h1 className="text-xl font-bold text-gray-900">Daily Win</h1>
        </div>

        <ProgressDots current={step} total={3} />

        {/* Step 0: What's Your Win */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
              What's your win today?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Big or small, every win counts!
            </p>
            <textarea
              value={winDescription}
              onChange={(e) => setWinDescription(e.target.value)}
              placeholder="I accomplished..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 resize-none h-32"
              maxLength={500}
              autoFocus
            />
          </div>
        )}

        {/* Step 1: What Helped */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              What helped you achieve this?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">(Optional - select all that apply)</p>

            <div className="flex flex-wrap gap-2">
              {config.daily_win_factors.map((factor) => (
                <button
                  key={factor}
                  onClick={() => {
                    setWinFactors(prev =>
                      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
                    )
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
          </div>
        )}

        {/* Step 2: How It Felt */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              How does this win make you feel?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">(Optional)</p>

            <div className="flex justify-center gap-4 flex-wrap">
              {config.emotion_options.wins.map((emotion) => (
                <button
                  key={emotion.key}
                  onClick={() => setWinFeeling(winFeeling === emotion.key ? null : emotion.key)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    winFeeling === emotion.key
                      ? `${colors.border} ${colors.bg} ring-2 ring-green-300`
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
                <span className="text-2xl">{config.emotion_options.wins.find(e => e.key === winFeeling)?.emoji}</span>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              canProceed() && !isSaving
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : step === 2 ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Gratitude Flow Component
function GratitudeFlow({
  config,
  onSave,
  onCancel,
  isSaving
}: {
  config: JournalConfig
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [step, setStep] = useState(0)
  const [gratitudeItem, setGratitudeItem] = useState('')
  const [whyMeaningful, setWhyMeaningful] = useState('')
  const [gratitudeFeeling, setGratitudeFeeling] = useState<string | null>(null)

  const colors = typeColors.gratitude

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else {
      onSave({
        journal_type: 'gratitude',
        gratitude_item: gratitudeItem,
        gratitude_why_meaningful: whyMeaningful || null,
        gratitude_feeling: gratitudeFeeling,
      })
    }
  }

  const canProceed = () => {
    if (step === 0) return gratitudeItem.trim().length > 0
    return true
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={`${colors.text}`}>{icons.heart}</div>
          <h1 className="text-xl font-bold text-gray-900">Gratitude</h1>
        </div>

        <ProgressDots current={step} total={3} />

        {/* Step 0: What Are You Grateful For */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
              What are you grateful for today?
            </h2>
            <textarea
              value={gratitudeItem}
              onChange={(e) => setGratitudeItem(e.target.value)}
              placeholder="I'm grateful for..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-32"
              maxLength={500}
              autoFocus
            />
          </div>
        )}

        {/* Step 1: Why Meaningful */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Why is this meaningful to you?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">(Optional)</p>
            <textarea
              value={whyMeaningful}
              onChange={(e) => setWhyMeaningful(e.target.value)}
              placeholder="It matters because..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-32"
              maxLength={500}
            />
          </div>
        )}

        {/* Step 2: How It Makes You Feel */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              How does this make you feel?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">(Optional)</p>

            <div className="flex justify-center gap-4 flex-wrap">
              {config.emotion_options.gratitude.map((emotion) => (
                <button
                  key={emotion.key}
                  onClick={() => setGratitudeFeeling(gratitudeFeeling === emotion.key ? null : emotion.key)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    gratitudeFeeling === emotion.key
                      ? `${colors.border} ${colors.bg} ring-2 ring-pink-300`
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
                <span className="text-2xl">{config.emotion_options.gratitude.find(e => e.key === gratitudeFeeling)?.emoji}</span>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              canProceed() && !isSaving
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : step === 2 ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Open-Ended Flow Component
function OpenEndedFlow({
  config,
  onSave,
  onCancel,
  isSaving
}: {
  config: JournalConfig
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [promptUsed, setPromptUsed] = useState<string | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)

  const colors = typeColors.open_ended
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const handleSave = () => {
    onSave({
      journal_type: 'open_ended',
      content: content,
      tags: tags.length > 0 ? tags : null,
      prompt_used: promptUsed,
    })
  }

  const canSave = content.trim().length > 0

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={`${colors.text}`}>{icons.pencil}</div>
            <h1 className="text-xl font-bold text-gray-900">Free Write</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              canSave && !isSaving
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Prompt Selector */}
        <div className="mb-4">
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showPrompts ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {promptUsed ? 'Change prompt' : 'Need a prompt?'}
          </button>

          {showPrompts && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {config.open_ended_prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptUsed(prompt)
                      setShowPrompts(false)
                    }}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      promptUsed === prompt
                        ? `${colors.bg} ${colors.text}`
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {promptUsed && !showPrompts && (
            <div className={`mt-2 p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
              <p className="text-sm text-gray-600 italic">{promptUsed}</p>
            </div>
          )}
        </div>

        {/* Text Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none h-64 text-gray-800"
          autoFocus
        />

        {/* Word Count */}
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-400">{wordCount} words</span>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Tags (optional)</p>
          <div className="flex flex-wrap gap-2">
            {config.open_ended_tags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  tags.includes(tag)
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// I Know Flow Component
function IKnowFlow({
  config,
  onSave,
  onCancel,
  isSaving
}: {
  config: JournalConfig
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [step, setStep] = useState(0)
  const [statement, setStatement] = useState('')
  const [whyMatters, setWhyMatters] = useState('')
  const [feeling, setFeeling] = useState<string | null>(null)

  const colors = typeColors.i_know

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
    'it\'s okay to ask for help',
  ]

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else {
      onSave({
        journal_type: 'i_know',
        i_know_statement: statement,
        i_know_why_matters: whyMatters || null,
        i_know_feeling: feeling,
      })
    }
  }

  const canProceed = () => {
    if (step === 0) return statement.trim().length > 0
    if (step === 2) return feeling !== null
    return true
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient}`}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={`${colors.text}`}>{icons.lightbulb}</div>
          <h1 className="text-xl font-bold text-gray-900">I Know...</h1>
        </div>

        <ProgressDots current={step} total={3} />

        {/* Step 0: Statement Input */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
              What do you know to be true?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Ground yourself in something you know, even when doubt creeps in.
            </p>

            {/* Input with I know... prefix */}
            <div className={`p-4 rounded-xl border ${colors.border} bg-white`}>
              <div className="flex items-start gap-2">
                <span className={`font-medium ${colors.text} whitespace-nowrap pt-1`}>I know</span>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
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
                    onClick={() => setStatement(prompt)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      statement === prompt
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
        )}

        {/* Step 1: Why It Matters (Optional) */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Why does this matter to you?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">(Optional)</p>
            <textarea
              value={whyMatters}
              onChange={(e) => setWhyMatters(e.target.value)}
              placeholder="This matters because..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none h-32"
              maxLength={500}
            />

            {/* Preview of statement */}
            <div className={`mt-4 p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
              <p className={`${colors.text} font-medium`}>
                I know {statement}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Feeling Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              How does knowing this make you feel?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">Select one</p>

            <div className="grid grid-cols-4 gap-3">
              {feelingOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFeeling(feeling === option.key ? null : option.key)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    feeling === option.key
                      ? `${colors.border} ${colors.bg} ring-2 ring-cyan-300`
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
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              canProceed() && !isSaving
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : step === 2 ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

// User type for full user data
interface FullUser {
  id: string
  email: string
  memberships: {
    organization_id: string
    organization_name: string
    role: string
  }[]
}

// Inner component that uses useSearchParams
function NewJournalEntryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const journalType = searchParams.get('type')

  const [config, setConfig] = useState<JournalConfig | null>(null)
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [configData, userData] = await Promise.all([
          apiGet<JournalConfig>('/journals/config'),
          apiGet<FullUser>('/users/me/full'),
        ])
        setConfig(configData)
        setFullUser(userData)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load journal configuration')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      loadData()
    }
  }, [user, authLoading])

  const handleSave = async (data: Record<string, unknown>) => {
    if (!fullUser?.memberships?.[0]) {
      setError('No organization found')
      return
    }

    setIsSaving(true)
    try {
      await apiPost('/journals', {
        ...data,
        organization_id: fullUser.memberships[0].organization_id,
      })
      router.push('/tools/journaling')
    } catch (err) {
      console.error('Failed to save entry:', err)
      setError('Failed to save journal entry')
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/tools/journaling')
  }

  if (authLoading || isLoading || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/tools/journaling')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Render appropriate flow based on journal type
  switch (journalType) {
    case 'affirmations':
      return (
        <AffirmationsFlow
          config={config}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )
    case 'daily_wins':
      return (
        <DailyWinsFlow
          config={config}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )
    case 'gratitude':
      return (
        <GratitudeFlow
          config={config}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )
    case 'open_ended':
      return (
        <OpenEndedFlow
          config={config}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )
    case 'i_know':
      return (
        <IKnowFlow
          config={config}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )
    default:
      // Invalid type, redirect back
      router.push('/tools/journaling')
      return null
  }
}

// Main Page Component with Suspense wrapper
export default function NewJournalEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <NewJournalEntryContent />
    </Suspense>
  )
}
