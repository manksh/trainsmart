'use client'

import React, { ReactNode, Suspense } from 'react'
import { ErrorBoundary, CardErrorFallback, CompactErrorFallback, DefaultErrorFallback, ErrorFallbackProps } from './ErrorBoundary'

/**
 * Loading skeleton component for card-style content
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-gray-200 rounded"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Loading skeleton for inline content
 */
export function InlineSkeleton({ width = 'w-24' }: { width?: string }) {
  return (
    <div className={`h-4 bg-gray-200 rounded animate-pulse ${width}`} />
  )
}

/**
 * Loading skeleton for a list of items
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Props for the AsyncBoundary component
 */
interface AsyncBoundaryProps {
  /** Child components (typically async components) */
  children: ReactNode
  /** Loading fallback to show while loading */
  loadingFallback?: ReactNode
  /** Error fallback type or custom component */
  errorFallback?: 'default' | 'card' | 'compact' | ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Name for error logging */
  name?: string
  /** Custom error handler */
  onError?: (error: Error) => void
}

/**
 * Combined Suspense and ErrorBoundary wrapper for async components.
 * Provides both loading and error states with customizable fallbacks.
 *
 * @example Basic usage
 * ```tsx
 * <AsyncBoundary loadingFallback={<CardSkeleton />}>
 *   <AsyncDataComponent />
 * </AsyncBoundary>
 * ```
 *
 * @example With card-style error fallback
 * ```tsx
 * <AsyncBoundary
 *   loadingFallback={<CardSkeleton />}
 *   errorFallback="card"
 *   name="WeeklyActivity"
 * >
 *   <WeeklyActivityTracker />
 * </AsyncBoundary>
 * ```
 */
export function AsyncBoundary({
  children,
  loadingFallback = <CardSkeleton />,
  errorFallback = 'default',
  name,
  onError,
}: AsyncBoundaryProps) {
  // Determine the error fallback component
  const getErrorFallback = (error: Error, reset: () => void) => {
    if (typeof errorFallback === 'function') {
      return errorFallback(error, reset)
    }

    if (React.isValidElement(errorFallback)) {
      return errorFallback
    }

    const fallbackProps: ErrorFallbackProps = { error, onReset: reset }

    switch (errorFallback) {
      case 'card':
        return <CardErrorFallback {...fallbackProps} />
      case 'compact':
        return <CompactErrorFallback {...fallbackProps} />
      case 'default':
      default:
        return <DefaultErrorFallback {...fallbackProps} />
    }
  }

  return (
    <ErrorBoundary
      fallback={getErrorFallback}
      name={name}
      onError={onError ? (error) => onError(error) : undefined}
    >
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Pre-configured AsyncBoundary for dashboard cards
 */
export function DashboardCardBoundary({
  children,
  name,
  lines = 3,
}: {
  children: ReactNode
  name?: string
  lines?: number
}) {
  return (
    <AsyncBoundary
      loadingFallback={<CardSkeleton lines={lines} />}
      errorFallback="card"
      name={name}
    >
      {children}
    </AsyncBoundary>
  )
}

/**
 * Pre-configured AsyncBoundary for list content
 */
export function ListBoundary({
  children,
  name,
  items = 3,
}: {
  children: ReactNode
  name?: string
  items?: number
}) {
  return (
    <AsyncBoundary
      loadingFallback={<ListSkeleton items={items} />}
      errorFallback="compact"
      name={name}
    >
      {children}
    </AsyncBoundary>
  )
}

export default AsyncBoundary
