/**
 * Tests for SupportingDimensionsCard component.
 *
 * This component displays supporting dimension scores (Knowledge, Self-Awareness,
 * Wellness, Deliberate Practice) in either a card or inline variant.
 * Tests cover:
 * - Rendering all 4 dimensions when scores provided
 * - Returning null when no supporting scores exist
 * - Card variant styling (border, padding)
 * - Inline variant styling (grid layout)
 * - Info button interactions and modal behavior
 * - Correct icons for each dimension
 * - Correct display names for each pillar
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SupportingDimensionsCard } from './SupportingDimensionsCard'

describe('SupportingDimensionsCard', () => {
  const allSupportingScores = {
    knowledge: 5.5,
    self_awareness: 4.2,
    wellness: 6.1,
    deliberate_practice: 3.8,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any body style changes from modal
    document.body.style.overflow = ''
  })

  // ===========================================================================
  // Basic Rendering Tests
  // ===========================================================================

  describe('basic rendering', () => {
    it('renders all 4 dimensions when all scores provided', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
      expect(screen.getByText('Self-Awareness')).toBeInTheDocument()
      expect(screen.getByText('Wellness')).toBeInTheDocument()
      expect(screen.getByText('Deliberate Practice')).toBeInTheDocument()
    })

    it('renders only dimensions that have scores', () => {
      const partialScores = {
        knowledge: 5.5,
        wellness: 6.1,
      }

      render(<SupportingDimensionsCard scores={partialScores} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
      expect(screen.getByText('Wellness')).toBeInTheDocument()
      expect(screen.queryByText('Self-Awareness')).not.toBeInTheDocument()
      expect(screen.queryByText('Deliberate Practice')).not.toBeInTheDocument()
    })

    it('renders single dimension when only one score provided', () => {
      const singleScore = {
        knowledge: 5.5,
      }

      render(<SupportingDimensionsCard scores={singleScore} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
      expect(screen.queryByText('Self-Awareness')).not.toBeInTheDocument()
      expect(screen.queryByText('Wellness')).not.toBeInTheDocument()
      expect(screen.queryByText('Deliberate Practice')).not.toBeInTheDocument()
    })

    it('renders the "Supporting Dimensions" title in card variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      expect(screen.getByText('Supporting Dimensions')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Returns Null Tests
  // ===========================================================================

  describe('returns null when no supporting scores', () => {
    it('returns null when scores object is empty', () => {
      const { container } = render(<SupportingDimensionsCard scores={{}} />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null when only non-supporting dimension scores exist', () => {
      const coreScores = {
        mindfulness: 5.5,
        confidence: 4.2,
        motivation: 6.1,
        resilience: 3.8,
        attentional_focus: 5.0,
        arousal_control: 4.5,
      }

      const { container } = render(<SupportingDimensionsCard scores={coreScores} />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null when supporting dimension scores are undefined', () => {
      const scores = {
        knowledge: undefined,
        self_awareness: undefined,
      } as unknown as Record<string, number>

      const { container } = render(<SupportingDimensionsCard scores={scores} />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null when supporting dimension scores are null', () => {
      const scores = {
        knowledge: null,
        self_awareness: null,
      } as unknown as Record<string, number>

      const { container } = render(<SupportingDimensionsCard scores={scores} />)

      expect(container.firstChild).toBeNull()
    })

    it('renders when at least one supporting dimension has a valid score', () => {
      const mixedScores = {
        mindfulness: 5.5,
        knowledge: 4.2,
      }

      render(<SupportingDimensionsCard scores={mixedScores} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
    })

    it('handles zero scores as valid scores (not null/undefined)', () => {
      const zeroScore = {
        knowledge: 0,
      }

      render(<SupportingDimensionsCard scores={zeroScore} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Card Variant Tests
  // ===========================================================================

  describe('card variant styling', () => {
    it('uses card variant by default', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Card variant should have the title
      expect(screen.getByText('Supporting Dimensions')).toBeInTheDocument()
    })

    it('applies card wrapper with white background', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const card = document.querySelector('.bg-white.rounded-xl.shadow-sm')
      expect(card).toBeInTheDocument()
    })

    it('applies purple left border on card variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const card = document.querySelector('.border-l-4.border-l-purple-400')
      expect(card).toBeInTheDocument()
    })

    it('applies correct padding on card variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const card = document.querySelector('.p-4')
      expect(card).toBeInTheDocument()
    })

    it('applies responsive grid layout on card variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const grid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('applies gap spacing on card variant grid', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const grid = document.querySelector('.gap-4')
      expect(grid).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Inline Variant Tests
  // ===========================================================================

  describe('inline variant styling', () => {
    it('renders without card wrapper in inline variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      // Should not have the card wrapper
      const card = document.querySelector('.bg-white.rounded-xl.shadow-sm')
      expect(card).not.toBeInTheDocument()
    })

    it('does not render title in inline variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      expect(screen.queryByText('Supporting Dimensions')).not.toBeInTheDocument()
    })

    it('applies 2-column grid layout in inline variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      const grid = document.querySelector('.grid.grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('applies smaller gap spacing in inline variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      const grid = document.querySelector('.gap-3')
      expect(grid).toBeInTheDocument()
    })

    it('does not have purple border in inline variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      const border = document.querySelector('.border-l-4.border-l-purple-400')
      expect(border).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Icon Tests
  // ===========================================================================

  describe('dimension icons', () => {
    it('renders BookOpen icon for Knowledge dimension', () => {
      render(<SupportingDimensionsCard scores={{ knowledge: 5.5 }} />)

      // Check for the SVG icon next to Knowledge text
      const knowledgeRow = screen.getByText('Knowledge').closest('div')
      const icon = knowledgeRow?.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('w-4', 'h-4', 'text-purple-500')
    })

    it('renders Eye icon for Self-Awareness dimension', () => {
      render(<SupportingDimensionsCard scores={{ self_awareness: 4.2 }} />)

      const selfAwarenessRow = screen.getByText('Self-Awareness').closest('div')
      const icon = selfAwarenessRow?.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('w-4', 'h-4', 'text-purple-500')
    })

    it('renders Leaf icon for Wellness dimension', () => {
      render(<SupportingDimensionsCard scores={{ wellness: 6.1 }} />)

      const wellnessRow = screen.getByText('Wellness').closest('div')
      const icon = wellnessRow?.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('w-4', 'h-4', 'text-purple-500')
    })

    it('renders Target icon for Deliberate Practice dimension', () => {
      render(<SupportingDimensionsCard scores={{ deliberate_practice: 3.8 }} />)

      const deliberatePracticeRow = screen.getByText('Deliberate Practice').closest('div')
      const icon = deliberatePracticeRow?.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('w-4', 'h-4', 'text-purple-500')
    })

    it('renders all 4 different icons when all dimensions shown', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Should have 4 dimension icons (purple-500)
      const icons = document.querySelectorAll('svg.text-purple-500')
      expect(icons).toHaveLength(4)
    })
  })

  // ===========================================================================
  // Display Names Tests
  // ===========================================================================

  describe('pillar display names', () => {
    it('displays "Knowledge" for knowledge pillar', () => {
      render(<SupportingDimensionsCard scores={{ knowledge: 5.5 }} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
    })

    it('displays "Self-Awareness" for self_awareness pillar', () => {
      render(<SupportingDimensionsCard scores={{ self_awareness: 4.2 }} />)

      expect(screen.getByText('Self-Awareness')).toBeInTheDocument()
    })

    it('displays "Wellness" for wellness pillar', () => {
      render(<SupportingDimensionsCard scores={{ wellness: 6.1 }} />)

      expect(screen.getByText('Wellness')).toBeInTheDocument()
    })

    it('displays "Deliberate Practice" for deliberate_practice pillar', () => {
      render(<SupportingDimensionsCard scores={{ deliberate_practice: 3.8 }} />)

      expect(screen.getByText('Deliberate Practice')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Info Button Tests
  // ===========================================================================

  describe('info button interactions', () => {
    it('renders info button for each dimension', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Should have 4 info buttons
      const infoButtons = screen.getAllByRole('button', { name: /info about/i })
      expect(infoButtons).toHaveLength(4)
    })

    it('has accessible label for each info button', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      expect(screen.getByRole('button', { name: /info about knowledge/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /info about self-awareness/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /info about wellness/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /info about deliberate practice/i })).toBeInTheDocument()
    })

    it('opens modal when info button is clicked', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      // Modal should show Knowledge dimension details
      await waitFor(() => {
        // The modal shows the dimension name as a heading
        expect(screen.getByRole('heading', { name: 'Knowledge' })).toBeInTheDocument()
      })
    })

    it('shows dimension description in modal', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      await waitFor(() => {
        expect(
          screen.getByText(/understanding of mental processes/i)
        ).toBeInTheDocument()
      })
    })

    it('shows "Aspects Measured" section in modal', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      await waitFor(() => {
        expect(screen.getByText('Aspects Measured')).toBeInTheDocument()
      })
    })

    it('shows "Example Question" section in modal', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      await waitFor(() => {
        expect(screen.getByText('Example Question')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Modal Close Tests
  // ===========================================================================

  describe('modal close behavior', () => {
    it('closes modal when close button is clicked', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Open modal
      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Knowledge' })).toBeInTheDocument()
      })

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      // Modal should close - heading should not be visible
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Knowledge' })).not.toBeInTheDocument()
      })
    })

    it('closes modal when clicking backdrop', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Open modal
      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Knowledge' })).toBeInTheDocument()
      })

      // Click backdrop (the overlay with bg-black/50)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
      fireEvent.click(backdrop!)

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Knowledge' })).not.toBeInTheDocument()
      })
    })

    it('closes modal when pressing Escape key', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Open modal
      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      fireEvent.click(infoButton)

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Knowledge' })).toBeInTheDocument()
      })

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Knowledge' })).not.toBeInTheDocument()
      })
    })

    it('can open different dimension modals sequentially', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Open Knowledge modal
      fireEvent.click(screen.getByRole('button', { name: /info about knowledge/i }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Knowledge' })).toBeInTheDocument()
      })

      // Close it
      fireEvent.keyDown(document, { key: 'Escape' })
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Knowledge' })).not.toBeInTheDocument()
      })

      // Open Wellness modal
      fireEvent.click(screen.getByRole('button', { name: /info about wellness/i }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Wellness' })).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Score Bar Integration Tests
  // ===========================================================================

  describe('score bar integration', () => {
    it('renders a score bar for each dimension', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Each dimension should have a score bar with the gray track
      const scoreBars = document.querySelectorAll('.bg-gray-200.rounded-full')
      expect(scoreBars).toHaveLength(4)
    })

    it('passes purple color scheme to score bars', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      // Score bars should use purple color scheme
      const purpleBars = document.querySelectorAll('[class*="bg-purple-"]')
      expect(purpleBars.length).toBeGreaterThan(0)
    })

    it('displays correct score values', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      expect(screen.getByText('5.5')).toBeInTheDocument()
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByText('6.1')).toBeInTheDocument()
      expect(screen.getByText('3.8')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Inline Variant Info Button Tests
  // ===========================================================================

  describe('inline variant info buttons', () => {
    it('renders info buttons in inline variant', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      const infoButtons = screen.getAllByRole('button', { name: /info about/i })
      expect(infoButtons).toHaveLength(4)
    })

    it('opens modal from inline variant info button', async () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} variant="inline" />)

      const infoButton = screen.getByRole('button', { name: /info about wellness/i })
      fireEvent.click(infoButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Wellness' })).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles missing scores for some dimensions gracefully', () => {
      const partialScores = {
        knowledge: 5.5,
        // self_awareness missing
        wellness: 6.1,
        // deliberate_practice missing
      }

      render(<SupportingDimensionsCard scores={partialScores} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
      expect(screen.getByText('Wellness')).toBeInTheDocument()
      expect(screen.queryByText('Self-Awareness')).not.toBeInTheDocument()
      expect(screen.queryByText('Deliberate Practice')).not.toBeInTheDocument()
    })

    it('handles zero scores correctly', () => {
      const zeroScores = {
        knowledge: 0,
        wellness: 0,
      }

      render(<SupportingDimensionsCard scores={zeroScores} />)

      expect(screen.getByText('Knowledge')).toBeInTheDocument()
      expect(screen.getByText('Wellness')).toBeInTheDocument()
      expect(screen.getAllByText('0.0')).toHaveLength(2)
    })

    it('handles maximum scores correctly', () => {
      const maxScores = {
        knowledge: 7,
        self_awareness: 7,
        wellness: 7,
        deliberate_practice: 7,
      }

      render(<SupportingDimensionsCard scores={maxScores} />)

      expect(screen.getAllByText('7.0')).toHaveLength(4)
    })

    it('handles mixed core and supporting scores', () => {
      const mixedScores = {
        mindfulness: 5.0,
        confidence: 4.5,
        knowledge: 6.0,
        self_awareness: 5.5,
      }

      render(<SupportingDimensionsCard scores={mixedScores} />)

      // Should only show supporting dimensions
      expect(screen.getByText('Knowledge')).toBeInTheDocument()
      expect(screen.getByText('Self-Awareness')).toBeInTheDocument()
      expect(screen.queryByText('Mindfulness')).not.toBeInTheDocument()
      expect(screen.queryByText('Confidence')).not.toBeInTheDocument()
    })

    it('maintains dimension order consistently', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const dimensionLabels = screen.getAllByText(
        /Knowledge|Self-Awareness|Wellness|Deliberate Practice/
      )

      // Order should be: Knowledge, Self-Awareness, Wellness, Deliberate Practice
      expect(dimensionLabels[0]).toHaveTextContent('Knowledge')
      expect(dimensionLabels[1]).toHaveTextContent('Self-Awareness')
      expect(dimensionLabels[2]).toHaveTextContent('Wellness')
      expect(dimensionLabels[3]).toHaveTextContent('Deliberate Practice')
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('accessibility', () => {
    it('info buttons have accessible names', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const knowledgeButton = screen.getByRole('button', { name: /info about knowledge/i })
      expect(knowledgeButton).toHaveAttribute('aria-label', 'Info about Knowledge')
    })

    it('applies focus styles to info buttons', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const infoButton = screen.getByRole('button', { name: /info about knowledge/i })
      expect(infoButton).toHaveClass('hover:bg-purple-100', 'transition-colors')
    })

    it('renders semantic heading for card title', () => {
      render(<SupportingDimensionsCard scores={allSupportingScores} />)

      const heading = screen.getByRole('heading', { name: /supporting dimensions/i })
      expect(heading).toBeInTheDocument()
    })
  })
})
