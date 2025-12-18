import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScreenRenderer from './ScreenRenderer'
import {
  Screen,
  SwipeCardContent,
  FullScreenStatementContent,
  SingleTapReflectionContent,
  MicroCommitmentContent,
  ActivityCompletionContent,
} from '../types'

describe('ScreenRenderer', () => {
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

  describe('swipe_card screen type', () => {
    it('renders SwipeCard component for swipe_card type', () => {
      const screen_: Screen = {
        id: 'test_swipe',
        type: 'swipe_card',
        content: {
          body: 'This is a swipe card',
          title: 'Swipe Card Title',
        } as SwipeCardContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('This is a swipe card')).toBeInTheDocument()
      expect(screen.getByText('Swipe Card Title')).toBeInTheDocument()
    })

    it('handles swipe_card with follow_up', () => {
      const screen_: Screen = {
        id: 'test_swipe_followup',
        type: 'swipe_card',
        content: {
          body: 'Main content',
          follow_up: 'Follow up content',
        } as SwipeCardContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('Tap to reveal more')).toBeInTheDocument()
    })
  })

  describe('full_screen_statement screen type', () => {
    it('renders FullScreenStatement component for full_screen_statement type', () => {
      const screen_: Screen = {
        id: 'test_statement',
        type: 'full_screen_statement',
        content: {
          statement: 'This is a bold statement',
          style: 'insight',
        } as FullScreenStatementContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('This is a bold statement')).toBeInTheDocument()
    })
  })

  describe('single_tap_reflection screen type', () => {
    it('renders SingleTapReflection component for single_tap_reflection type', () => {
      const screen_: Screen = {
        id: 'test_reflection',
        type: 'single_tap_reflection',
        content: {
          prompt: 'How are you feeling?',
          options: [
            { id: 'good', label: 'Good' },
            { id: 'ok', label: 'OK' },
            { id: 'struggling', label: 'Struggling' },
          ],
        } as SingleTapReflectionContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('How are you feeling?')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()
      expect(screen.getByText('OK')).toBeInTheDocument()
      expect(screen.getByText('Struggling')).toBeInTheDocument()
    })
  })

  describe('micro_commitment screen type', () => {
    it('renders MicroCommitment component for micro_commitment type', () => {
      const screen_: Screen = {
        id: 'test_commitment',
        type: 'micro_commitment',
        content: {
          prompt: 'What will you commit to?',
          options: [
            { id: 'opt1', text: 'Option 1' },
            { id: 'opt2', text: 'Option 2' },
          ],
        } as MicroCommitmentContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('What will you commit to?')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /i commit to this/i })).toBeInTheDocument()
    })
  })

  describe('activity_completion screen type', () => {
    it('renders ActivityCompletion component for activity_completion type', () => {
      const screen_: Screen = {
        id: 'test_completion',
        type: 'activity_completion',
        content: {
          title: 'Activity Complete!',
          message: 'Great job finishing this activity.',
          next_activity_hint: 'Next up: Working With Discomfort',
        } as ActivityCompletionContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('Activity Complete!')).toBeInTheDocument()
      expect(screen.getByText('Great job finishing this activity.')).toBeInTheDocument()
      expect(screen.getByText('Next up: Working With Discomfort')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /complete activity/i })).toBeInTheDocument()
    })

    it('passes onContinue to ActivityCompletion', () => {
      const screen_: Screen = {
        id: 'test_completion',
        type: 'activity_completion',
        content: {
          title: 'Done!',
          message: 'Finished.',
        } as ActivityCompletionContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      fireEvent.click(screen.getByRole('button', { name: /complete activity/i }))

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('unknown screen type', () => {
    it('renders PlaceholderScreen for unknown types', () => {
      const screen_: Screen = {
        id: 'test_unknown',
        type: 'unknown_type' as any,
        content: {} as any,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      expect(screen.getByText('Screen type: unknown_type')).toBeInTheDocument()
      expect(screen.getByText('Component coming soon')).toBeInTheDocument()
    })

    it('placeholder screen has working continue button', () => {
      const screen_: Screen = {
        id: 'test_unknown',
        type: 'future_type' as any,
        content: {} as any,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('props passing', () => {
    it('passes moduleColor to components', () => {
      const screen_: Screen = {
        id: 'test_color',
        type: 'activity_completion',
        content: {
          title: 'Done!',
          message: 'Finished.',
        } as ActivityCompletionContent,
      }

      render(<ScreenRenderer {...defaultProps} screen={screen_} moduleColor="emerald" />)

      const button = screen.getByRole('button', { name: /complete activity/i })
      expect(button).toHaveClass('bg-emerald-600')
    })

    it('passes savedResponse to components', () => {
      const screen_: Screen = {
        id: 'test_saved',
        type: 'micro_commitment',
        content: {
          prompt: 'Choose one:',
          options: [
            { id: 'opt1', text: 'Option 1' },
            { id: 'opt2', text: 'Option 2' },
          ],
        } as MicroCommitmentContent,
      }

      const savedResponse = { commitment_id: 'opt2' }

      render(<ScreenRenderer {...defaultProps} screen={screen_} savedResponse={savedResponse} />)

      // The commit button should be enabled because opt2 is pre-selected
      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).not.toBeDisabled()
    })
  })
})
