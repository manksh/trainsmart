import { describe, it, expect } from 'vitest'
import { getTipContext, getRelevantTips, type PillarScore, type CoachingTipsData } from '../useCoachingTips'

describe('useCoachingTips helpers', () => {
  describe('getTipContext', () => {
    const thresholds = { strength: 5.5, growth: 3.5 }

    describe('strength classification', () => {
      it('returns strength for scores >= 5.5', () => {
        expect(getTipContext(5.5, thresholds)).toBe('strength')
        expect(getTipContext(6.0, thresholds)).toBe('strength')
        expect(getTipContext(7.0, thresholds)).toBe('strength')
      })

      it('returns strength for score exactly at threshold', () => {
        expect(getTipContext(5.5, thresholds)).toBe('strength')
      })

      it('returns strength for maximum score', () => {
        expect(getTipContext(7.0, thresholds)).toBe('strength')
      })

      it('returns strength for high decimal values', () => {
        expect(getTipContext(5.51, thresholds)).toBe('strength')
        expect(getTipContext(6.99, thresholds)).toBe('strength')
      })
    })

    describe('growth classification', () => {
      it('returns growth for scores <= 3.5', () => {
        expect(getTipContext(3.5, thresholds)).toBe('growth')
        expect(getTipContext(3.0, thresholds)).toBe('growth')
        expect(getTipContext(1.0, thresholds)).toBe('growth')
      })

      it('returns growth for score exactly at threshold', () => {
        expect(getTipContext(3.5, thresholds)).toBe('growth')
      })

      it('returns growth for minimum score', () => {
        expect(getTipContext(1.0, thresholds)).toBe('growth')
      })

      it('returns growth for low decimal values', () => {
        expect(getTipContext(3.49, thresholds)).toBe('growth')
        expect(getTipContext(1.01, thresholds)).toBe('growth')
      })
    })

    describe('middle range (no tip)', () => {
      it('returns null for middle range scores', () => {
        expect(getTipContext(3.6, thresholds)).toBeNull()
        expect(getTipContext(4.0, thresholds)).toBeNull()
        expect(getTipContext(4.5, thresholds)).toBeNull()
        expect(getTipContext(5.0, thresholds)).toBeNull()
        expect(getTipContext(5.4, thresholds)).toBeNull()
      })

      it('returns null for score just above growth threshold', () => {
        expect(getTipContext(3.51, thresholds)).toBeNull()
      })

      it('returns null for score just below strength threshold', () => {
        expect(getTipContext(5.49, thresholds)).toBeNull()
      })

      it('returns null for exact middle of range', () => {
        expect(getTipContext(4.5, thresholds)).toBeNull()
      })
    })

    describe('edge cases', () => {
      it('handles zero score', () => {
        expect(getTipContext(0, thresholds)).toBe('growth')
      })

      it('handles negative scores gracefully', () => {
        // In case of data issues
        expect(getTipContext(-1, thresholds)).toBe('growth')
      })

      it('handles scores above maximum gracefully', () => {
        // In case of data issues
        expect(getTipContext(10, thresholds)).toBe('strength')
      })

      it('handles different threshold values', () => {
        const customThresholds = { strength: 6.0, growth: 2.0 }
        expect(getTipContext(6.0, customThresholds)).toBe('strength')
        expect(getTipContext(5.9, customThresholds)).toBeNull()
        expect(getTipContext(2.0, customThresholds)).toBe('growth')
        expect(getTipContext(2.1, customThresholds)).toBeNull()
      })
    })
  })

  describe('getRelevantTips', () => {
    const mockTipsData: CoachingTipsData = {
      tips: {
        confidence: {
          pillar: 'confidence',
          display_name: 'Confidence',
          strength_tips: {
            practice: 'Strength practice tip for confidence',
            game_day: 'Strength game day tip for confidence',
          },
          growth_tips: {
            practice: 'Growth practice tip for confidence',
            game_day: 'Growth game day tip for confidence',
          },
        },
        arousal_control: {
          pillar: 'arousal_control',
          display_name: 'Arousal Control',
          strength_tips: {
            practice: 'Strength practice tip for arousal',
            game_day: 'Strength game day tip for arousal',
          },
          growth_tips: {
            practice: 'Growth practice tip for arousal',
            game_day: 'Growth game day tip for arousal',
          },
        },
        mindfulness: {
          pillar: 'mindfulness',
          display_name: 'Mindfulness',
          strength_tips: {
            practice: 'Strength practice tip for mindfulness',
            game_day: 'Strength game day tip for mindfulness',
          },
          growth_tips: {
            practice: 'Growth practice tip for mindfulness',
            game_day: 'Growth game day tip for mindfulness',
          },
        },
      },
      thresholds: {
        strength: 5.5,
        growth: 3.5,
      },
    }

    describe('filtering by score', () => {
      it('returns strength tips for high scores', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(1)
        expect(result[0].context).toBe('strength')
        expect(result[0].practiceTip).toBe('Strength practice tip for confidence')
        expect(result[0].gameDayTip).toBe('Strength game day tip for confidence')
      })

      it('returns growth tips for low scores', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'arousal_control', score: 2.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(1)
        expect(result[0].context).toBe('growth')
        expect(result[0].practiceTip).toBe('Growth practice tip for arousal')
        expect(result[0].gameDayTip).toBe('Growth game day tip for arousal')
      })

      it('excludes middle-range scores', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'mindfulness', score: 4.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(0)
      })
    })

    describe('multiple pillars', () => {
      it('returns tips for multiple qualifying pillars', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
          { pillar: 'arousal_control', score: 2.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(2)
      })

      it('filters out non-qualifying pillars from mixed set', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },       // strength
          { pillar: 'arousal_control', score: 4.5 },  // middle - excluded
          { pillar: 'mindfulness', score: 2.5 },      // growth
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(2)
        const pillars = result.map((r) => r.pillar)
        expect(pillars).toContain('confidence')
        expect(pillars).toContain('mindfulness')
        expect(pillars).not.toContain('arousal_control')
      })
    })

    describe('filter option', () => {
      it('returns only strengths when filter is "strengths"', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
          { pillar: 'arousal_control', score: 2.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores, 'strengths')

        expect(result).toHaveLength(1)
        expect(result[0].context).toBe('strength')
        expect(result[0].pillar).toBe('confidence')
      })

      it('returns only growth areas when filter is "growth"', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
          { pillar: 'arousal_control', score: 2.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores, 'growth')

        expect(result).toHaveLength(1)
        expect(result[0].context).toBe('growth')
        expect(result[0].pillar).toBe('arousal_control')
      })

      it('returns all qualifying tips when filter is "all"', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
          { pillar: 'arousal_control', score: 2.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores, 'all')

        expect(result).toHaveLength(2)
      })

      it('returns all qualifying tips when filter is undefined', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
          { pillar: 'arousal_control', score: 2.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(2)
      })
    })

    describe('edge cases', () => {
      it('returns empty array when no pillar scores provided', () => {
        const result = getRelevantTips(mockTipsData, [])

        expect(result).toHaveLength(0)
      })

      it('returns empty array when all scores are in middle range', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 4.0 },
          { pillar: 'arousal_control', score: 4.5 },
          { pillar: 'mindfulness', score: 5.0 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(0)
      })

      it('handles unknown pillar gracefully', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'unknown_pillar', score: 6.0 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result).toHaveLength(0)
      })

      it('includes display name in result', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result[0].displayName).toBe('Confidence')
      })

      it('includes score in result', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.2 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores)

        expect(result[0].score).toBe(6.2)
      })
    })

    describe('sorting', () => {
      it('sorts strengths by score descending', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 6.0 },
          { pillar: 'arousal_control', score: 6.5 },
          { pillar: 'mindfulness', score: 5.8 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores, 'strengths')

        expect(result[0].pillar).toBe('arousal_control')
        expect(result[1].pillar).toBe('confidence')
        expect(result[2].pillar).toBe('mindfulness')
      })

      it('sorts growth areas by score ascending (worst first)', () => {
        const pillarScores: PillarScore[] = [
          { pillar: 'confidence', score: 3.0 },
          { pillar: 'arousal_control', score: 2.0 },
          { pillar: 'mindfulness', score: 3.5 },
        ]

        const result = getRelevantTips(mockTipsData, pillarScores, 'growth')

        expect(result[0].pillar).toBe('arousal_control')
        expect(result[1].pillar).toBe('confidence')
        expect(result[2].pillar).toBe('mindfulness')
      })
    })
  })

  describe('boundary value analysis', () => {
    const thresholds = { strength: 5.5, growth: 3.5 }

    describe('strength threshold boundary', () => {
      it('5.49 is NOT strength', () => {
        expect(getTipContext(5.49, thresholds)).toBeNull()
      })

      it('5.50 IS strength', () => {
        expect(getTipContext(5.5, thresholds)).toBe('strength')
      })

      it('5.51 IS strength', () => {
        expect(getTipContext(5.51, thresholds)).toBe('strength')
      })
    })

    describe('growth threshold boundary', () => {
      it('3.49 IS growth', () => {
        expect(getTipContext(3.49, thresholds)).toBe('growth')
      })

      it('3.50 IS growth', () => {
        expect(getTipContext(3.5, thresholds)).toBe('growth')
      })

      it('3.51 is NOT growth', () => {
        expect(getTipContext(3.51, thresholds)).toBeNull()
      })
    })

    describe('floating point precision', () => {
      it('handles floating point edge case 5.500000001', () => {
        expect(getTipContext(5.500000001, thresholds)).toBe('strength')
      })

      it('handles floating point edge case 3.499999999', () => {
        expect(getTipContext(3.499999999, thresholds)).toBe('growth')
      })
    })
  })
})
