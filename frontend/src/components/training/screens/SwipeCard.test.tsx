import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SwipeCard from './SwipeCard'
import { SwipeCardContent } from '../types'

describe('SwipeCard', () => {
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

  describe('basic rendering', () => {
    it('renders the main body text', () => {
      const content: SwipeCardContent = {
        body: 'This is the main content',
      }

      render(<SwipeCard {...defaultProps} content={content} />)

      expect(screen.getByText('This is the main content')).toBeInTheDocument()
    })

    it('renders title when provided', () => {
      const content: SwipeCardContent = {
        title: 'Card Title',
        body: 'This is the main content',
      }

      render(<SwipeCard {...defaultProps} content={content} />)

      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('renders subtext when provided', () => {
      const content: SwipeCardContent = {
        body: 'Main content',
        subtext: 'Some additional context',
      }

      render(<SwipeCard {...defaultProps} content={content} />)

      expect(screen.getByText('Some additional context')).toBeInTheDocument()
    })

    it('does not render title when not provided', () => {
      const content: SwipeCardContent = {
        body: 'Just the body',
      }

      render(<SwipeCard {...defaultProps} content={content} />)

      // Should only have the body text, no heading
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })
  })

  describe('continue button without follow_up', () => {
    it('enables continue button when no follow_up exists', () => {
      const content: SwipeCardContent = {
        body: 'Simple content',
      }

      render(<SwipeCard {...defaultProps} content={content} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('calls onContinue when continue button is clicked', () => {
      const content: SwipeCardContent = {
        body: 'Simple content',
      }

      render(<SwipeCard {...defaultProps} content={content} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('flip card with follow_up', () => {
    const contentWithFollowUp: SwipeCardContent = {
      body: 'Main content',
      follow_up: 'Hidden follow-up content',
    }

    it('shows "Tap to reveal more" button when follow_up exists', () => {
      render(<SwipeCard {...defaultProps} content={contentWithFollowUp} />)

      expect(screen.getByText('Tap to reveal more')).toBeInTheDocument()
    })

    it('disables continue button before flip', () => {
      render(<SwipeCard {...defaultProps} content={contentWithFollowUp} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
    })

    it('reveals follow_up content when flip card is clicked', () => {
      render(<SwipeCard {...defaultProps} content={contentWithFollowUp} />)

      // Click the flip card area
      const flipCard = screen.getByText('Tap to reveal more').closest('div')
      fireEvent.click(flipCard!.parentElement!.parentElement!)

      // Follow-up content should now be visible
      expect(screen.getByText('Hidden follow-up content')).toBeInTheDocument()
    })

    it('enables continue button after flip', () => {
      render(<SwipeCard {...defaultProps} content={contentWithFollowUp} />)

      // Click the flip card
      const flipCard = screen.getByText('Tap to reveal more').closest('div')
      fireEvent.click(flipCard!.parentElement!.parentElement!)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('does not flip back when clicked again', () => {
      render(<SwipeCard {...defaultProps} content={contentWithFollowUp} />)

      // Click to flip
      const flipArea = screen.getByText('Tap to reveal more').closest('div')!.parentElement!.parentElement!
      fireEvent.click(flipArea)

      // Click again
      fireEvent.click(flipArea)

      // Should still show follow-up (not flipped back)
      expect(screen.getByText('Hidden follow-up content')).toBeInTheDocument()
    })
  })

  describe('color theming', () => {
    it('applies emerald color classes', () => {
      const content: SwipeCardContent = {
        body: 'Content',
        title: 'Emerald Card',
      }

      render(<SwipeCard {...defaultProps} content={content} moduleColor="emerald" />)

      const title = screen.getByText('Emerald Card')
      expect(title).toHaveClass('text-emerald-600')
    })

    it('applies blue color classes', () => {
      const content: SwipeCardContent = {
        body: 'Content',
        title: 'Blue Card',
      }

      render(<SwipeCard {...defaultProps} content={content} moduleColor="blue" />)

      const title = screen.getByText('Blue Card')
      expect(title).toHaveClass('text-blue-600')
    })

    it('defaults to purple when unknown color provided', () => {
      const content: SwipeCardContent = {
        body: 'Content',
        title: 'Unknown Color Card',
      }

      render(<SwipeCard {...defaultProps} content={content} moduleColor="unknown" />)

      const title = screen.getByText('Unknown Color Card')
      expect(title).toHaveClass('text-purple-600')
    })
  })
})
