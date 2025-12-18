import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ActivityCompletion from './ActivityCompletion'

interface ActivityCompletionContent {
  title: string
  message: string
  next_activity_hint?: string
}

describe('ActivityCompletion', () => {
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
    it('renders the title', () => {
      const content: ActivityCompletionContent = {
        title: 'Activity Complete!',
        message: 'You finished this activity.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      expect(screen.getByText('Activity Complete!')).toBeInTheDocument()
    })

    it('renders the completion message', () => {
      const content: ActivityCompletionContent = {
        title: 'Great Job!',
        message: 'You have successfully completed the activity.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      expect(screen.getByText('You have successfully completed the activity.')).toBeInTheDocument()
    })

    it('renders the celebration checkmark icon', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      // The SVG checkmark icon should be present
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders Complete Activity button', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      expect(screen.getByRole('button', { name: /complete activity/i })).toBeInTheDocument()
    })
  })

  describe('next activity hint', () => {
    it('shows next activity hint when provided', () => {
      const content: ActivityCompletionContent = {
        title: 'Activity 1 Complete',
        message: 'Well done!',
        next_activity_hint: 'Working With Discomfort',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      expect(screen.getByText(/up next:/i)).toBeInTheDocument()
      expect(screen.getByText('Working With Discomfort')).toBeInTheDocument()
    })

    it('does not show next activity hint when not provided', () => {
      const content: ActivityCompletionContent = {
        title: 'Final Activity Complete',
        message: 'You finished the module!',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      expect(screen.queryByText(/up next:/i)).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onContinue when Complete Activity button is clicked', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      fireEvent.click(button)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('color theming', () => {
    it('applies emerald color theme', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} moduleColor="emerald" />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      expect(button).toHaveClass('bg-emerald-600')
    })

    it('applies purple color theme', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} moduleColor="purple" />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      expect(button).toHaveClass('bg-purple-600')
    })

    it('applies blue color theme', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} moduleColor="blue" />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      expect(button).toHaveClass('bg-blue-600')
    })

    it('defaults to purple when unknown color provided', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} moduleColor="unknown" />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      expect(button).toHaveClass('bg-purple-600')
    })
  })

  describe('accessibility', () => {
    it('has accessible button', () => {
      const content: ActivityCompletionContent = {
        title: 'Done!',
        message: 'Activity finished.',
      }

      render(<ActivityCompletion {...defaultProps} content={content} />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      expect(button).toBeEnabled()
    })
  })
})
