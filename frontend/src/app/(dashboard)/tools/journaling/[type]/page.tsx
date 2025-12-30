'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiGet, apiDelete } from '@/lib/api'

// Types
interface JournalEntry {
  id: string
  journal_type: string
  created_at: string
  updated_at: string
  affirmation_focus_area?: string
  affirmation_text?: string
  affirmation_is_custom?: boolean
  affirmation_when_helpful?: string[]
  win_description?: string
  win_factors?: string[]
  win_feeling?: string
  gratitude_item?: string
  gratitude_why_meaningful?: string
  gratitude_feeling?: string
  content?: string
  tags?: string[]
  prompt_used?: string
  word_count?: number
  i_know_statement?: string
  i_know_why_matters?: string
  i_know_feeling?: string
}

interface JournalConfig {
  journal_types: Array<{
    key: string
    label: string
    description: string
    icon: string
  }>
  emotion_options: {
    wins: Array<{ key: string; label: string; emoji: string }>
    gratitude: Array<{ key: string; label: string; emoji: string }>
    i_know: Array<{ key: string; label: string; emoji: string }>
  }
}

interface CalendarData {
  year: number
  month: number
  dates_with_entries: Array<{
    date: string
    entry_count: number
    types: string[]
    entries: JournalEntry[]
  }>
  total_entries: number
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

const typeColors: Record<string, { bg: string; text: string; border: string; gradient: string; button: string }> = {
  affirmations: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-50', button: 'bg-amber-500 hover:bg-amber-600' },
  daily_wins: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-50', button: 'bg-green-500 hover:bg-green-600' },
  gratitude: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', gradient: 'from-pink-50', button: 'bg-pink-500 hover:bg-pink-600' },
  open_ended: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-50', button: 'bg-purple-500 hover:bg-purple-600' },
  i_know: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-50', button: 'bg-cyan-500 hover:bg-cyan-600' },
}

const typeIcons: Record<string, string> = {
  affirmations: 'sparkles',
  daily_wins: 'trophy',
  gratitude: 'heart',
  open_ended: 'pencil',
  i_know: 'lightbulb',
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Mini Calendar Component
function MiniCalendar({
  calendarData,
  currentMonth,
  onMonthChange,
  journalType,
}: {
  calendarData: CalendarData | null
  currentMonth: { year: number; month: number }
  onMonthChange: (year: number, month: number) => void
  journalType: string
}) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const colors = typeColors[journalType] || typeColors.open_ended

  const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.year, currentMonth.month - 1, 1).getDay()

