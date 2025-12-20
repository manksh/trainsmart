'use client'

import React from 'react'

/**
 * Base props for all icon components
 */
export interface IconProps {
  /** Additional CSS classes */
  className?: string
  /** Icon size - defaults to 'md' (w-5 h-5) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Stroke width - defaults to 2 */
  strokeWidth?: number
}

/**
 * Size class mappings
 */
const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

/**
 * Base SVG wrapper for consistent icon rendering
 */
function IconBase({
  className = '',
  size = 'md',
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
    >
      {children}
    </svg>
  )
}

// ============================================================================
// Navigation Icons
// ============================================================================

/** Chevron pointing left - for back navigation */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </IconBase>
  )
}

/** Chevron pointing right - for forward navigation */
export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </IconBase>
  )
}

/** Chevron pointing down - for expandable sections */
export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </IconBase>
  )
}

/** Chevron pointing up */
export function ChevronUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </IconBase>
  )
}

/** X/Close icon */
export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </IconBase>
  )
}

/** Home icon */
export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </IconBase>
  )
}

/** Logout icon */
export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </IconBase>
  )
}

// ============================================================================
// Action Icons
// ============================================================================

/** Checkmark icon */
export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </IconBase>
  )
}

/** Check in circle icon */
export function CheckCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
  )
}

/** Plus icon */
export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </IconBase>
  )
}

/** Minus icon */
export function MinusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </IconBase>
  )
}

/** Edit/Pencil icon */
export function EditIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </IconBase>
  )
}

/** Trash/Delete icon */
export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </IconBase>
  )
}

// ============================================================================
// Feature Icons (Check-ins, Training, Tools)
// ============================================================================

/** Heart icon - for mood check-ins */
export function HeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </IconBase>
  )
}

/** Lightning bolt icon - for energy check-ins */
export function LightningBoltIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </IconBase>
  )
}

/** Badge/Shield icon - for confidence check-ins */
export function BadgeCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </IconBase>
  )
}

/** Cloud/Breathing icon */
export function CloudIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </IconBase>
  )
}

/** Lightbulb icon - for insights */
export function LightbulbIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </IconBase>
  )
}

/** Book icon - for modules/learning */
export function BookOpenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </IconBase>
  )
}

/** Eye icon - for viewing */
export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </IconBase>
  )
}

/** User/Person icon */
export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </IconBase>
  )
}

/** Clipboard icon - for assessments */
export function ClipboardListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </IconBase>
  )
}

/** Sparkles icon - for gratitude/positivity */
export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </IconBase>
  )
}

/** Frown icon - for stress/worry */
export function FrownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
  )
}

/** Refresh/Repeat icon - for reflection */
export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </IconBase>
  )
}

/** Pencil alt icon - for free writing */
export function PencilAltIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </IconBase>
  )
}

/** Information circle icon */
export function InformationCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
  )
}

/** Cursor click icon - for tap interactions */
export function CursorClickIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </IconBase>
  )
}

// ============================================================================
// Status/Indicator Icons
// ============================================================================

/** Lock/Locked icon */
export function LockClosedIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </IconBase>
  )
}

/** Unlock/Unlocked icon */
export function LockOpenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </IconBase>
  )
}

/** Clock icon */
export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
  )
}

// ============================================================================
// Icon Map for Dynamic Rendering
// ============================================================================

/**
 * Map of all available icons by name
 * Useful for rendering icons dynamically based on a string identifier
 */
export const IconMap = {
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronDown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  x: XIcon,
  home: HomeIcon,
  logout: LogoutIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  edit: EditIcon,
  trash: TrashIcon,
  heart: HeartIcon,
  lightningBolt: LightningBoltIcon,
  badgeCheck: BadgeCheckIcon,
  cloud: CloudIcon,
  lightbulb: LightbulbIcon,
  bookOpen: BookOpenIcon,
  eye: EyeIcon,
  user: UserIcon,
  clipboardList: ClipboardListIcon,
  sparkles: SparklesIcon,
  frown: FrownIcon,
  refresh: RefreshIcon,
  pencilAlt: PencilAltIcon,
  informationCircle: InformationCircleIcon,
  cursorClick: CursorClickIcon,
  lockClosed: LockClosedIcon,
  lockOpen: LockOpenIcon,
  clock: ClockIcon,
} as const

export type IconName = keyof typeof IconMap

/**
 * Dynamic icon component that renders an icon by name
 *
 * @example
 * ```tsx
 * <Icon name="heart" size="lg" className="text-pink-600" />
 * ```
 */
export function Icon({ name, ...props }: { name: IconName } & IconProps) {
  const IconComponent = IconMap[name]
  return <IconComponent {...props} />
}

export default Icon
