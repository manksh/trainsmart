import { describe, it, expect } from 'vitest'
import { getTipContext } from '../useCoachingTips'

describe('useCoachingTips helpers', () => {
  describe('getTipContext', () => {
    describe('strength classification', () => {
      it('returns strength when pillar is in strengths array', () => {
        const strengths = ['confidence', 'mindfulness']
        const growthAreas = ['arousal_control']

        expect(getTipContext('confidence', strengths, growthAreas)).toBe('strength')
        expect(getTipContext('mindfulness', strengths, growthAreas)).toBe('strength')
      })

      it('returns strength even if growthAreas is null', () => {
        const strengths = ['confidence']

        expect(getTipContext('confidence', strengths, null)).toBe('strength')
      })

      it('returns strength even if growthAreas is empty', () => {
        const strengths = ['confidence']

        expect(getTipContext('confidence', strengths, [])).toBe('strength')
      })
    })

    describe('growth classification', () => {
      it('returns growth when pillar is in growth_areas array', () => {
        const strengths = ['confidence']
        const growthAreas = ['arousal_control', 'resilience']

        expect(getTipContext('arousal_control', strengths, growthAreas)).toBe('growth')
        expect(getTipContext('resilience', strengths, growthAreas)).toBe('growth')
      })

      it('returns growth even if strengths is null', () => {
        const growthAreas = ['arousal_control']

        expect(getTipContext('arousal_control', null, growthAreas)).toBe('growth')
      })

      it('returns growth even if strengths is empty', () => {
        const growthAreas = ['arousal_control']

        expect(getTipContext('arousal_control', [], growthAreas)).toBe('growth')
      })
    })

    describe('no classification (middle range)', () => {
      it('returns null when pillar is not in either array', () => {
        const strengths = ['confidence']
        const growthAreas = ['arousal_control']

        expect(getTipContext('mindfulness', strengths, growthAreas)).toBeNull()
      })

      it('returns null when both arrays are null', () => {
        expect(getTipContext('confidence', null, null)).toBeNull()
      })

      it('returns null when both arrays are empty', () => {
        expect(getTipContext('confidence', [], [])).toBeNull()
      })
    })

    describe('priority (strength over growth)', () => {
      it('returns strength when pillar is in both arrays (edge case)', () => {
        // This shouldn't happen in practice, but test the behavior
        const strengths = ['confidence']
        const growthAreas = ['confidence']

        // Strength is checked first
        expect(getTipContext('confidence', strengths, growthAreas)).toBe('strength')
      })
    })

    describe('all pillars', () => {
      const allPillars = [
        'mindfulness',
        'confidence',
        'attentional_focus',
        'motivation',
        'arousal_control',
        'resilience',
        'deliberate_practice',
        'knowledge',
        'wellness',
        'self_awareness',
      ]

      it('correctly identifies each pillar as strength when in strengths array', () => {
        allPillars.forEach((pillar) => {
          expect(getTipContext(pillar, [pillar], [])).toBe('strength')
        })
      })

      it('correctly identifies each pillar as growth when in growth_areas array', () => {
        allPillars.forEach((pillar) => {
          expect(getTipContext(pillar, [], [pillar])).toBe('growth')
        })
      })

      it('returns null for each pillar when not in either array', () => {
        allPillars.forEach((pillar) => {
          expect(getTipContext(pillar, [], [])).toBeNull()
        })
      })
    })

    describe('edge cases', () => {
      it('handles unknown pillar gracefully', () => {
        const strengths = ['confidence']
        const growthAreas = ['arousal_control']

        expect(getTipContext('unknown_pillar', strengths, growthAreas)).toBeNull()
      })

      it('handles case-sensitive matching', () => {
        const strengths = ['confidence']
        const growthAreas = ['arousal_control']

        // Pillar names are case-sensitive
        expect(getTipContext('Confidence', strengths, growthAreas)).toBeNull()
        expect(getTipContext('CONFIDENCE', strengths, growthAreas)).toBeNull()
      })

      it('handles multiple pillars in each category', () => {
        const strengths = ['confidence', 'mindfulness', 'motivation']
        const growthAreas = ['arousal_control', 'resilience', 'attentional_focus']

        expect(getTipContext('confidence', strengths, growthAreas)).toBe('strength')
        expect(getTipContext('mindfulness', strengths, growthAreas)).toBe('strength')
        expect(getTipContext('motivation', strengths, growthAreas)).toBe('strength')
        expect(getTipContext('arousal_control', strengths, growthAreas)).toBe('growth')
        expect(getTipContext('resilience', strengths, growthAreas)).toBe('growth')
        expect(getTipContext('attentional_focus', strengths, growthAreas)).toBe('growth')
        expect(getTipContext('knowledge', strengths, growthAreas)).toBeNull()
      })
    })
  })
})
