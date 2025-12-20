'use client'

import React from 'react'
import { getModuleColors, ModuleColorClasses } from '@/lib/colors'

/**
 * Props for the ScreenLayout component
 */
interface ScreenLayoutProps {
  /** Child content to render in the main area */
  children: React.ReactNode
  /** Module color for theming */
  moduleColor: string
  /** Whether to use a gradient background instead of plain white */
  useGradientBackground?: boolean
  /** Custom className for the container */
  className?: string
}

/**
 * Props for the ContinueButton component
 */
interface ContinueButtonProps {
  /** Click handler */
  onClick: () => void
  /** Whether the button is disabled */
  disabled?: boolean
  /** Module color for theming */
  moduleColor: string
  /** Button text (defaults to "Continue") */
  label?: string
  /** Whether to add a shadow to the button */
  withShadow?: boolean
}

/**
 * Standard continue button used across training screens.
 * Provides consistent styling and theming.
 *
 * @example
 * ```tsx
 * <ContinueButton
 *   onClick={handleContinue}
 *   disabled={!canContinue}
 *   moduleColor={moduleColor}
 * />
 * ```
 */
export function ContinueButton({
  onClick,
  disabled = false,
  moduleColor,
  label = 'Continue',
  withShadow = false,
}: ContinueButtonProps) {
  const colors = getModuleColors(moduleColor)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${colors.bg} text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        withShadow ? 'shadow-lg' : ''
      }`}
    >
      {label}
    </button>
  )
}

/**
 * Standard layout wrapper for training screens.
 * Provides consistent padding, min-height, and flex layout.
 *
 * @example
 * ```tsx
 * <ScreenLayout moduleColor={moduleColor}>
 *   <div className="flex-1">
 *     {content}
 *   </div>
 *   <div className="mt-8">
 *     <ContinueButton onClick={onContinue} moduleColor={moduleColor} />
 *   </div>
 * </ScreenLayout>
 * ```
 */
export function ScreenLayout({
  children,
  moduleColor,
  useGradientBackground = false,
  className = '',
}: ScreenLayoutProps) {
  const colors = getModuleColors(moduleColor)

  const baseClasses = 'flex flex-col min-h-[calc(100vh-180px)]'
  const bgClasses = useGradientBackground
    ? `bg-gradient-to-b ${colors.gradient}`
    : ''
  const paddingClasses = useGradientBackground ? '' : 'px-4 py-8'

  return (
    <div className={`${baseClasses} ${bgClasses} ${paddingClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for the ScreenContent component
 */
interface ScreenContentProps {
  /** Child content */
  children: React.ReactNode
  /** Whether to center content vertically */
  centerVertically?: boolean
  /** Custom className */
  className?: string
}

/**
 * Content wrapper for the main content area of a screen.
 * Provides flex-1 to push continue button to bottom.
 */
export function ScreenContent({
  children,
  centerVertically = false,
  className = '',
}: ScreenContentProps) {
  const classes = centerVertically
    ? 'flex-1 flex flex-col justify-center'
    : 'flex-1'

  return <div className={`${classes} ${className}`}>{children}</div>
}

/**
 * Props for the ScreenFooter component
 */
interface ScreenFooterProps {
  /** Child content (usually a ContinueButton) */
  children: React.ReactNode
  /** Custom className */
  className?: string
}

/**
 * Footer wrapper for the continue button area.
 * Provides consistent top margin.
 */
export function ScreenFooter({ children, className = '' }: ScreenFooterProps) {
  return <div className={`mt-8 ${className}`}>{children}</div>
}

/**
 * Props for the ScreenTitle component
 */
interface ScreenTitleProps {
  /** Title text */
  children: React.ReactNode
  /** Optional subtitle/instruction */
  subtitle?: string
  /** Custom className */
  className?: string
}

/**
 * Standard title component for screen headers.
 */
export function ScreenTitle({ children, subtitle, className = '' }: ScreenTitleProps) {
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{children}</h2>
      {subtitle && <p className="text-gray-500 text-sm mb-6">{subtitle}</p>}
    </div>
  )
}

/**
 * Props for SelectionOption component
 */
interface SelectionOptionProps {
  /** Whether this option is selected */
  isSelected: boolean
  /** Click handler */
  onClick: () => void
  /** Module color for theming */
  moduleColor: string
  /** Option content */
  children: React.ReactNode
  /** Whether to use radio button style (single select) or checkbox style (multi-select) */
  variant?: 'radio' | 'checkbox'
  /** Custom className */
  className?: string
}

/**
 * Reusable selection option component with consistent styling.
 * Used for both single-select and multi-select screens.
 */
export function SelectionOption({
  isSelected,
  onClick,
  moduleColor,
  children,
  variant = 'radio',
  className = '',
}: SelectionOptionProps) {
  const colors = getModuleColors(moduleColor)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? `${colors.bgLight} ${colors.border} ${colors.ring} ring-2`
          : 'bg-white border-gray-200 hover:border-gray-300'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 ${
            variant === 'radio' ? 'rounded-full' : 'rounded'
          } border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
            isSelected ? colors.border : 'border-gray-300'
          } ${isSelected && variant === 'checkbox' ? colors.bg : ''}`}
        >
          {isSelected && variant === 'radio' && (
            <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
          )}
          {isSelected && variant === 'checkbox' && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        {children}
      </div>
    </button>
  )
}

/**
 * Combined export of all layout components for convenient importing
 */
export const Screen = {
  Layout: ScreenLayout,
  Content: ScreenContent,
  Footer: ScreenFooter,
  Title: ScreenTitle,
  ContinueButton,
  SelectionOption,
}

export default Screen
