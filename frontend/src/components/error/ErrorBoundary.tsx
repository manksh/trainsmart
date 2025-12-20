'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode
  /** Custom fallback UI to render when an error occurs */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Optional name for logging purposes */
  name?: string
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire app.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />} name="Dashboard">
 *   <DashboardContent />
 * </ErrorBoundary>
 * ```
 *
 * @example With reset capability
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Something went wrong: {error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <DashboardContent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, name } = this.props

    // Log error to console with context
    console.error(
      `[ErrorBoundary${name ? `: ${name}` : ''}] Error caught:`,
      error,
      errorInfo
    )

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // If fallback is a function, call it with error and reset function
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset)
      }

      // If fallback is provided as ReactNode, render it
      if (fallback) {
        return fallback
      }

      // Default fallback UI
      return <DefaultErrorFallback error={error} onReset={this.handleReset} />
    }

    return children
  }
}

/**
 * Props for error fallback components
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error
  /** Function to reset the error boundary and retry */
  onReset?: () => void
  /** Optional title for the error message */
  title?: string
  /** Whether to show the error details (dev mode) */
  showDetails?: boolean
}

/**
 * Default error fallback component with a clean, user-friendly design
 */
export function DefaultErrorFallback({
  error,
  onReset,
  title = 'Something went wrong',
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 rounded-xl border border-red-200">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-4 max-w-sm">
        We encountered an unexpected error. Please try again.
      </p>
      {showDetails && (
        <details className="mb-4 max-w-md">
          <summary className="text-sm text-red-600 cursor-pointer hover:underline">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/**
 * Compact error fallback for inline/card errors
 */
export function CompactErrorFallback({
  error,
  onReset,
  title = 'Error loading content',
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
        <svg
          className="w-4 h-4 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 truncate">{error.message}</p>
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  )
}

/**
 * Card-level error fallback that matches the card styling
 */
export function CardErrorFallback({
  error,
  onReset,
  title = 'Unable to load',
}: ErrorFallbackProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">
            {error.message || 'Something went wrong'}
          </p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundary
