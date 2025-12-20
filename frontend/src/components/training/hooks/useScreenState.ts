'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScreenResponse } from '../types'

/**
 * Configuration for the useScreenState hook
 */
interface UseScreenStateConfig<T> {
  /** Initial state value */
  initialState: T
  /** Optional saved response to restore from */
  savedResponse?: ScreenResponse
  /** Function to extract state from saved response */
  extractFromResponse?: (response: ScreenResponse) => T | undefined
}

/**
 * Hook result for managing screen state with save/restore capabilities
 */
interface UseScreenStateResult<T> {
  /** Current state value */
  state: T
  /** Set the state value */
  setState: React.Dispatch<React.SetStateAction<T>>
  /** Whether the state has been modified from initial/restored value */
  hasChanges: boolean
  /** Reset state to initial value */
  reset: () => void
}

/**
 * Custom hook for managing screen state with automatic restoration from saved responses.
 * Handles the common pattern of initializing state from savedResponse and tracking changes.
 *
 * @example
 * ```tsx
 * const { state: selectedOption, setState: setSelectedOption } = useScreenState({
 *   initialState: null as string | null,
 *   savedResponse,
 *   extractFromResponse: (r) => r.selection,
 * });
 * ```
 */
export function useScreenState<T>({
  initialState,
  savedResponse,
  extractFromResponse,
}: UseScreenStateConfig<T>): UseScreenStateResult<T> {
  // Initialize state, potentially from saved response
  const getInitialValue = (): T => {
    if (savedResponse && extractFromResponse) {
      const extracted = extractFromResponse(savedResponse)
      if (extracted !== undefined) {
        return extracted
      }
    }
    return initialState
  }

  const [state, setState] = useState<T>(getInitialValue)
  const [hasChanges, setHasChanges] = useState(false)

  // Restore state when savedResponse changes
  useEffect(() => {
    if (savedResponse && extractFromResponse) {
      const extracted = extractFromResponse(savedResponse)
      if (extracted !== undefined) {
        setState(extracted)
      }
    }
  }, [savedResponse, extractFromResponse])

  // Track changes
  const wrappedSetState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setHasChanges(true)
      setState(action)
    },
    []
  )

  const reset = useCallback(() => {
    setState(initialState)
    setHasChanges(false)
  }, [initialState])

  return {
    state,
    setState: wrappedSetState,
    hasChanges,
    reset,
  }
}

/**
 * Hook for managing selection state (single select)
 */
export function useSelectionState(savedResponse?: ScreenResponse) {
  return useScreenState<string | null>({
    initialState: null,
    savedResponse,
    extractFromResponse: (r) => r.selection,
  })
}

/**
 * Hook for managing multi-selection state
 */
export function useMultiSelectionState(savedResponse?: ScreenResponse) {
  return useScreenState<string[]>({
    initialState: [],
    savedResponse,
    extractFromResponse: (r) => r.selections,
  })
}

/**
 * Hook for managing text input state
 */
export function useTextInputState(savedResponse?: ScreenResponse) {
  return useScreenState<string>({
    initialState: '',
    savedResponse,
    extractFromResponse: (r) => r.text_input,
  })
}

/**
 * Hook for managing revealed items state (for tap-to-reveal screens)
 */
export function useRevealedItemsState(savedResponse?: ScreenResponse) {
  return useScreenState<string[]>({
    initialState: [],
    savedResponse,
    extractFromResponse: (r) => r.revealed_items,
  })
}

/**
 * Hook for managing category assignments state
 */
export function useCategoryAssignmentsState(savedResponse?: ScreenResponse) {
  return useScreenState<Record<string, string>>({
    initialState: {},
    savedResponse,
    extractFromResponse: (r) => r.category_assignments,
  })
}
