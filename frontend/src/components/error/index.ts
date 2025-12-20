/**
 * Error handling components and utilities
 *
 * This module provides error boundary components and async loading wrappers
 * for building resilient React applications.
 */

export {
  ErrorBoundary,
  DefaultErrorFallback,
  CompactErrorFallback,
  CardErrorFallback,
} from './ErrorBoundary'

export type { ErrorFallbackProps } from './ErrorBoundary'

export {
  AsyncBoundary,
  DashboardCardBoundary,
  ListBoundary,
  CardSkeleton,
  InlineSkeleton,
  ListSkeleton,
} from './AsyncBoundary'
