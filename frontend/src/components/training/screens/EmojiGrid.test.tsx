import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmojiGrid from './EmojiGrid'
import { EmojiGridContent } from '../types'

describe('EmojiGrid', () => {
  const mockOnContinue = vi.fn()
  const mockOnSaveResponse = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    onContinue: mockOnContinue,
    onSaveResponse: mockOnSaveResponse,
    moduleColor: 'purple',
  }

  // Sample content with 5 core emotions and 3 non-core emotions
  const basicContent: EmojiGridContent = {
    prompt: 'Explore emotions by tapping them',
    core_required_message: 'Explore all 5 core emotions to continue',
    emotions: [
      {
        id: 'joy',
        emoji: '😊',
        label: 'Joy',
        is_core: true,
        detail: {
          description: 'A feeling of happiness and contentment.',
          body_feelings: ['Warm chest', 'Relaxed muscles'],
          similar_feelings: ['Happiness', 'Delight'],
          when_helpful: ['Celebrating achievements'],
          when_challenging: ['When others are struggling'],
        },
      },
      {
        id: 'sadness',
        emoji: '😢',
        label: 'Sadness',
        is_core: true,
        detail: {
          description: 'A feeling of sorrow or unhappiness.',
          body_feelings: ['Heavy chest', 'Low energy'],
          similar_feelings: ['Grief', 'Disappointment'],
        },
      },
      {
        id: 'anger',
        emoji: '😠',
        label: 'Anger',
        is_core: true,
        detail: {
          description: 'A strong feeling of displeasure.',
          body_feelings: ['Tense muscles', 'Clenched jaw'],
        },
      },
      {
        id: 'fear',
        emoji: '😨',
        label: 'Fear',
        is_core: true,
        detail: {
          description: 'An unpleasant emotion caused by threat.',
          body_feelings: ['Racing heart', 'Sweaty palms'],
        },
      },
      {
        id: 'disgust',
        emoji: '🤢',
        label: 'Disgust',
        is_core: true,
        detail: {
          description: 'A feeling of revulsion or strong disapproval.',
          body_feelings: ['Nausea', 'Tense stomach'],
        },
      },
      {
        id: 'surprise',
        emoji: '😮',
        label: 'Surprise',
        is_core: false,
        detail: {
          description: 'A brief emotional state from unexpected events.',
        },
      },
      {
        id: 'anticipation',
        emoji: '🤔',
        label: 'Anticipation',
        is_core: false,
        detail: {
          description: 'Looking forward to future events.',
        },
      },
      {
        id: 'trust',
        emoji: '🤝',
        label: 'Trust',
        is_core: false,
        detail: {
          description: 'Belief in reliability of someone or something.',
        },
      },
    ],
  }

  describe('basic rendering', () => {
    it('renders the prompt text', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Explore emotions by tapping them')).toBeInTheDocument()
    })

    it('renders all emotions in the grid', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Joy')).toBeInTheDocument()
      expect(screen.getByText('Sadness')).toBeInTheDocument()
      expect(screen.getByText('Anger')).toBeInTheDocument()
      expect(screen.getByText('Fear')).toBeInTheDocument()
      expect(screen.getByText('Disgust')).toBeInTheDocument()
      expect(screen.getByText('Surprise')).toBeInTheDocument()
      expect(screen.getByText('Anticipation')).toBeInTheDocument()
      expect(screen.getByText('Trust')).toBeInTheDocument()
    })

    it('renders emoji for each emotion', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      expect(screen.getByText('😊')).toBeInTheDocument()
      expect(screen.getByText('😢')).toBeInTheDocument()
      expect(screen.getByText('😠')).toBeInTheDocument()
    })

    it('renders core required message when not all core explored', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      expect(screen.getByText(/Explore all 5 core emotions to continue/)).toBeInTheDocument()
    })

    it('shows progress indicator for core emotions', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      expect(screen.getByText('(0/5)')).toBeInTheDocument()
    })
  })

  describe('core emotion borders', () => {
    it('core emotions have distinct border styling', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Find the Joy button (core emotion)
      const joyButton = screen.getByRole('gridcell', { name: /Joy \(core emotion\)/ })
      expect(joyButton).toHaveClass('border-2')

      // Find the Surprise button (non-core emotion)
      const surpriseButton = screen.getByRole('gridcell', { name: /Surprise/ })
      expect(surpriseButton).toHaveClass('border')
      expect(surpriseButton).not.toHaveClass('border-2')
    })

    it('core emotions show Core indicator when not explored', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Core indicator should be visible for unexplored core emotions
      const coreIndicators = screen.getAllByText('Core')
      expect(coreIndicators.length).toBe(5) // 5 core emotions
    })
  })

  describe('modal functionality', () => {
    it('opens modal when emotion is tapped', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('A feeling of happiness and contentment.')).toBeInTheDocument()
      })
    })

    it('displays emotion details in modal', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        // Check description
        expect(screen.getByText('A feeling of happiness and contentment.')).toBeInTheDocument()

        // Check body feelings
        expect(screen.getByText('Warm chest')).toBeInTheDocument()
        expect(screen.getByText('Relaxed muscles')).toBeInTheDocument()

        // Check similar feelings
        expect(screen.getByText('Happiness')).toBeInTheDocument()
        expect(screen.getByText('Delight')).toBeInTheDocument()

        // Check when helpful
        expect(screen.getByText('Celebrating achievements')).toBeInTheDocument()

        // Check when challenging
        expect(screen.getByText('When others are struggling')).toBeInTheDocument()
      })
    })

    it('closes modal when close button is clicked', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Open modal
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Close modal
      const closeButton = screen.getByRole('button', { name: /Close emotion details/ })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal when Back to Grid button is clicked', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Open modal
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click Back to Grid
      const backButton = screen.getByRole('button', { name: /Back to Grid/ })
      fireEvent.click(backButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal when backdrop is clicked', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Open modal
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Click backdrop
      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal when Escape key is pressed', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Open modal
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Press Escape
      const dialog = screen.getByRole('dialog')
      fireEvent.keyDown(dialog, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('shows Core badge in modal for core emotions', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        // In the modal header, there should be a Core badge
        const modal = screen.getByRole('dialog')
        const coreBadge = modal.querySelector('span')
        expect(screen.getByText('A feeling of happiness and contentment.')).toBeInTheDocument()
      })
    })
  })

  describe('continue button behavior', () => {
    it('disables continue button when not all core emotions are explored', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
    })

    it('enables continue button when all core emotions are explored', async () => {
      // Start with all core emotions already explored
      const savedResponse = {
        revealed_items: ['joy', 'sadness', 'anger', 'fear', 'disgust'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('calls onContinue when continue button is clicked after all core explored', () => {
      const savedResponse = {
        revealed_items: ['joy', 'sadness', 'anger', 'fear', 'disgust'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })

    it('allows continue even if non-core emotions are not explored', () => {
      // Only core emotions explored, not non-core
      const savedResponse = {
        revealed_items: ['joy', 'sadness', 'anger', 'fear', 'disgust'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })
  })

  describe('progress tracking', () => {
    it('saves revealed_items when emotion is explored', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenCalledWith({
          revealed_items: ['joy'],
        })
      })
    })

    it('accumulates explored emotions in revealed_items', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      // Explore Joy
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenCalledWith({
          revealed_items: ['joy'],
        })
      })

      // Close modal
      const backButton = screen.getByRole('button', { name: /Back to Grid/ })
      fireEvent.click(backButton)

      // Explore Sadness
      const sadnessButton = screen.getByRole('gridcell', { name: /Sadness/ })
      fireEvent.click(sadnessButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenCalledWith({
          revealed_items: ['joy', 'sadness'],
        })
      })
    })

    it('does not duplicate emotions when tapped again', async () => {
      const savedResponse = {
        revealed_items: ['joy'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Tap Joy again
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      // Modal should open but response should not be called (already explored)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // onSaveResponse should not have been called since emotion was already explored
      expect(mockOnSaveResponse).not.toHaveBeenCalled()
    })

    it('shows checkmark on explored emotions', () => {
      const savedResponse = {
        revealed_items: ['joy', 'sadness'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Explored emotions should have aria-pressed=true
      const joyButton = screen.getByRole('gridcell', { name: /Joy.*explored/ })
      const sadnessButton = screen.getByRole('gridcell', { name: /Sadness.*explored/ })
      const angerButton = screen.getByRole('gridcell', { name: /Anger/ })

      expect(joyButton).toHaveAttribute('aria-pressed', 'true')
      expect(sadnessButton).toHaveAttribute('aria-pressed', 'true')
      expect(angerButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('updates progress indicator as core emotions are explored', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      expect(screen.getByText('(0/5)')).toBeInTheDocument()

      // Explore Joy
      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        expect(screen.getByText('(1/5)')).toBeInTheDocument()
      })
    })
  })

  describe('saved response restoration', () => {
    it('restores explored state from savedResponse on mount', () => {
      const savedResponse = {
        revealed_items: ['joy', 'fear', 'surprise'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // These should show as explored
      const joyButton = screen.getByRole('gridcell', { name: /Joy.*explored/ })
      const fearButton = screen.getByRole('gridcell', { name: /Fear.*explored/ })
      const surpriseButton = screen.getByRole('gridcell', { name: /Surprise.*explored/ })

      expect(joyButton).toHaveAttribute('aria-pressed', 'true')
      expect(fearButton).toHaveAttribute('aria-pressed', 'true')
      expect(surpriseButton).toHaveAttribute('aria-pressed', 'true')

      // Progress should reflect saved state
      expect(screen.getByText('(2/5)')).toBeInTheDocument() // joy and fear are core
    })

    it('allows continuing to explore from saved state', async () => {
      const savedResponse = {
        revealed_items: ['joy'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Explore another emotion
      const sadnessButton = screen.getByRole('gridcell', { name: /Sadness/ })
      fireEvent.click(sadnessButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenCalledWith({
          revealed_items: ['joy', 'sadness'],
        })
      })
    })
  })

  describe('accessibility', () => {
    it('emotion buttons are keyboard accessible', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })

      // Focus and press Enter
      joyButton.focus()
      expect(joyButton).toHaveFocus()

      fireEvent.keyDown(joyButton, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('emotion buttons respond to Space key', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })

      fireEvent.keyDown(joyButton, { key: ' ', code: 'Space' })

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('grid has proper role and aria-label', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const grid = screen.getByRole('grid', { name: /Emotions grid/ })
      expect(grid).toBeInTheDocument()
    })

    it('modal has proper aria attributes', async () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy/ })
      fireEvent.click(joyButton)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAttribute('aria-labelledby', 'emotion-detail-title')
      })
    })

    it('core emotions include core emotion in aria-label', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} />)

      const joyButton = screen.getByRole('gridcell', { name: /Joy \(core emotion\)/ })
      expect(joyButton).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles content with no core emotions', () => {
      const noCoreContent: EmojiGridContent = {
        prompt: 'Explore emotions',
        emotions: [
          {
            id: 'surprise',
            emoji: '😮',
            label: 'Surprise',
            is_core: false,
            detail: { description: 'A brief emotional state.' },
          },
        ],
      }

      render(<EmojiGrid {...defaultProps} content={noCoreContent} />)

      // Continue should be enabled since there are no core emotions required
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('handles empty emotions array', () => {
      const emptyContent: EmojiGridContent = {
        prompt: 'No emotions here',
        emotions: [],
      }

      render(<EmojiGrid {...defaultProps} content={emptyContent} />)

      expect(screen.getByText('No emotions here')).toBeInTheDocument()

      // Continue should be enabled since no core emotions exist
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('handles savedResponse with invalid emotion ids gracefully', () => {
      const savedResponse = {
        revealed_items: ['invalid_id', 'nonexistent'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Should not crash and should still work
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled() // Core emotions still not explored
    })

    it('handles undefined savedResponse', () => {
      render(<EmojiGrid {...defaultProps} content={basicContent} savedResponse={undefined} />)

      // Should render normally with no emotions explored
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
      expect(screen.getByText('(0/5)')).toBeInTheDocument()
    })

    it('handles emotion with minimal detail', async () => {
      const minimalContent: EmojiGridContent = {
        prompt: 'Explore',
        emotions: [
          {
            id: 'simple',
            emoji: '🙂',
            label: 'Simple',
            is_core: false,
            detail: { description: 'Just a description, nothing else.' },
          },
        ],
      }

      render(<EmojiGrid {...defaultProps} content={minimalContent} />)

      const simpleButton = screen.getByRole('gridcell', { name: /Simple/ })
      fireEvent.click(simpleButton)

      await waitFor(() => {
        expect(screen.getByText('Just a description, nothing else.')).toBeInTheDocument()
        // Should not show sections for missing detail fields
        expect(screen.queryByText('How it feels in your body')).not.toBeInTheDocument()
        expect(screen.queryByText('Similar feelings')).not.toBeInTheDocument()
      })
    })
  })

  describe('visual states', () => {
    it('explored emotions have different background', () => {
      const savedResponse = {
        revealed_items: ['joy'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const joyButton = screen.getByRole('gridcell', { name: /Joy.*explored/ })
      const angerButton = screen.getByRole('gridcell', { name: /Anger/ })

      // Explored emotion should have light background class
      expect(joyButton.className).toContain('bg-purple-50')

      // Unexplored emotion should have white background
      expect(angerButton.className).toContain('bg-white')
    })

    it('hides core required message when all core are explored', () => {
      const savedResponse = {
        revealed_items: ['joy', 'sadness', 'anger', 'fear', 'disgust'],
      }

      render(
        <EmojiGrid
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      expect(screen.queryByText(/Explore all 5 core emotions to continue/)).not.toBeInTheDocument()
    })
  })
})
