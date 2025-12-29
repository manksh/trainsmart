import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConditionalContent from './ConditionalContent'
import { ConditionalContentContent, ScreenResponse } from '../types'

describe('ConditionalContent', () => {
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

  // Content with multiple branches for different selections
  const branchingContent: ConditionalContentContent = {
    condition_screen: 'breathing_choice',
    conditions: {
      sigh: {
        type: 'static_card',
        content: {
          title: 'Physiological Sigh',
          body: 'The physiological sigh is a quick way to calm your nervous system.',
          subtext: 'Two inhales, one long exhale.',
        },
      },
      exhale: {
        type: 'static_card',
        content: {
          title: 'Extended Exhale',
          body: 'Extended exhale breathing activates your relaxation response.',
          subtext: 'Breathe in for 4, out for 6.',
        },
      },
    },
  }

  // Mock screen responses for testing conditions
  const mockResponsesSigh: Record<string, ScreenResponse> = {
    breathing_choice: { selection: 'sigh' },
  }

  const mockResponsesExhale: Record<string, ScreenResponse> = {
    breathing_choice: { selection: 'exhale' },
  }

  describe('branch selection based on response', () => {
    it('renders the correct branch when selection is "sigh"', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={mockResponsesSigh}
        />
      )

      expect(screen.getByText('Physiological Sigh')).toBeInTheDocument()
      expect(
        screen.getByText('The physiological sigh is a quick way to calm your nervous system.')
      ).toBeInTheDocument()
      expect(screen.getByText('Two inhales, one long exhale.')).toBeInTheDocument()
    })

    it('renders the correct branch when selection is "exhale"', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={mockResponsesExhale}
        />
      )

      expect(screen.getByText('Extended Exhale')).toBeInTheDocument()
      expect(
        screen.getByText('Extended exhale breathing activates your relaxation response.')
      ).toBeInTheDocument()
      expect(screen.getByText('Breathe in for 4, out for 6.')).toBeInTheDocument()
    })

    it('does not render other branches', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={mockResponsesSigh}
        />
      )

      // "sigh" is selected, so "exhale" content should not be visible
      expect(screen.queryByText('Extended Exhale')).not.toBeInTheDocument()
    })
  })

  describe('default branch fallback', () => {
    it('uses default_branch when no condition matches', () => {
      const contentWithDefault: ConditionalContentContent = {
        condition_screen: 'choice',
        conditions: {
          option_a: {
            type: 'static_card',
            content: { body: 'Option A selected' },
          },
        },
        default_branch: {
          type: 'static_card',
          content: {
            title: 'Default Content',
            body: 'This is the default fallback content.',
          },
        },
      }

      const responses: Record<string, ScreenResponse> = {
        choice: { selection: 'option_b' }, // Not in conditions
      }

      render(
        <ConditionalContent
          {...defaultProps}
          content={contentWithDefault}
          allScreenResponses={responses}
        />
      )

      expect(screen.getByText('Default Content')).toBeInTheDocument()
      expect(screen.getByText('This is the default fallback content.')).toBeInTheDocument()
    })
  })

  describe('no matching branch behavior', () => {
    it('shows fallback UI when no condition matches and no default branch', () => {
      const responses: Record<string, ScreenResponse> = {
        breathing_choice: { selection: 'unknown_option' },
      }

      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={responses}
        />
      )

      // Should show fallback message
      expect(screen.getByText('Continue to the next screen.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('shows fallback UI when no response exists for condition_screen', () => {
      const emptyResponses: Record<string, ScreenResponse> = {}

      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={emptyResponses}
        />
      )

      expect(screen.getByText('Continue to the next screen.')).toBeInTheDocument()
    })

    it('clicking continue in fallback UI calls onContinue', () => {
      const emptyResponses: Record<string, ScreenResponse> = {}

      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={emptyResponses}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('guided_breathing branch', () => {
    const breathingBranchContent: ConditionalContentContent = {
      condition_screen: 'technique_choice',
      conditions: {
        breathing: {
          type: 'guided_breathing',
          content: {
            title: 'Breathing Exercise',
            instruction: 'Follow along with this breathing pattern.',
            timing: {
              inhale_seconds: 4,
              hold_seconds: 0,
              exhale_seconds: 6,
            },
            cycles: 3,
            skippable: true,
            audio_enabled: true,
          },
        },
      },
    }

    it('renders GuidedBreathing component for guided_breathing branch', () => {
      const responses: Record<string, ScreenResponse> = {
        technique_choice: { selection: 'breathing' },
      }

      render(
        <ConditionalContent
          {...defaultProps}
          content={breathingBranchContent}
          allScreenResponses={responses}
        />
      )

      // GuidedBreathing component shows intro screen with Begin button
      expect(screen.getByText('Breathing Exercise')).toBeInTheDocument()
      expect(screen.getByText('Follow along with this breathing pattern.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /begin breathing/i })).toBeInTheDocument()
    })
  })

  describe('continue button behavior for matched branches', () => {
    it('renders continue button for static_card branches', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={mockResponsesSigh}
        />
      )

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('calls onContinue when continue button is clicked', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={mockResponsesSigh}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('handles undefined selection in response', () => {
      const undefinedSelectionResponse: Record<string, ScreenResponse> = {
        breathing_choice: { selection: undefined } as ScreenResponse,
      }

      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={undefinedSelectionResponse}
        />
      )

      // Empty string selection won't match, should show fallback
      expect(screen.getByText('Continue to the next screen.')).toBeInTheDocument()
    })

    it('handles undefined allScreenResponses prop', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={undefined}
        />
      )

      // No responses, should show fallback
      expect(screen.getByText('Continue to the next screen.')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('continue button is keyboard accessible', () => {
      render(
        <ConditionalContent
          {...defaultProps}
          content={branchingContent}
          allScreenResponses={mockResponsesSigh}
        />
      )

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toBeEnabled()
      button.focus()
      expect(button).toHaveFocus()
    })
  })
})
