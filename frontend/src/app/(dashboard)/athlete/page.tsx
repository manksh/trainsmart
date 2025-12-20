'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiDelete } from '@/lib/api'

interface UserMembership {
  organization_id: string
  organization_name: string
  role: string
  joined_at: string
}

interface FullUser {
  id: string
  email: string
  first_name: string
  last_name: string
  is_superadmin: boolean
  memberships: UserMembership[]
}

interface AssessmentStatus {
  has_completed: boolean
  response_id: string | null
  completed_at: string | null
}

interface AssessmentResult {
  id: string
  meta_scores: {
    thinking: number
    feeling: number
    action: number
  } | null
}

// === Check-in Types ===
interface CheckInOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
}

const CHECK_IN_OPTIONS: CheckInOption[] = [
  {
    id: 'mood',
    name: 'Mood',
    description: 'How are you feeling right now?',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    route: '/checkin/mood',
  },
  {
    id: 'energy',
    name: 'Energy',
    description: 'Track physical & mental energy',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    route: '/checkin/energy',
  },
  {
    id: 'confidence',
    name: 'Confidence',
    description: 'Rate your current confidence',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    route: '/checkin/confidence',
  },
]

// === Train Item Types ===
interface TrainItem {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
  isPlaceholder?: boolean
}

const TOOL_OPTIONS: TrainItem[] = [
  {
    id: 'breathing',
    name: 'Breathing',
    description: 'Energize, relax, or focus',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    route: '/tools/breathing',
  },
  {
    id: 'journaling',
    name: 'Journaling',
    description: 'Reflect and process thoughts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    route: '/tools/journaling',
  },
]

// Module icons by name (matching the Train page)
const moduleIcons: Record<string, React.ReactNode> = {
  brain: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  heart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
}

// Color mapping from API color names to Tailwind classes
const colorMapping: Record<string, { text: string; bg: string }> = {
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-100' },
  rose: { text: 'text-rose-600', bg: 'bg-rose-100' },
  cyan: { text: 'text-cyan-600', bg: 'bg-cyan-100' },
}

// Placeholder modules for upcoming features
const PLACEHOLDER_MODULES: TrainItem[] = [
  {
    id: 'confidence-building',
    name: 'Building Confidence',
    description: 'Build unshakeable self-belief',
    icon: moduleIcons.trophy,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    route: '/train/confidence',
    isPlaceholder: true,
  },
  {
    id: 'focus-attention',
    name: 'Focus & Attention',
    description: 'Sharpen your concentration',
    icon: moduleIcons.target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    route: '/train/focus',
    isPlaceholder: true,
  },
]

// API Types for modules
interface ModuleListItem {
  slug: string
  name: string
  description: string
  icon: string
  color: string
  estimated_minutes: number
  is_premium: boolean
}

interface ModuleStatusItem {
  module_slug: string
  progress_percentage: number
  is_completed: boolean
}

interface ModulesConfig {
  modules: ModuleListItem[]
}

interface AllModulesStatus {
  modules: ModuleStatusItem[]
}

// === Dropdown Component ===
interface DropdownProps {
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  options: (CheckInOption | TrainItem)[]
  isExpanded: boolean
  onToggle: () => void
  onSelect: (route: string) => void
}

