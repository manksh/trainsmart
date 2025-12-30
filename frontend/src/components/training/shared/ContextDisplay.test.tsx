import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContextDisplay from './ContextDisplay'
import { ScreenResponse } from '../types'

describe('ContextDisplay', () => {
  const defaultProps = {
    moduleColor: 'amber',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('card style (default)', () => {
    it('renders text_input response in card style', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s3_goal_input: { text_input: 'Run a 5K marathon in under 30 minutes' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'a4_s3_goal_input', label: 'Your goal:' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Your goal:')).toBeInTheDocument()
      expect(screen.getByText('Run a 5K marathon in under 30 minutes')).toBeInTheDocument()
    })

    it('renders with border and background classes in card style', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Test goal' },
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen', style: 'card' }}
          allScreenResponses={allScreenResponses}
        />
      )

      // Card style should have rounded corners and border
      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('rounded-xl')
      expect(cardElement).toHaveClass('border-2')
    })

    it('renders without label when label is not provided', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'My specific goal' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('My specific goal')).toBeInTheDocument()
      // Should not have a label element
      expect(screen.queryByText(/:/)).not.toBeInTheDocument()
    })
  })

  describe('inline style', () => {
    it('renders text_input response in inline style', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Improve my free throw percentage' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen', label: 'Goal:', style: 'inline' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Goal:')).toBeInTheDocument()
      expect(screen.getByText('Improve my free throw percentage')).toBeInTheDocument()
    })

    it('renders label and value on same line in inline style', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Test inline' },
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen', label: 'Goal:', style: 'inline' }}
          allScreenResponses={allScreenResponses}
        />
      )

      // Should be a p element with inline content
      const paragraph = container.querySelector('p')
      expect(paragraph).toBeInTheDocument()
      expect(paragraph).toHaveClass('text-gray-600')
    })
  })

  describe('quote style', () => {
    it('renders text_input response in quote style with quotation marks', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Be the best version of myself' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen', label: 'You said:', style: 'quote' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('You said:')).toBeInTheDocument()
      expect(screen.getByText('"Be the best version of myself"')).toBeInTheDocument()
    })

    it('renders as blockquote with border in quote style', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Test quote' },
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen', style: 'quote' }}
          allScreenResponses={allScreenResponses}
        />
      )

      const blockquote = container.querySelector('blockquote')
      expect(blockquote).toBeInTheDocument()
      expect(blockquote).toHaveClass('border-l-4')
    })

    it('renders italic text in quote style', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Italic text' },
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'goal_screen', style: 'quote' }}
          allScreenResponses={allScreenResponses}
        />
      )

      const italicElement = container.querySelector('.italic')
      expect(italicElement).toBeInTheDocument()
    })
  })

  describe('different response types', () => {
    it('extracts text_input from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        text_screen: { text_input: 'My text input response' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'text_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('My text input response')).toBeInTheDocument()
    })

    it('extracts selection from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        choice_screen: { selection: 'option_a' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'choice_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('option_a')).toBeInTheDocument()
    })

    it('extracts and formats commitment_id from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        commitment_screen: { commitment_id: 'mc_practice_daily' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'commitment_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      // commitment_id gets formatted: mc_practice_daily -> practice daily
      expect(screen.getByText('practice daily')).toBeInTheDocument()
    })

    it('extracts text_inputs (multiple) and joins them', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        multi_input_screen: { text_inputs: ['First goal', 'Second goal', 'Third goal'] },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'multi_input_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('First goal, Second goal, Third goal')).toBeInTheDocument()
    })

    it('prioritizes text_input over other response types', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        mixed_screen: {
          text_input: 'Primary text input',
          selection: 'fallback_selection',
        },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'mixed_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Primary text input')).toBeInTheDocument()
      expect(screen.queryByText('fallback_selection')).not.toBeInTheDocument()
    })
  })

  describe('missing data handling', () => {
    it('returns null when allScreenResponses is undefined', () => {
      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'nonexistent' }}
          allScreenResponses={undefined}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when referenced screen has no response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        other_screen: { text_input: 'Some value' },
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'missing_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when response exists but has no extractable data', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        empty_screen: { revealed_items: ['item1'] }, // revealed_items is not extracted
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'empty_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when text_inputs array is empty', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        empty_array: { text_inputs: [] },
      }

      const { container } = render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'empty_array' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('logs warning in development when data is missing', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const allScreenResponses: Record<string, ScreenResponse> = {
        other_screen: { text_input: 'value' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'missing_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "ContextDisplay: No data found for screen 'missing_screen'",
        expect.objectContaining({
          availableScreens: ['other_screen'],
        })
      )

      consoleWarnSpy.mockRestore()
      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('module color theming', () => {
    it('applies amber color classes', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Test' },
      }

      const { container } = render(
        <ContextDisplay
          moduleColor="amber"
          config={{ from_screen: 'goal_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      // Card style uses module color for text and background
      const textElement = container.querySelector('.text-amber-600')
      expect(textElement).toBeInTheDocument()
    })

    it('applies purple color classes', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Test' },
      }

      const { container } = render(
        <ContextDisplay
          moduleColor="purple"
          config={{ from_screen: 'goal_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      const textElement = container.querySelector('.text-purple-600')
      expect(textElement).toBeInTheDocument()
    })

    it('falls back to purple for invalid color', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Test' },
      }

      const { container } = render(
        <ContextDisplay
          moduleColor="invalid-color"
          config={{ from_screen: 'goal_screen' }}
          allScreenResponses={allScreenResponses}
        />
      )

      // Should fall back to purple
      const textElement = container.querySelector('.text-purple-600')
      expect(textElement).toBeInTheDocument()
    })
  })

  describe('screen ID convention', () => {
    it('works with activity_screen_purpose naming convention', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s3_goal_input: { text_input: 'My performance goal' },
        a5_s1_reflection: { selection: 'confident' },
      }

      render(
        <ContextDisplay
          {...defaultProps}
          config={{ from_screen: 'a4_s3_goal_input', label: 'Your goal:' }}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('My performance goal')).toBeInTheDocument()
    })
  })
})
