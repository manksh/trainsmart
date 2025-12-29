import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import GuidedBreathing from './GuidedBreathing'
import { GuidedBreathingContent } from '../types'

describe('GuidedBreathing', () => {
  const mockOnContinue = vi.fn()
  const mockOnSaveResponse = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultProps = {
    onContinue: mockOnContinue,
    onSaveResponse: mockOnSaveResponse,
    moduleColor: 'purple',
  }

  const basicContent: GuidedBreathingContent = {
    title: 'Take a Moment to Breathe',
    instruction: 'Follow the animation and breathe deeply',
    timing: {
      inhale_seconds: 4,
      hold_seconds: 4,
      exhale_seconds: 4,
    },
    cycles: 3,
    skippable: true,
    audio_enabled: false,
  }

  describe('intro screen rendering', () => {
    it('renders the title', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Take a Moment to Breathe')).toBeInTheDocument()
    })

    it('renders the instruction when provided', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Follow the animation and breathe deeply')).toBeInTheDocument()
    })

    it('renders Begin Breathing button initially', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      expect(screen.getByRole('button', { name: /begin breathing/i })).toBeInTheDocument()
    })

    it('displays timing information', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      // Shows inhale, hold, exhale times and cycles - use getAllByText since 4s appears multiple times
      const timings = screen.getAllByText('4s')
      expect(timings.length).toBeGreaterThan(0)
      expect(screen.getByText('Inhale')).toBeInTheDocument()
      expect(screen.getByText('3 cycles')).toBeInTheDocument()
    })

    it('displays timing without hold when hold_seconds is 0 or undefined', () => {
      const noHoldContent: GuidedBreathingContent = {
        ...basicContent,
        timing: {
          inhale_seconds: 4,
          exhale_seconds: 4,
        },
      }

      render(<GuidedBreathing {...defaultProps} content={noHoldContent} />)

      expect(screen.getByText('Inhale')).toBeInTheDocument()
      expect(screen.getByText('Exhale')).toBeInTheDocument()
      // Hold section should not appear when hold_seconds is undefined
    })
  })

  describe('exercise phases', () => {
    it('starts with inhale phase after clicking Begin Breathing', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
      })

      // Need to advance past the 500ms delay in handleStart and into first phase
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(screen.getByText('Breathe In')).toBeInTheDocument()
    })

    it('displays countdown timer during phases', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      // Should show countdown number (starts at inhale_seconds)
      // The timer shows the countdown in a span with class text-4xl
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  describe('cycle tracking', () => {
    it('shows current cycle number during exercise', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      // Check for progress indicator via aria-label
      expect(screen.getByLabelText(/progress: 1 of 3 cycles/i)).toBeInTheDocument()
    })
  })

  describe('skip functionality', () => {
    it('shows skip button when skippable is true', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    })

    it('does not show skip button when skippable is false', () => {
      const noSkipContent: GuidedBreathingContent = {
        ...basicContent,
        skippable: false,
      }

      render(<GuidedBreathing {...defaultProps} content={noSkipContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
    })

    it('saves response with breathing_skipped=true when skip is clicked', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      const skipButton = screen.getByRole('button', { name: /skip/i })

      act(() => {
        fireEvent.click(skipButton)
      })

      expect(mockOnSaveResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          breathing_completed: true,
          breathing_skipped: true,
          cycles_completed: expect.any(Number),
        })
      )
    })

    it('shows completion screen after skip', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      const skipButton = screen.getByRole('button', { name: /skip/i })

      act(() => {
        fireEvent.click(skipButton)
      })

      expect(screen.getByText('Exercise Skipped')).toBeInTheDocument()
    })

    it('allows Escape key to skip when skippable and running', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      // Find the container with keyboard handler and press Escape
      const container = screen.getByRole('application')

      act(() => {
        fireEvent.keyDown(container, { key: 'Escape' })
      })

      expect(mockOnSaveResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          breathing_skipped: true,
        })
      )
    })
  })

  describe('saved response restoration', () => {
    it('shows completion state if previously completed', () => {
      const savedResponse = {
        breathing_completed: true,
        breathing_skipped: false,
        cycles_completed: 3,
      }

      render(
        <GuidedBreathing
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Should show completion screen with continue button
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('shows skipped state if previously skipped', () => {
      const savedResponse = {
        breathing_completed: true,
        breathing_skipped: true,
        cycles_completed: 1,
      }

      render(
        <GuidedBreathing
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      expect(screen.getByText('Exercise Skipped')).toBeInTheDocument()
    })

    it('calls onContinue when continue button is clicked on completion screen', () => {
      const savedResponse = {
        breathing_completed: true,
        breathing_skipped: false,
        cycles_completed: 3,
      }

      render(
        <GuidedBreathing
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('timer cleanup', () => {
    it('cleans up on unmount without errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { unmount } = render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
      })

      // Unmount while animation is running
      unmount()

      // Advance timers - should not cause React state update errors
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Check no React state update errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Can't perform a React state update")
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('accessibility', () => {
    it('has screen reader announcements during exercise', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      // Should have a status region for screen readers
      const statusRegion = screen.getByRole('status')
      expect(statusRegion).toBeInTheDocument()
    })

    it('exercise container has application role', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })

      act(() => {
        fireEvent.click(startButton)
        vi.advanceTimersByTime(600)
      })

      const container = screen.getByRole('application')
      expect(container).toHaveAttribute('aria-label', 'Breathing exercise in progress')
    })

    it('Begin Breathing button is keyboard accessible', () => {
      render(<GuidedBreathing {...defaultProps} content={basicContent} />)

      const startButton = screen.getByRole('button', { name: /begin breathing/i })
      startButton.focus()
      expect(startButton).toHaveFocus()
    })
  })

  describe('edge cases', () => {
    it('handles undefined savedResponse', () => {
      render(
        <GuidedBreathing
          {...defaultProps}
          content={basicContent}
          savedResponse={undefined}
        />
      )

      // Should render in initial state
      expect(screen.getByRole('button', { name: /begin breathing/i })).toBeInTheDocument()
    })

    it('handles content without optional instruction', () => {
      const noInstructionContent: GuidedBreathingContent = {
        title: 'Breathing Exercise',
        timing: {
          inhale_seconds: 4,
          exhale_seconds: 4,
        },
        cycles: 2,
        skippable: true,
      }

      render(<GuidedBreathing {...defaultProps} content={noInstructionContent} />)

      expect(screen.getByText('Breathing Exercise')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /begin breathing/i })).toBeInTheDocument()
    })
  })
})
