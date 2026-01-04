import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CoachingTipPanel } from '../CoachingTipPanel'

// Mock coaching tips data
const mockTipsData = {
  tips: {
    confidence: {
      pillar: 'confidence',
      display_name: 'Confidence',
      strength_tips: {
        practice: 'Position in challenging drills...',
        game_day: 'Reference their past successes...',
      },
      growth_tips: {
        practice: 'Track small wins daily...',
        game_day: 'Redirect after mistakes...',
      },
    },
    arousal_control: {
      pillar: 'arousal_control',
      display_name: 'Arousal Control',
      strength_tips: {
        practice: 'Let them lead calming exercises...',
        game_day: 'They can help nervous teammates...',
      },
      growth_tips: {
        practice: 'Introduce breathing exercises...',
        game_day: 'Check in on energy levels...',
      },
    },
    mindfulness: {
      pillar: 'mindfulness',
      display_name: 'Mindfulness',
      strength_tips: {
        practice: 'Use them for visualization exercises...',
        game_day: 'Encourage present-moment focus...',
      },
      growth_tips: {
        practice: 'Start with simple awareness exercises...',
        game_day: 'Provide focus cues...',
      },
    },
  },
  thresholds: {
    strength: 5.5,
    growth: 3.5,
  },
}

// Mock the useCoachingTips hook
vi.mock('@/hooks/useCoachingTips', () => ({
  useCoachingTips: () => ({
    data: mockTipsData,
    isLoading: false,
    error: null,
  }),
  getTipContext: (pillar: string, strengths: string[] | null, growthAreas: string[] | null) => {
    if (strengths?.includes(pillar)) return 'strength'
    if (growthAreas?.includes(pillar)) return 'growth'
    return null
  },
}))

describe('CoachingTipPanel', () => {
  const mockOnClose = vi.fn()

  // Updated mock athlete to match the new component interface
  const mockAthlete = {
    id: '123',
    first_name: 'Sarah',
    last_name: 'Johnson',
    has_completed_assessment: true,
    pillar_scores: {
      confidence: 6.2,
      arousal_control: 2.8,
      mindfulness: 4.5,
    },
    strengths: ['confidence'],
    growth_areas: ['arousal_control'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('is hidden with CSS when isOpen is false', () => {
      render(
        <CoachingTipPanel
          isOpen={false}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      // Component uses CSS transform for visibility, so it's still in DOM
      // but has translate-x-full class
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('translate-x-full')
    })

    it('displays athlete name in header', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      expect(screen.getByText(/Sarah Johnson/)).toBeInTheDocument()
    })

    it('displays coaching tips header', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      expect(screen.getByText(/Coaching Tips/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has correct ARIA role for dialog', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-label for dialog', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-label')
    })

    it('calls onClose when Escape key is pressed', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking close button', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('filter buttons', () => {
    it('renders filter buttons for All, Strengths, and Growth', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Strengths/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Growth/i })).toBeInTheDocument()
    })

    it('shows All filter as active by default', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const allButton = screen.getByRole('button', { name: /All.*2/i })
      expect(allButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to Strengths filter when clicked', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const strengthsButton = screen.getByRole('button', { name: /Strengths/i })
      fireEvent.click(strengthsButton)

      await waitFor(() => {
        expect(strengthsButton).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('switches to Growth filter when clicked', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const growthButton = screen.getByRole('button', { name: /Growth/i })
      fireEvent.click(growthButton)

      await waitFor(() => {
        expect(growthButton).toHaveAttribute('aria-pressed', 'true')
      })
    })
  })

  describe('tip filtering by strengths/growth arrays', () => {
    it('shows tips for pillars in strengths array', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      // Confidence is in strengths array
      expect(screen.getByText('Confidence')).toBeInTheDocument()
    })

    it('shows tips for pillars in growth_areas array', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      // Arousal Control is in growth_areas array
      expect(screen.getByText('Arousal Control')).toBeInTheDocument()
    })

    it('filters to show only strengths when Strengths button selected', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const strengthsButton = screen.getByRole('button', { name: /Strengths/i })
      fireEvent.click(strengthsButton)

      await waitFor(() => {
        // Confidence (in strengths) should be visible
        expect(screen.getByText('Confidence')).toBeInTheDocument()
      })
    })

    it('filters to show only growth areas when Growth button selected', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      const growthButton = screen.getByRole('button', { name: /Growth/i })
      fireEvent.click(growthButton)

      await waitFor(() => {
        // Arousal Control (in growth_areas) should be visible
        expect(screen.getByText('Arousal Control')).toBeInTheDocument()
      })
    })
  })

  describe('empty states', () => {
    it('shows message when athlete has no assessment', () => {
      const noAssessmentAthlete = {
        ...mockAthlete,
        has_completed_assessment: false,
        strengths: null,
        growth_areas: null,
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={noAssessmentAthlete}
        />
      )

      expect(screen.getByText(/Assessment Not Completed/)).toBeInTheDocument()
    })

    it('shows message when athlete has no strengths or growth areas', () => {
      const noTipsAthlete = {
        ...mockAthlete,
        strengths: [],
        growth_areas: [],
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={noTipsAthlete}
        />
      )

      expect(screen.getByText(/No Qualifying Scores/)).toBeInTheDocument()
    })

    it('handles athlete with all growth areas', async () => {
      const allGrowthAthlete = {
        ...mockAthlete,
        strengths: [],
        growth_areas: ['arousal_control', 'mindfulness'],
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={allGrowthAthlete}
        />
      )

      const strengthsButton = screen.getByRole('button', { name: /Strengths/i })
      fireEvent.click(strengthsButton)

      await waitFor(() => {
        expect(screen.getByText(/No Strength Tips/)).toBeInTheDocument()
      })
    })

    it('handles athlete with all strengths', async () => {
      const allStrengthsAthlete = {
        ...mockAthlete,
        strengths: ['confidence', 'mindfulness'],
        growth_areas: [],
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={allStrengthsAthlete}
        />
      )

      const growthButton = screen.getByRole('button', { name: /Growth/i })
      fireEvent.click(growthButton)

      await waitFor(() => {
        expect(screen.getByText(/No Growth Tips/)).toBeInTheDocument()
      })
    })
  })

  describe('tip card display', () => {
    it('shows correct tip type based on array membership', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      // Confidence (in strengths) should show as Strength badge
      const strengthBadge = screen.getByText('Strength')
      expect(strengthBadge).toBeInTheDocument()
      expect(strengthBadge).toHaveClass('bg-green-100')

      // Arousal Control (in growth_areas) should show as Growth badge
      // Use getAllByText since "Growth" appears in both button and badge
      const growthElements = screen.getAllByText('Growth')
      // The badge should have orange styling
      const growthBadge = growthElements.find(el => el.classList.contains('bg-orange-100'))
      expect(growthBadge).toBeInTheDocument()
    })

    it('displays practice and game day tips for each pillar', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
        />
      )

      // Should have Practice and Game Day sections
      const practiceSections = screen.getAllByText('Practice')
      const gameDaySections = screen.getAllByText('Game Day')

      expect(practiceSections.length).toBeGreaterThan(0)
      expect(gameDaySections.length).toBeGreaterThan(0)
    })
  })

  describe('null athlete handling', () => {
    it('handles null athlete gracefully', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={null}
        />
      )

      // Should still render the dialog without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
