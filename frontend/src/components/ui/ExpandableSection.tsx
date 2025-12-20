'use client'

import React from 'react'

/**
 * Base option type for expandable section items
 */
export interface ExpandableSectionOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  route: string
  isPlaceholder?: boolean
}

/**
 * Props for the ExpandableSection component
 */
export interface ExpandableSectionProps {
  /** Section title displayed in the header */
  title: string
  /** Icon displayed in the header */
  icon: React.ReactNode
  /** Text color class for the icon (e.g., 'text-blue-600') */
  color: string
  /** Background color class for the icon container (e.g., 'bg-blue-100') */
  bgColor: string
  /** Array of options to display when expanded */
  options: ExpandableSectionOption[]
  /** Whether the section is currently expanded */
  isExpanded: boolean
  /** Callback when the section header is clicked */
  onToggle: () => void
  /** Callback when an option is selected */
  onSelect: (route: string) => void
  /** Optional custom className for the container */
  className?: string
}

/**
 * Chevron icon used for expand/collapse indication
 */
function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/**
 * Right arrow icon used for navigation indication
 */
function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

/**
 * An expandable/collapsible section with a header and list of options.
 * Used for organizing navigation items like check-ins or tools.
 *
 * @example
 * ```tsx
 * <ExpandableSection
 *   title="Check-ins"
 *   icon={<CheckIcon />}
 *   color="text-blue-600"
 *   bgColor="bg-blue-100"
 *   options={checkInOptions}
 *   isExpanded={isExpanded}
 *   onToggle={() => setIsExpanded(!isExpanded)}
 *   onSelect={(route) => router.push(route)}
 * />
 * ```
 */
export function ExpandableSection({
  title,
  icon,
  color,
  bgColor,
  options,
  isExpanded,
  onToggle,
  onSelect,
  className = '',
}: ExpandableSectionProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
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
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-2">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => option.isPlaceholder ? null : onSelect(option.route)}
              disabled={option.isPlaceholder}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                option.isPlaceholder
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
                  {option.isPlaceholder && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{option.description}</p>
              </div>
              {!option.isPlaceholder && <ArrowRightIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Props for a section within a grouped expandable section
 */
export interface ExpandableSectionGroup {
  title: string
  options: ExpandableSectionOption[]
}

/**
 * Props for the GroupedExpandableSection component
 */
export interface GroupedExpandableSectionProps {
  /** Section title displayed in the header */
  title: string
  /** Icon displayed in the header */
  icon: React.ReactNode
  /** Text color class for the icon */
  color: string
  /** Background color class for the icon container */
  bgColor: string
  /** Array of groups, each with a title and options */
  groups: ExpandableSectionGroup[]
  /** Whether the section is currently expanded */
  isExpanded: boolean
  /** Callback when the section header is clicked */
  onToggle: () => void
  /** Callback when an option is selected */
  onSelect: (route: string) => void
  /** Optional custom className */
  className?: string
}

/**
 * An expandable section that groups options into labeled sub-sections.
 * Useful for organizing related items like "Tools" and "Modules" under a single "Train" section.
 *
 * @example
 * ```tsx
 * <GroupedExpandableSection
 *   title="Train"
 *   icon={<TrainIcon />}
 *   color="text-indigo-600"
 *   bgColor="bg-indigo-100"
 *   groups={[
 *     { title: 'Tools', options: toolOptions },
 *     { title: 'Modules', options: moduleOptions },
 *   ]}
 *   isExpanded={isExpanded}
 *   onToggle={() => setIsExpanded(!isExpanded)}
 *   onSelect={(route) => router.push(route)}
 * />
 * ```
 */
export function GroupedExpandableSection({
  title,
  icon,
  color,
  bgColor,
  groups,
  isExpanded,
  onToggle,
  onSelect,
  className = '',
}: GroupedExpandableSectionProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
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
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      {/* Expanded content with groups */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {groups.map((group, groupIndex) => (
            <div key={group.title}>
              {/* Divider between groups */}
              {groupIndex > 0 && <div className="border-t border-gray-100 mx-3" />}

              {/* Group section */}
              <div className={`p-3 ${groupIndex > 0 ? 'pt-2' : 'pb-2'}`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.options.map((option) => (
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
                      {!option.isPlaceholder && <ArrowRightIcon />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExpandableSection
