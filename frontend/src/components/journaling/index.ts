// Main exports
export { MultiStepFlow, ProgressDots } from './MultiStepFlow'

// Flow components
export {
  AffirmationsFlow,
  DailyWinsFlow,
  GratitudeFlow,
  IKnowFlow,
  OpenEndedFlow,
} from './flows'

// Types
export type {
  JournalColorConfig,
  StepComponentProps,
  FlowStep,
  MultiStepFlowProps,
  JournalConfig,
  FlowProps,
} from './types'

// Utilities
export { journalColors, getJournalColors } from './colors'
export { journalIcons, getJournalIcon } from './icons'
