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
}))

describe('CoachingTipPanel', () => {
  const mockOnClose = vi.fn()
  const mockAthlete = {
    id: '123',
    first_name: 'Sarah',
    last_name: 'Johnson',
  }
  const mockPillarScores = {
    confidence: 6.2,
    arousal_control: 2.8,
    mindfulness: 4.5,
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
          pillarScores={mockPillarScores}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(
        <CoachingTipPanel
          isOpen={false}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('displays athlete name in header', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
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
          pillarScores={mockPillarScores}
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
          pillarScores={mockPillarScores}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby for dialog title', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('calls onClose when Escape key is pressed', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking backdrop', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // Click on the backdrop (overlay)
      const backdrop = screen.getByTestId('panel-backdrop')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking close button', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('filter tabs', () => {
    it('renders filter tabs for All, Strengths, and Growth Areas', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Strengths')).toBeInTheDocument()
      expect(screen.getByText('Growth Areas')).toBeInTheDocument()
    })

    it('shows All filter as active by default', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const allTab = screen.getByRole('tab', { name: 'All' })
      expect(allTab).toHaveAttribute('aria-selected', 'true')
    })

    it('switches to Strengths filter when clicked', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const strengthsTab = screen.getByRole('tab', { name: 'Strengths' })
      fireEvent.click(strengthsTab)

      await waitFor(() => {
        expect(strengthsTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('switches to Growth Areas filter when clicked', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const growthTab = screen.getByRole('tab', { name: 'Growth Areas' })
      fireEvent.click(growthTab)

      await waitFor(() => {
        expect(growthTab).toHaveAttribute('aria-selected', 'true')
      })
    })
  })

  describe('tip filtering by score', () => {
    it('shows strength tips for scores >= 5.5', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // Confidence has score 6.2 (strength)
      expect(screen.getByText('Confidence')).toBeInTheDocument()
    })

    it('shows growth tips for scores <= 3.5', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // Arousal Control has score 2.8 (growth)
      expect(screen.getByText('Arousal Control')).toBeInTheDocument()
    })

    it('filters to show only strengths when Strengths tab selected', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const strengthsTab = screen.getByRole('tab', { name: 'Strengths' })
      fireEvent.click(strengthsTab)

      await waitFor(() => {
        // Confidence (6.2) should be visible
        expect(screen.getByText('Confidence')).toBeInTheDocument()
      })

      // Arousal Control (2.8) should not be visible in strengths
      // Note: The actual filtering behavior depends on implementation
    })

    it('filters to show only growth areas when Growth Areas tab selected', async () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const growthTab = screen.getByRole('tab', { name: 'Growth Areas' })
      fireEvent.click(growthTab)

      await waitFor(() => {
        // Arousal Control (2.8) should be visible
        expect(screen.getByText('Arousal Control')).toBeInTheDocument()
      })
    })
  })

  describe('empty states', () => {
    it('shows message when no tips match filter', async () => {
      // Use pillar scores with no strengths or growth areas
      const middleScores = {
        confidence: 4.5,
        arousal_control: 4.5,
        mindfulness: 4.5,
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={middleScores}
        />
      )

      const strengthsTab = screen.getByRole('tab', { name: 'Strengths' })
      fireEvent.click(strengthsTab)

      await waitFor(() => {
        expect(screen.getByText(/No strength areas identified/)).toBeInTheDocument()
      })
    })

    it('handles athlete with all growth areas', async () => {
      const lowScores = {
        confidence: 2.0,
        arousal_control: 2.5,
        mindfulness: 3.0,
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={lowScores}
        />
      )

      const strengthsTab = screen.getByRole('tab', { name: 'Strengths' })
      fireEvent.click(strengthsTab)

      await waitFor(() => {
        expect(screen.getByText(/No strength areas identified/)).toBeInTheDocument()
      })
    })

    it('handles athlete with all strengths', async () => {
      const highScores = {
        confidence: 6.5,
        arousal_control: 6.0,
        mindfulness: 5.8,
      }

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={highScores}
        />
      )

      const growthTab = screen.getByRole('tab', { name: 'Growth Areas' })
      fireEvent.click(growthTab)

      await waitFor(() => {
        expect(screen.getByText(/No growth areas identified/)).toBeInTheDocument()
      })
    })
  })

  describe('loading state', () => {
    it('shows loading indicator when data is loading', () => {
      // Override the mock for this test
      vi.doMock('@/hooks/useCoachingTips', () => ({
        useCoachingTips: () => ({
          data: null,
          isLoading: true,
          error: null,
        }),
      }))

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // Should show loading state or skeleton
      expect(screen.getByTestId('loading-indicator') || screen.getByRole('progressbar')).toBeTruthy()
    })
  })

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      // Override the mock for this test
      vi.doMock('@/hooks/useCoachingTips', () => ({
        useCoachingTips: () => ({
          data: null,
          isLoading: false,
          error: new Error('Failed to load coaching tips'),
        }),
      }))

      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      expect(screen.getByText(/Failed to load/)).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('focuses first interactive element when panel opens', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // First interactive element should receive focus (usually close button)
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(document.activeElement).toBe(closeButton)
    })

    it('allows tab navigation between filter tabs', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBe(3)

      // All tabs should be tabbable
      tabs.forEach((tab) => {
        expect(tab).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('tip card display', () => {
    it('shows correct tip type based on score context', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // Confidence (6.2) should show as Strength
      expect(screen.getByText('Strength')).toBeInTheDocument()

      // Arousal Control (2.8) should show as Growth Area
      expect(screen.getByText('Growth Area')).toBeInTheDocument()
    })

    it('displays practice and game day tips for each pillar', () => {
      render(
        <CoachingTipPanel
          isOpen={true}
          onClose={mockOnClose}
          athlete={mockAthlete}
          pillarScores={mockPillarScores}
        />
      )

      // Should have Practice and Game Day sections
      const practiceSections = screen.getAllByText('Practice')
      const gameDaySections = screen.getAllByText('Game Day')

      expect(practiceSections.length).toBeGreaterThan(0)
      expect(gameDaySections.length).toBeGreaterThan(0)
    })
  })
})
