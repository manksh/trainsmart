'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGetCached } from '@/lib/api'
import type { PillarKey } from '@/lib/mpaDefinitions'

/**
 * A single coaching tip with practice and game day recommendations
 */
export interface CoachingTipContent {
  practice: string
  game_day: string
}

/**
 * Tips for a single pillar
 */
export interface PillarTips {
  pillar: string
  display_name: string
  strength_tips: CoachingTipContent
  growth_tips: CoachingTipContent
}

/**
 * Response from the coaching tips API endpoint
 */
export interface CoachingTipsResponse {
  /** Tips for all pillars, keyed by pillar name */
  tips: Record<string, PillarTips>
  /** Thresholds for strength/growth classification */
  thresholds: {
    strength: number
    growth: number
  }
}

/**
 * Context type for a tip - whether it's for a strength or growth area
 */
export type TipContext = 'strength' | 'growth'

/**
 * Determines the context (strength or growth) for a pillar based on the user's assessment
 * @param pillar - The pillar key to check
 * @param strengths - Array of pillar keys identified as strengths
 * @param growthAreas - Array of pillar keys identified as growth areas
 * @returns The context type or null if pillar is neither a strength nor growth area
 */
export function getTipContext(
  pillar: string,
  strengths: string[] | null,
  growthAreas: string[] | null
): TipContext | null {
  if (strengths?.includes(pillar)) {
    return 'strength'
  }
  if (growthAreas?.includes(pillar)) {
    return 'growth'
  }
  return null
}

interface UseCoachingTipsOptions {
  /** Whether to enable the query (default: true) */
  enabled?: boolean
}

/**
 * Hook to fetch coaching tips (static data for all pillars).
 * Uses React Query with 24-hour stale time for caching since tips don't change.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCoachingTips();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage />;
 *
 * // Get tips for a specific pillar based on athlete's assessment
 * const pillarTips = data?.tips['confidence'];
 * const context = getTipContext('confidence', athlete.strengths, athlete.growth_areas);
 * const tips = context === 'strength' ? pillarTips?.strength_tips : pillarTips?.growth_tips;
 * ```
 */
export function useCoachingTips({ enabled = true }: UseCoachingTipsOptions = {}) {
  return useQuery<CoachingTipsResponse>({
    queryKey: ['coaching-tips'],
    queryFn: () => apiGetCached<CoachingTipsResponse>('/coaching-tips'),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - tips don't change
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
  })
}

export default useCoachingTips
