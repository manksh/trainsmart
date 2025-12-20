'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * State for async data fetching
 */
export interface AsyncState<T> {
  /** The fetched data */
  data: T | null
  /** Whether data is currently being fetched */
  isLoading: boolean
  /** Error if the fetch failed */
  error: Error | null
  /** Whether the initial fetch has completed (success or error) */
  isInitialized: boolean
}

/**
 * Options for the useAsyncData hook
 */
export interface UseAsyncDataOptions<T> {
  /** Initial data value (before first fetch) */
  initialData?: T | null
  /** Whether to fetch immediately on mount */
  fetchOnMount?: boolean
  /** Dependencies that trigger a refetch when changed */
  dependencies?: unknown[]
  /** Callback when fetch succeeds */
  onSuccess?: (data: T) => void
  /** Callback when fetch fails */
  onError?: (error: Error) => void
}

/**
 * Result of the useAsyncData hook
 */
export interface UseAsyncDataResult<T> extends AsyncState<T> {
  /** Manually trigger a refetch */
  refetch: () => Promise<void>
  /** Reset to initial state */
  reset: () => void
  /** Update the data without refetching */
  setData: (data: T | null) => void
}

/**
 * Custom hook for fetching async data with loading, error, and success states.
 * Provides a clean interface for handling async operations in components.
 *
 * @example Basic usage
 * ```tsx
 * const { data, isLoading, error } = useAsyncData(
 *   () => apiGet<User[]>('/users'),
 *   { fetchOnMount: true }
 * );
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <UserList users={data} />;
 * ```
 *
 * @example With dependencies
 * ```tsx
 * const { data, isLoading } = useAsyncData(
 *   () => apiGet<Posts>(`/users/${userId}/posts`),
 *   { fetchOnMount: true, dependencies: [userId] }
 * );
 * ```
 *
 * @example Manual refetch
 * ```tsx
 * const { data, refetch } = useAsyncData(fetchData);
 *
 * return (
 *   <div>
 *     <button onClick={refetch}>Refresh</button>
 *     {data && <DataDisplay data={data} />}
 *   </div>
 * );
 * ```
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataResult<T> {
  const {
    initialData = null,
    fetchOnMount = true,
    dependencies = [],
    onSuccess,
    onError,
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: fetchOnMount,
    error: null,
    isInitialized: false,
  })

  const fetchData = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const data = await fetchFn()
      setState({
        data,
        isLoading: false,
        error: null,
        isInitialized: true,
      })
      onSuccess?.(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
        isInitialized: true,
      }))
      onError?.(error)
    }
  }, [fetchFn, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
      isInitialized: false,
    })
  }, [initialData])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  // Fetch on mount if enabled
  useEffect(() => {
    if (fetchOnMount) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return {
    ...state,
    refetch: fetchData,
    reset,
    setData,
  }
}

/**
 * Simplified version for cases where you just need loading/error/data states
 */
export function useSimpleAsync<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; isLoading: boolean; error: Error | null } {
  const { data, isLoading, error } = useAsyncData(fetchFn, {
    fetchOnMount: true,
    dependencies: deps,
  })

  return { data, isLoading, error }
}

/**
 * Hook for handling async mutations (POST, PUT, DELETE) with loading and error states
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useAsyncMutation(
 *   (data: CreateUserData) => apiPost('/users', data),
 *   { onSuccess: () => refetchUsers() }
 * );
 *
 * const handleSubmit = async (data: CreateUserData) => {
 *   await mutate(data);
 * };
 * ```
 */
export function useAsyncMutation<TData, TResult = void>(
  mutationFn: (data: TData) => Promise<TResult>,
  options: {
    onSuccess?: (result: TResult) => void
    onError?: (error: Error) => void
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (data: TData): Promise<TResult | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await mutationFn(data)
        options.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        options.onError?.(error)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn, options]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return { mutate, isLoading, error, reset }
}

export default useAsyncData