function ExpandableSection({ title, icon, color, bgColor, options, isExpanded, onToggle, onSelect }: DropdownProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`${bgColor} ${color} p-2 rounded-lg`}>
            {icon}
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-2">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => 'isPlaceholder' in option && option.isPlaceholder ? null : onSelect(option.route)}
              disabled={'isPlaceholder' in option && option.isPlaceholder}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                'isPlaceholder' in option && option.isPlaceholder
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`${option.bgColor} ${option.color} p-2 rounded-lg`}>
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{option.name}</p>
                  {'isPlaceholder' in option && option.isPlaceholder && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{option.description}</p>
              </div>
              {!('isPlaceholder' in option && option.isPlaceholder) && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// === Train Dropdown with Sub-sections ===
interface TrainDropdownProps {
  isExpanded: boolean
  onToggle: () => void
  onSelect: (route: string) => void
  modules: TrainItem[]
}

function TrainDropdown({ isExpanded, onToggle, onSelect, modules }: TrainDropdownProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Train</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tools Section */}
          <div className="p-3 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Tools</p>
            <div className="space-y-1">
              {TOOL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => option.isPlaceholder ? null : onSelect(option.route)}
                  disabled={option.isPlaceholder}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    option.isPlaceholder
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`${option.bgColor} ${option.color} p-1.5 rounded-lg`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{option.name}</p>
                      {option.isPlaceholder && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{option.description}</p>
                  </div>
                  {!option.isPlaceholder && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mx-3" />

          {/* Modules Section */}
          <div className="p-3 pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Modules</p>
            <div className="space-y-1">
              {modules.map((option) => (
                <button
                  key={option.id}
                  onClick={() => option.isPlaceholder ? null : onSelect(option.route)}
                  disabled={option.isPlaceholder}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    option.isPlaceholder
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`${option.bgColor} ${option.color} p-1.5 rounded-lg`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{option.name}</p>
                      {option.isPlaceholder && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{option.description}</p>
                  </div>
                  {!option.isPlaceholder && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// === Weekly Activity Types ===
interface DailyActivity {
  date: string
  day_name: string
  has_activity: boolean
  is_today: boolean
  is_past: boolean
}

interface WeeklyActivityData {
  week_start: string
  week_end: string
  daily_activity: DailyActivity[]
  active_days: number
  total_days: number
}

// === Check-in History Types ===
interface CheckInHistoryItem {
  id: string
  check_in_type: string
  emotion?: string
  intensity?: number
  confidence_level?: number
  physical_energy?: number
  mental_energy?: number
  breathing_exercise_type?: string
  created_at: string
}

interface CheckInHistoryData {
  check_ins: CheckInHistoryItem[]
  total: number
  page: number
  page_size: number
}

// === Weekly Activity Tracker ===
function WeeklyActivityTracker() {
  const [activityData, setActivityData] = useState<WeeklyActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const data = await apiGet<WeeklyActivityData>('/checkins/me/activity/week')
        setActivityData(data)
      } catch (err) {
        console.error('Failed to load weekly activity:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadActivity()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="flex justify-between gap-1 sm:gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-3 w-6 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const days = activityData?.daily_activity || []
  const activeDays = activityData?.active_days || 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Your Week</h3>
        <span className="text-sm text-gray-500">
          {activeDays}/7 days active
        </span>
      </div>
      <div className="flex justify-between gap-1 sm:gap-2">
        {days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-2">
            <span className={`text-xs font-medium ${day.is_today ? 'text-blue-600' : 'text-gray-500'}`}>
              {day.day_name}
            </span>
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                day.has_activity
                  ? 'bg-green-100 text-green-600'
                  : day.is_today
                    ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600 ring-offset-2'
                    : day.is_past
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gray-50 text-gray-300'
              }`}
            >
              {day.has_activity ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : day.is_today ? (
                <span className="text-xs font-bold">!</span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-4">
        Complete a check-in, use a tool, or do a module to mark a day active
      </p>
    </div>
  )
}

// === Check-in History Component ===
function CheckInHistory() {
  const router = useRouter()
  const [history, setHistory] = useState<CheckInHistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiGet<CheckInHistoryData>('/checkins/me?page=1&page_size=10')
        setHistory(data)
      } catch (err) {
        console.error('Failed to load check-in history:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [])

  const getCheckInIcon = (type: string) => {
    switch (type) {
      case 'mood':
        return (
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )
      case 'confidence':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        )
      case 'energy':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )
      case 'breathing':
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getCheckInSummary = (item: CheckInHistoryItem) => {
    switch (item.check_in_type) {
      case 'mood':
        return item.emotion ? `Feeling ${item.emotion}${item.intensity ? ` (${item.intensity}/7)` : ''}` : 'Mood check-in'
      case 'confidence':
        return item.confidence_level ? `Confidence level: ${item.confidence_level}/7` : 'Confidence check-in'
      case 'energy':
        return item.physical_energy && item.mental_energy
          ? `Physical: ${item.physical_energy}/7, Mental: ${item.mental_energy}/7`
          : 'Energy check-in'
      case 'breathing':
        return item.breathing_exercise_type
          ? `${item.breathing_exercise_type.replace(/_/g, ' ')} exercise`
          : 'Breathing exercise'
      default:
        return 'Check-in'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ` at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!history || history.check_ins.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Recent Check-ins</h3>
        <p className="text-sm text-gray-500 text-center py-4">
          No check-ins yet. Start your first check-in above!
        </p>
      </div>
    )
  }

  const displayedCheckIns = isExpanded ? history.check_ins : history.check_ins.slice(0, 3)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Recent Check-ins</h3>
        <span className="text-sm text-gray-500">{history.total} total</span>
      </div>
      <div className="space-y-3">
        {displayedCheckIns.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {getCheckInIcon(item.check_in_type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 capitalize">
                {item.check_in_type.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getCheckInSummary(item)}
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatDate(item.created_at)}
            </span>
          </div>
        ))}
      </div>
      {history.total > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Show less' : `Show ${Math.min(history.total - 3, 7)} more`}
        </button>
      )}
    </div>
  )
}

// === Mental Performance Scores Card ===
function MentalPerformanceScores({ scores, onViewProfile }: {
  scores: { thinking: number; feeling: number; action: number }
  onViewProfile: () => void
}) {
  const maxScore = 7

  const getScoreColor = (score: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 70) return { bg: 'bg-green-100', text: 'text-green-600', bar: 'bg-green-500' }
    if (percentage >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-600', bar: 'bg-yellow-500' }
    return { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' }
  }

  const categories = [
    { key: 'thinking', label: 'Thinking', icon: '🧠', score: scores.thinking },
    { key: 'feeling', label: 'Feeling', icon: '💚', score: scores.feeling },
    { key: 'action', label: 'Acting', icon: '⚡', score: scores.action },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Mental Performance</h3>
        <button
          onClick={onViewProfile}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Full Profile
        </button>
      </div>
      <div className="space-y-3">
        {categories.map((cat) => {
          const colors = getScoreColor(cat.score)
          const percentage = (cat.score / maxScore) * 100
          return (
            <div key={cat.key} className="flex items-center gap-3">
              <span className="text-lg w-6">{cat.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                  <span className={`text-sm font-semibold ${colors.text}`}>
                    {cat.score.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} transition-all duration-500 rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// === Assessment Prompt ===
function AssessmentPrompt({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Complete Your Mental Performance Assessment
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Take a 10-minute assessment to discover your strengths and growth areas.
          </p>
          <button
            onClick={onStart}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

// === Main Page Component ===
export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [fullUser, setFullUser] = useState<FullUser | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [trainingModules, setTrainingModules] = useState<TrainItem[]>(PLACEHOLDER_MODULES)

  // Dropdown states
  const [checkInsExpanded, setCheckInsExpanded] = useState(false)
  const [trainExpanded, setTrainExpanded] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        const [userData, status, modulesConfig, modulesStatus] = await Promise.all([
          apiGet<FullUser>('/users/me/full'),
          apiGet<AssessmentStatus>('/assessments/me/status'),
          apiGet<ModulesConfig>('/training-modules/config').catch(() => ({ modules: [] })),
          apiGet<AllModulesStatus>('/training-modules/status/me').catch(() => ({ modules: [] })),
        ])

        setFullUser(userData)
        setAssessmentStatus(status)

        // Map API modules to TrainItem format
        if (modulesConfig.modules.length > 0) {
          const apiModules: TrainItem[] = modulesConfig.modules.map((m) => {
            const statusItem = modulesStatus.modules.find(s => s.module_slug === m.slug)
            const colors = colorMapping[m.color] || colorMapping.emerald

            return {
              id: m.slug,
              name: m.name,
              description: m.description,
              icon: moduleIcons[m.icon] || moduleIcons.book,
              color: colors.text,
              bgColor: colors.bg,
              route: `/train/${m.slug}`,
              isPlaceholder: false,
            }
          })
          // Combine API modules with placeholder modules
          setTrainingModules([...apiModules, ...PLACEHOLDER_MODULES])
        }

        // If assessment is completed, fetch the results for meta scores
        if (status.has_completed) {
          try {
            const results = await apiGet<AssessmentResult>('/assessments/results/me/latest')
            setAssessmentResult(results)
          } catch (err) {
            console.error('Failed to load assessment results:', err)
          }
        }
      } catch (err) {
        console.error('Failed to load user data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (!isLoading && user) {
      loadUserData()
    }
  }, [user, isLoading])

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasCompletedAssessment = assessmentStatus?.has_completed || false

  return (
    <main className="max-w-lg mx-auto px-4 py-6 sm:py-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hey, {fullUser?.first_name}!
        </h1>
        <p className="text-gray-500">
          Ready to train your mind today?
        </p>
      </div>

      <div className="space-y-4">
        {/* Weekly Activity Tracker */}
        <WeeklyActivityTracker />

        {/* Mental Performance Scores (if assessment completed) */}
        {hasCompletedAssessment && assessmentResult?.meta_scores && (
          <MentalPerformanceScores
            scores={assessmentResult.meta_scores}
            onViewProfile={() => router.push('/profile')}
          />
        )}

        {/* Assessment Prompt (if not completed) */}
        {!hasCompletedAssessment && (
          <AssessmentPrompt onStart={() => router.push('/assessment')} />
        )}

        {/* Check-ins Dropdown */}
        <ExpandableSection
          title="Check-ins"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-blue-600"
          bgColor="bg-blue-100"
          options={CHECK_IN_OPTIONS}
          isExpanded={checkInsExpanded}
          onToggle={() => {
            setCheckInsExpanded(!checkInsExpanded)
            if (!checkInsExpanded) setTrainExpanded(false) // Close other dropdown
          }}
          onSelect={handleNavigate}
        />

        {/* Train Dropdown (Tools + Modules) */}
        <TrainDropdown
          isExpanded={trainExpanded}
          onToggle={() => {
            setTrainExpanded(!trainExpanded)
            if (!trainExpanded) setCheckInsExpanded(false) // Close other dropdown
          }}
          onSelect={handleNavigate}
          modules={trainingModules}
        />
      </div>

      {/* Footer tip */}
      <p className="text-center text-sm text-gray-400 mt-8">
        Build consistency by checking in daily
      </p>
    </main>
  )
}
