import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CoachingTipCard } from '../CoachingTipCard'

describe('CoachingTipCard', () => {
  const strengthProps = {
    pillar: 'confidence',
    displayName: 'Confidence',
    score: 6.2,
    context: 'strength' as const,
    practiceTip: 'Position in challenging drills where they can model high confidence to teammates. Use their belief to anchor team energy.',
    gameDayTip: 'Reference their past successes before competition. They can be a calming presence for teammates who doubt themselves.',
  }

  const growthProps = {
    pillar: 'arousal_control',
    displayName: 'Arousal Control',
    score: 3.0,
    context: 'growth' as const,
    practiceTip: 'Introduce breathing exercises during practice breaks. Build their awareness of physical tension signals.',
    gameDayTip: 'Check in on their energy levels before competition. Provide simple grounding techniques if they seem overwhelmed.',
  }

  describe('rendering', () => {
    it('renders pillar display name', () => {
      render(<CoachingTipCard {...strengthProps} />)

      expect(screen.getByText('Confidence')).toBeInTheDocument()
    })

    it('renders practice tip content', () => {
      render(<CoachingTipCard {...strengthProps} />)

      expect(screen.getByText(/Position in challenging drills/)).toBeInTheDocument()
    })

    it('renders game day tip content', () => {
      render(<CoachingTipCard {...strengthProps} />)

      expect(screen.getByText(/Reference their past successes/)).toBeInTheDocument()
    })

    it('renders score value', () => {
      render(<CoachingTipCard {...strengthProps} />)

      expect(screen.getByText('6.2')).toBeInTheDocument()
    })
  })

  describe('strength context styling', () => {
    it('renders strength badge with correct styling', () => {
      render(<CoachingTipCard {...strengthProps} />)

      const badge = screen.getByText('Strength')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('uses green color scheme for strength tips', () => {
      render(<CoachingTipCard {...strengthProps} />)

      // Card should have green styling elements
      const strengthBadge = screen.getByText('Strength')
      expect(strengthBadge.className).toMatch(/green/)
    })
  })

  describe('growth context styling', () => {
    it('renders growth area badge with correct styling', () => {
      render(<CoachingTipCard {...growthProps} />)

      const badge = screen.getByText('Growth Area')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-orange-100')
      expect(badge).toHaveClass('text-orange-800')
    })

    it('uses orange color scheme for growth tips', () => {
      render(<CoachingTipCard {...growthProps} />)

      // Card should have orange styling elements
      const growthBadge = screen.getByText('Growth Area')
      expect(growthBadge.className).toMatch(/orange/)
    })

    it('displays growth pillar name correctly', () => {
      render(<CoachingTipCard {...growthProps} />)

      expect(screen.getByText('Arousal Control')).toBeInTheDocument()
    })
  })

  describe('tip sections', () => {
    it('renders Practice section header', () => {
      render(<CoachingTipCard {...strengthProps} />)

      expect(screen.getByText('Practice')).toBeInTheDocument()
    })

    it('renders Game Day section header', () => {
      render(<CoachingTipCard {...strengthProps} />)

      expect(screen.getByText('Game Day')).toBeInTheDocument()
    })

    it('displays both tips for growth context', () => {
      render(<CoachingTipCard {...growthProps} />)

      expect(screen.getByText(/Introduce breathing exercises/)).toBeInTheDocument()
      expect(screen.getByText(/Check in on their energy levels/)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles minimum score boundary', () => {
      const minScoreProps = {
        ...growthProps,
        score: 1.0,
      }

      render(<CoachingTipCard {...minScoreProps} />)

      expect(screen.getByText('1.0')).toBeInTheDocument()
    })

    it('handles maximum score boundary', () => {
      const maxScoreProps = {
        ...strengthProps,
        score: 7.0,
      }

      render(<CoachingTipCard {...maxScoreProps} />)

      expect(screen.getByText('7.0')).toBeInTheDocument()
    })

    it('handles score exactly at strength threshold', () => {
      const thresholdProps = {
        ...strengthProps,
        score: 5.5,
      }

      render(<CoachingTipCard {...thresholdProps} />)

      expect(screen.getByText('5.5')).toBeInTheDocument()
      expect(screen.getByText('Strength')).toBeInTheDocument()
    })

    it('handles score exactly at growth threshold', () => {
      const thresholdProps = {
        ...growthProps,
        score: 3.5,
      }

      render(<CoachingTipCard {...thresholdProps} />)

      expect(screen.getByText('3.5')).toBeInTheDocument()
      expect(screen.getByText('Growth Area')).toBeInTheDocument()
    })

    it('handles long pillar names', () => {
      const longNameProps = {
        ...strengthProps,
        displayName: 'Self-Awareness',
        pillar: 'self_awareness',
      }

      render(<CoachingTipCard {...longNameProps} />)

      expect(screen.getByText('Self-Awareness')).toBeInTheDocument()
    })

    it('handles long tip content without truncation', () => {
      const longTipProps = {
        ...strengthProps,
        practiceTip: 'This is a very long practice tip that contains multiple sentences. It should be displayed in full without any truncation. The coach needs to see the complete guidance for effective implementation during training sessions.',
      }

      render(<CoachingTipCard {...longTipProps} />)

      expect(screen.getByText(/This is a very long practice tip/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has appropriate heading structure', () => {
      render(<CoachingTipCard {...strengthProps} />)

      // Pillar name should be in a heading
      const pillarHeading = screen.getByRole('heading', { name: 'Confidence' })
      expect(pillarHeading).toBeInTheDocument()
    })

    it('sections are visually distinct', () => {
      render(<CoachingTipCard {...strengthProps} />)

      // Both section labels should be present and distinguishable
      const practiceSection = screen.getByText('Practice')
      const gameDaySection = screen.getByText('Game Day')

      expect(practiceSection).toBeInTheDocument()
      expect(gameDaySection).toBeInTheDocument()
      expect(practiceSection).not.toBe(gameDaySection)
    })
  })

  describe('all pillars render correctly', () => {
    const allPillars = [
      { pillar: 'mindfulness', displayName: 'Mindfulness' },
      { pillar: 'confidence', displayName: 'Confidence' },
      { pillar: 'attentional_focus', displayName: 'Attentional Focus' },
      { pillar: 'motivation', displayName: 'Motivation' },
      { pillar: 'arousal_control', displayName: 'Arousal Control' },
      { pillar: 'resilience', displayName: 'Resilience' },
      { pillar: 'coachability', displayName: 'Coachability' },
      { pillar: 'self_awareness', displayName: 'Self-Awareness' },
      { pillar: 'leadership', displayName: 'Leadership' },
      { pillar: 'mental_imagery', displayName: 'Mental Imagery' },
    ]

    allPillars.forEach(({ pillar, displayName }) => {
      it(`renders ${displayName} pillar correctly`, () => {
        const props = {
          pillar,
          displayName,
          score: 5.0,
          context: 'strength' as const,
          practiceTip: `Practice tip for ${displayName}`,
          gameDayTip: `Game day tip for ${displayName}`,
        }

        render(<CoachingTipCard {...props} />)

        expect(screen.getByText(displayName)).toBeInTheDocument()
      })
    })
  })
})