  // Build entries map - only for this journal type
  const entriesByDate: Record<string, JournalEntry[]> = {}
  calendarData?.dates_with_entries.forEach(d => {
    const typeEntries = d.entries.filter(e => e.journal_type === journalType)
    if (typeEntries.length > 0) {
      entriesByDate[d.date] = typeEntries
    }
  })

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => {
            const newMonth = currentMonth.month === 1 ? 12 : currentMonth.month - 1
            const newYear = currentMonth.month === 1 ? currentMonth.year - 1 : currentMonth.year
            onMonthChange(newYear, newMonth)
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-900">
          {monthNames[currentMonth.month - 1]} {currentMonth.year}
        </span>
        <button
          onClick={() => {
            const newMonth = currentMonth.month === 12 ? 1 : currentMonth.month + 1
            const newYear = currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year
            onMonthChange(newYear, newMonth)
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasEntries = !!entriesByDate[dateStr]
          const isToday = dateStr === todayStr

          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-[11px] rounded ${
                isToday ? 'ring-1 ring-gray-400' : ''
              } ${
                hasEntries
                  ? `${colors.bg} ${colors.text} font-medium`
                  : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Entry Card Component
function EntryCard({
  entry,
  config,
  journalType,
  onClick
}: {
  entry: JournalEntry
  config: JournalConfig | null
  journalType: string
  onClick: () => void
}) {
  const colors = typeColors[journalType] || typeColors.open_ended

  const getEmoji = (feeling: string | undefined, type: 'wins' | 'gratitude' | 'i_know') => {
    if (!feeling || !config) return ''
    const emotion = config.emotion_options[type]?.find(e => e.key === feeling)
    return emotion?.emoji || ''
  }

  const getPreviewText = () => {
    switch (journalType) {
      case 'affirmations':
        return entry.affirmation_text || 'Affirmation'
      case 'daily_wins':
        return entry.win_description || 'Daily win'
      case 'gratitude':
        return entry.gratitude_item || 'Gratitude'
      case 'open_ended':
        return entry.content?.slice(0, 100) || 'Journal entry'
      case 'i_know':
        return entry.i_know_statement || 'I know...'
      default:
        return 'Entry'
    }
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border ${colors.border} bg-white hover:${colors.bg} transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 line-clamp-2">
            {journalType === 'affirmations' ? `"${getPreviewText()}"` : journalType === 'i_know' ? `I know ${getPreviewText()}` : getPreviewText()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">
              {formatDate(entry.created_at)} at {formatTime(entry.created_at)}
            </span>
            {journalType === 'daily_wins' && entry.win_feeling && (
              <span className="text-sm">{getEmoji(entry.win_feeling, 'wins')}</span>
            )}
            {journalType === 'gratitude' && entry.gratitude_feeling && (
              <span className="text-sm">{getEmoji(entry.gratitude_feeling, 'gratitude')}</span>
            )}
            {journalType === 'i_know' && entry.i_know_feeling && (
              <span className="text-sm">{getEmoji(entry.i_know_feeling, 'i_know')}</span>
            )}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

// Entry Detail Modal
function EntryDetailModal({
  entry,
  config,
  journalType,
  onClose,
  onDelete
}: {
  entry: JournalEntry
  config: JournalConfig | null
  journalType: string
  onClose: () => void
  onDelete: () => void
}) {
  const colors = typeColors[journalType] || typeColors.open_ended
  const typeInfo = config?.journal_types.find(t => t.key === journalType)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getEmoji = (feeling: string | undefined, type: 'wins' | 'gratitude' | 'i_know') => {
    if (!feeling || !config) return ''
    const emotion = config.emotion_options[type]?.find(e => e.key === feeling)
    return emotion?.emoji || ''
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto">
        <div className={`p-4 border-b ${colors.border} ${colors.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={colors.text}>{icons[typeIcons[journalType]]}</div>
              <span className={`font-semibold ${colors.text}`}>{typeInfo?.label}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{formatFullDate(entry.created_at)}</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Affirmations */}
          {journalType === 'affirmations' && (
            <>
              {entry.affirmation_focus_area && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Focus Area</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {entry.affirmation_focus_area.replace('_', ' ')}
                  </p>
                </div>
              )}
              {entry.affirmation_text && (
                <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <p className={`text-lg font-medium ${colors.text} text-center italic`}>
                    "{entry.affirmation_text}"
                  </p>
                </div>
              )}
              {entry.affirmation_when_helpful && entry.affirmation_when_helpful.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">When this helps</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.affirmation_when_helpful.map(timing => (
                      <span key={timing} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {timing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Daily Wins */}
          {journalType === 'daily_wins' && (
            <>
              {entry.win_description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Today's Win</p>
                  <p className="text-gray-900">{entry.win_description}</p>
                </div>
              )}
              {entry.win_factors && entry.win_factors.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">What helped</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.win_factors.map(factor => (
                      <span key={factor} className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.win_feeling && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">How it felt</p>
                  <p className="text-2xl">{getEmoji(entry.win_feeling, 'wins')}</p>
                </div>
              )}
            </>
          )}

          {/* Gratitude */}
          {journalType === 'gratitude' && (
            <>
              {entry.gratitude_item && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Grateful for</p>
                  <p className="text-gray-900">{entry.gratitude_item}</p>
                </div>
              )}
              {entry.gratitude_why_meaningful && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Why it's meaningful</p>
                  <p className="text-gray-900">{entry.gratitude_why_meaningful}</p>
                </div>
              )}
              {entry.gratitude_feeling && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">How it made me feel</p>
                  <p className="text-2xl">{getEmoji(entry.gratitude_feeling, 'gratitude')}</p>
                </div>
              )}
            </>
          )}

          {/* Open Ended */}
          {journalType === 'open_ended' && (
            <>
              {entry.prompt_used && (
                <div className="text-sm text-gray-500 italic">
                  Prompt: {entry.prompt_used}
                </div>
              )}
              {entry.content && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{entry.content}</p>
                </div>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {entry.word_count && (
                <p className="text-xs text-gray-400">{entry.word_count} words</p>
              )}
            </>
          )}

          {/* I Know */}
          {journalType === 'i_know' && (
            <>
              {entry.i_know_statement && (
                <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <p className={`text-lg font-medium ${colors.text}`}>
                    I know {entry.i_know_statement}
                  </p>
                </div>
              )}
              {entry.i_know_why_matters && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Why it matters</p>
                  <p className="text-gray-900">{entry.i_know_why_matters}</p>
                </div>
              )}
              {entry.i_know_feeling && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">How this makes me feel</p>
                  <p className="text-2xl">{getEmoji(entry.i_know_feeling, 'i_know')}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Button */}
        <div className="p-4 border-t border-gray-100">
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={onDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Delete Entry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Page Component
export default function JournalTypePage() {
  const router = useRouter()
  const params = useParams()
  const journalType = params.type as string

  const [config, setConfig] = useState<JournalConfig | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  const colors = typeColors[journalType] || typeColors.open_ended
  const typeInfo = config?.journal_types.find(t => t.key === journalType)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configData, entriesData] = await Promise.all([
          apiGet<JournalConfig>('/journals/config'),
          apiGet<{ entries: JournalEntry[]; total: number }>(`/journals/me?journal_type=${journalType}&limit=50`),
        ])
        setConfig(configData)
        setEntries(entriesData.entries)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [journalType])

  // Load calendar data when month changes
  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const data = await apiGet<CalendarData>(
          `/journals/me/calendar?year=${currentMonth.year}&month=${currentMonth.month}`
        )
        setCalendarData(data)
      } catch (err) {
        console.error('Failed to load calendar:', err)
      }
    }
    loadCalendar()
  }, [currentMonth])

  const handleNewEntry = () => {
    router.push(`/tools/journaling/new?type=${journalType}`)
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await apiDelete(`/journals/${entryId}`)
      setEntries(entries.filter(e => e.id !== entryId))
      setSelectedEntry(null)
      // Reload calendar
      const data = await apiGet<CalendarData>(
        `/journals/me/calendar?year=${currentMonth.year}&month=${currentMonth.month}`
      )
      setCalendarData(data)
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
  }

  // Validate journal type
  const validTypes = ['affirmations', 'daily_wins', 'gratitude', 'open_ended', 'i_know']
  if (!validTypes.includes(journalType)) {
    router.push('/tools/journaling')
    return null
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${colors.gradient} to-white`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.gradient} to-white`}>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/tools/journaling')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={`${colors.text}`}>{icons[typeIcons[journalType]]}</div>
          <h1 className="text-xl font-bold text-gray-900">{typeInfo?.label || 'Journal'}</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Entry List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mini Calendar on mobile */}
            <div className="lg:hidden">
              <MiniCalendar
                calendarData={calendarData}
                currentMonth={currentMonth}
                onMonthChange={(year, month) => setCurrentMonth({ year, month })}
                journalType={journalType}
              />
            </div>

            {/* New Entry Button - Mobile */}
            <button
              onClick={handleNewEntry}
              className={`lg:hidden w-full flex items-center justify-center gap-2 py-3 ${colors.button} text-white rounded-xl font-medium transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New {typeInfo?.label} Entry
            </button>

            {/* Entries List */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                {entries.length === 0 ? 'No entries yet' : `Past Entries (${entries.length})`}
              </h2>

              {entries.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <div className={colors.text}>{icons[typeIcons[journalType]]}</div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Start your first entry</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {journalType === 'affirmations' && 'Practice intentional self-talk to build confidence'}
                    {journalType === 'daily_wins' && 'Celebrate your achievements, big or small'}
                    {journalType === 'gratitude' && 'Build appreciation and perspective'}
                    {journalType === 'open_ended' && 'Write freely about what\'s on your mind'}
                    {journalType === 'i_know' && 'Anchor yourself with what you know to be true'}
                  </p>
                  <button
                    onClick={handleNewEntry}
                    className={`px-6 py-2 ${colors.button} text-white rounded-lg font-medium transition-colors`}
                  >
                    Get Started
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      config={config}
                      journalType={journalType}
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Calendar & CTA */}
          <div className="hidden lg:block space-y-4">
            {/* Mini Calendar */}
            <MiniCalendar
              calendarData={calendarData}
              currentMonth={currentMonth}
              onMonthChange={(year, month) => setCurrentMonth({ year, month })}
              journalType={journalType}
            />

            {/* New Entry CTA */}
            <div className={`${colors.bg} border ${colors.border} rounded-xl p-5`}>
              <div className={`${colors.text} mb-3`}>
                {icons[typeIcons[journalType]]}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Ready to write?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {journalType === 'affirmations' && 'Choose an affirmation that resonates with you today.'}
                {journalType === 'daily_wins' && 'Reflect on what went well today.'}
                {journalType === 'gratitude' && 'Take a moment to appreciate something in your life.'}
                {journalType === 'open_ended' && 'Write whatever is on your mind.'}
                {journalType === 'i_know' && 'Ground yourself in something you know to be true.'}
              </p>
              <button
                onClick={handleNewEntry}
                className={`w-full flex items-center justify-center gap-2 py-3 ${colors.button} text-white rounded-xl font-medium transition-colors`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Entry
              </button>
            </div>

            {/* Stats */}
            {entries.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-2">This month</p>
                <p className={`text-2xl font-bold ${colors.text}`}>
                  {calendarData?.dates_with_entries.reduce((acc, d) => {
                    return acc + d.entries.filter(e => e.journal_type === journalType).length
                  }, 0) || 0}
                </p>
                <p className="text-sm text-gray-500">entries</p>
              </div>
            )}
          </div>
        </div>

        {/* Entry Detail Modal */}
        {selectedEntry && (
          <EntryDetailModal
            entry={selectedEntry}
            config={config}
            journalType={journalType}
            onClose={() => setSelectedEntry(null)}
            onDelete={() => handleDeleteEntry(selectedEntry.id)}
          />
        )}
      </div>
    </div>
  )
}
