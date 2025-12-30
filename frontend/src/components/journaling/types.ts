/**
 * Shared types for journal flow components
 */

import { ReactNode } from 'react'

// Color configuration for a journal type
export interface JournalColorConfig {
  bg: string
  text: string
  border: string
  gradient: string
  ring: string
  buttonBg: string
  buttonHover: string
}

// Props passed to each step component
export interface StepComponentProps<T> {
  data: T
  updateData: (updates: Partial<T>) => void
  colors: JournalColorConfig
}

// Step definition for multi-step flows
export interface FlowStep<T> {
  id: string
  title: string
  subtitle?: string
  component: React.ComponentType<StepComponentProps<T>>
  canProceed: (data: T) => boolean
}

// Props for the MultiStepFlow component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MultiStepFlowProps<T = any> {
  steps: FlowStep<T>[]
  initialData: T
  colors: JournalColorConfig
  icon: ReactNode
  title: string
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
  buildPayload: (data: T) => Record<string, unknown>
}

// Journal config from API
export interface JournalConfig {
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

// Common flow props passed to each journal flow
export interface FlowProps {
  config: JournalConfig
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  isSaving: boolean
}
