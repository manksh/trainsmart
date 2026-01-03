'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive breakpoint detection.
 * Uses matchMedia API to listen for media query changes.
 *
 * @param query - CSS media query string (e.g., '(min-width: 1024px)')
 * @returns boolean indicating if the media query matches
 *
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * return isDesktop ? <DesktopLayout /> : <MobileLayout />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on server-side
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener (using addEventListener for modern browsers)
    mediaQuery.addEventListener('change', handler)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

/**
 * Predefined breakpoint hooks for common Tailwind breakpoints
 */
export const useIsSmall = () => useMediaQuery('(min-width: 640px)')
export const useIsMedium = () => useMediaQuery('(min-width: 768px)')
export const useIsLarge = () => useMediaQuery('(min-width: 1024px)')
export const useIsXLarge = () => useMediaQuery('(min-width: 1280px)')

export default useMediaQuery
