import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TapMatching from './TapMatching'
import { TapMatchingContent } from '../types'

describe('TapMatching', () => {
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

  const basicContent: TapMatchingContent = {
    prompt: 'Match the stress sensation with a helpful reframe:',
    items: [
      { id: 'heart', text: 'Faster heartbeat', correct_match: 'energized' },
      { id: 'muscles', text: 'Tight muscles', correct_match: 'activated' },
      { id: 'thoughts', text: 'Racing thoughts', correct_match: 'preparing' },
    ],
    targets: [
      { id: 'energized', label: 'My body is energized and ready' },
      { id: 'activated', label: 'My body is activated and stable' },
      { id: 'preparing', label: 'My brain is preparing and problem-solving' },
    ],
    show_feedback: true,
  }

  describe('basic rendering', () => {
    it('renders the prompt', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      expect(screen.getByText('Match the stress sensation with a helpful reframe:')).toBeInTheDocument()
    })

    it('renders all items', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      expect(screen.getByText('Faster heartbeat')).toBeInTheDocument()
      expect(screen.getByText('Tight muscles')).toBeInTheDocument()
      expect(screen.getByText('Racing thoughts')).toBeInTheDocument()
    })

    it('renders all targets', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      expect(screen.getByText('My body is energized and ready')).toBeInTheDocument()
      expect(screen.getByText('My body is activated and stable')).toBeInTheDocument()
      expect(screen.getByText('My brain is preparing and problem-solving')).toBeInTheDocument()
    })

    it('renders continue button disabled initially', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toBeDisabled()
    })
  })

  describe('matching interaction', () => {
    it('highlights item when clicked', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      const item = screen.getByText('Faster heartbeat')
      fireEvent.click(item)
      // Item should be highlighted with module color background/border when selected
      const button = item.closest('button')
      expect(button).toHaveClass('bg-purple-50')
      expect(button).toHaveClass('border-purple-500')
    })

    it('creates match when target is clicked after item', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      const item = screen.getByText('Faster heartbeat')
      const target = screen.getByText('My body is energized and ready')

      fireEvent.click(item)
      fireEvent.click(target)

      // Item should now show matched state (gray background/border, not selected anymore)
      const button = item.closest('button')
      expect(button).toHaveClass('bg-gray-50')
      expect(button).toHaveClass('border-gray-300')
    })

    it('shows correct feedback for correct match when all matched', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)

      // Make all correct matches
      fireEvent.click(screen.getByText('Faster heartbeat'))
      fireEvent.click(screen.getByText('My body is energized and ready'))

      fireEvent.click(screen.getByText('Tight muscles'))
      fireEvent.click(screen.getByText('My body is activated and stable'))

      fireEvent.click(screen.getByText('Racing thoughts'))
      fireEvent.click(screen.getByText('My brain is preparing and problem-solving'))

      // Should show success message when all correct
      expect(screen.getByText('Great job! All correct!')).toBeInTheDocument()
    })

    it('shows Try Again button for incorrect matches', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)

      // Make all matches, but one is wrong
      fireEvent.click(screen.getByText('Faster heartbeat'))
      fireEvent.click(screen.getByText('My body is activated and stable')) // Wrong!

      fireEvent.click(screen.getByText('Tight muscles'))
      fireEvent.click(screen.getByText('My body is energized and ready')) // Wrong!

      fireEvent.click(screen.getByText('Racing thoughts'))
      fireEvent.click(screen.getByText('My brain is preparing and problem-solving'))

      // Should show Try Again button
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  describe('saved response', () => {
    it('restores matches from saved response', () => {
      const savedResponse = {
        matches: {
          heart: 'energized',
          muscles: 'activated',
          thoughts: 'preparing',
        },
      }

      render(
        <TapMatching
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // When all matches are correct and restored, should show success message
      // and continue button should be enabled
      expect(screen.getByText('Great job! All correct!')).toBeInTheDocument()
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('saves matches on completion', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)

      // Make all correct matches
      fireEvent.click(screen.getByText('Faster heartbeat'))
      fireEvent.click(screen.getByText('My body is energized and ready'))

      fireEvent.click(screen.getByText('Tight muscles'))
      fireEvent.click(screen.getByText('My body is activated and stable'))

      fireEvent.click(screen.getByText('Racing thoughts'))
      fireEvent.click(screen.getByText('My brain is preparing and problem-solving'))

      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        matches: {
          heart: 'energized',
          muscles: 'activated',
          thoughts: 'preparing',
        },
      })
    })
  })

  describe('keyboard accessibility', () => {
    it('allows keyboard selection with Enter', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      const item = screen.getByText('Faster heartbeat').closest('button')!

      fireEvent.keyDown(item, { key: 'Enter' })
      // Item should be highlighted with module color background/border when selected
      expect(item).toHaveClass('bg-purple-50')
      expect(item).toHaveClass('border-purple-500')
    })

    it('allows keyboard selection with Space', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)
      const item = screen.getByText('Faster heartbeat').closest('button')!

      fireEvent.keyDown(item, { key: ' ' })
      // Item should be highlighted with module color background/border when selected
      expect(item).toHaveClass('bg-purple-50')
      expect(item).toHaveClass('border-purple-500')
    })
  })

  describe('continue button', () => {
    it('enables continue after all correct matches', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)

      // Make all correct matches
      fireEvent.click(screen.getByText('Faster heartbeat'))
      fireEvent.click(screen.getByText('My body is energized and ready'))

      fireEvent.click(screen.getByText('Tight muscles'))
      fireEvent.click(screen.getByText('My body is activated and stable'))

      fireEvent.click(screen.getByText('Racing thoughts'))
      fireEvent.click(screen.getByText('My brain is preparing and problem-solving'))

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).not.toBeDisabled()
    })

    it('calls onContinue when clicked', () => {
      render(<TapMatching {...defaultProps} content={basicContent} />)

      // Make all correct matches
      fireEvent.click(screen.getByText('Faster heartbeat'))
      fireEvent.click(screen.getByText('My body is energized and ready'))

      fireEvent.click(screen.getByText('Tight muscles'))
      fireEvent.click(screen.getByText('My body is activated and stable'))

      fireEvent.click(screen.getByText('Racing thoughts'))
      fireEvent.click(screen.getByText('My brain is preparing and problem-solving'))

      const button = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(button)

      expect(mockOnContinue).toHaveBeenCalled()
    })
  })
})
