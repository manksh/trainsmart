import { JournalColorConfig } from './types'

/**
 * Color configurations for each journal type
 */
export const journalColors: Record<string, JournalColorConfig> = {
  affirmations: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    gradient: 'from-amber-50 to-white',
    ring: 'ring-amber-300',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-600',
  },
  daily_wins: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    gradient: 'from-green-50 to-white',
    ring: 'ring-green-300',
    buttonBg: 'bg-green-500',
    buttonHover: 'hover:bg-green-600',
  },
  gratitude: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-200',
    gradient: 'from-pink-50 to-white',
    ring: 'ring-pink-300',
    buttonBg: 'bg-pink-500',
    buttonHover: 'hover:bg-pink-600',
  },
  open_ended: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-50 to-white',
    ring: 'ring-purple-300',
    buttonBg: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-700',
  },
  i_know: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    gradient: 'from-cyan-50 to-white',
    ring: 'ring-cyan-300',
    buttonBg: 'bg-cyan-500',
    buttonHover: 'hover:bg-cyan-600',
  },
}

export function getJournalColors(journalType: string): JournalColorConfig {
  return journalColors[journalType] || journalColors.open_ended
}
