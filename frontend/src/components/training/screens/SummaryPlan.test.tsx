import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SummaryPlan from './SummaryPlan'
import { SummaryPlanContent, ScreenResponse } from '../types'

describe('SummaryPlan', () => {
  const mockOnContinue = vi.fn()
  const mockOnSaveResponse = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    onContinue: mockOnContinue,
    onSaveResponse: mockOnSaveResponse,
    moduleColor: 'amber',
  }

  describe('basic rendering', () => {
    const basicContent: SummaryPlanContent = {
      title: 'Your Goal-Setting Plan',
      sections: [
        {
          label: 'Your Goal',
          display_from_screens: ['a4_s3_goal_input'],
          display_type: 'cards',
        },
      ],
    }

    it('renders the title', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s3_goal_input: { text_input: 'Run a marathon' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Your Goal-Setting Plan')).toBeInTheDocument()
    })

    it('renders section labels', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s3_goal_input: { text_input: 'Run a marathon' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Your Goal')).toBeInTheDocument()
    })

    it('renders subtext when provided', () => {
      const contentWithSubtext: SummaryPlanContent = {
        ...basicContent,
        subtext: 'Review your plan and make adjustments as needed.',
      }

      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s3_goal_input: { text_input: 'Test goal' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={contentWithSubtext}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(
        screen.getByText('Review your plan and make adjustments as needed.')
      ).toBeInTheDocument()
    })

    it('renders continue button', () => {
      render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={{}}
        />
      )

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('calls onContinue when continue button is clicked', () => {
      render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={{}}
        />
      )

      const button = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(button)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('list display type', () => {
    const listContent: SummaryPlanContent = {
      title: 'Summary',
      sections: [
        {
          label: 'Your Steps',
          display_from_screens: ['steps_screen'],
          display_type: 'list',
        },
      ],
    }

    it('renders items as bullet list', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        steps_screen: { text_inputs: ['Step 1', 'Step 2', 'Step 3'] },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={listContent}
          allScreenResponses={allScreenResponses}
        />
      )

      // Should render as unordered list
      const ul = container.querySelector('ul')
      expect(ul).toBeInTheDocument()

      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
      expect(screen.getByText('Step 3')).toBeInTheDocument()
    })

    it('renders bullet points with module color', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        steps_screen: { text_inputs: ['Step 1'] },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={listContent}
          allScreenResponses={allScreenResponses}
          moduleColor="amber"
        />
      )

      // Bullet should have module color
      const bullet = container.querySelector('.bg-amber-600')
      expect(bullet).toBeInTheDocument()
    })
  })

  describe('numbered display type', () => {
    const numberedContent: SummaryPlanContent = {
      title: 'Summary',
      sections: [
        {
          label: 'Action Steps',
          display_from_screens: ['action_steps'],
          display_type: 'numbered',
        },
      ],
    }

    it('renders items as numbered list', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        action_steps: { text_inputs: ['First action', 'Second action', 'Third action'] },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={numberedContent}
          allScreenResponses={allScreenResponses}
        />
      )

      // Should render as ordered list
      const ol = container.querySelector('ol')
      expect(ol).toBeInTheDocument()

      expect(screen.getByText('First action')).toBeInTheDocument()
      expect(screen.getByText('Second action')).toBeInTheDocument()
      expect(screen.getByText('Third action')).toBeInTheDocument()
    })

    it('renders number badges with module color', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        action_steps: { text_inputs: ['First', 'Second'] },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={numberedContent}
          allScreenResponses={allScreenResponses}
          moduleColor="purple"
        />
      )

      // Number badges should have module color
      const badges = container.querySelectorAll('.bg-purple-600')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('displays correct numbers in sequence', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        action_steps: { text_inputs: ['A', 'B', 'C'] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={numberedContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('cards display type', () => {
    const cardsContent: SummaryPlanContent = {
      title: 'Summary',
      sections: [
        {
          label: 'Your Goals',
          display_from_screens: ['goals_screen'],
          display_type: 'cards',
        },
      ],
    }

    it('renders items as cards', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goals_screen: { text_inputs: ['Goal 1', 'Goal 2'] },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={cardsContent}
          allScreenResponses={allScreenResponses}
        />
      )

      // Cards should have rounded corners and border
      const cards = container.querySelectorAll('.rounded-xl.border-2')
      expect(cards.length).toBeGreaterThanOrEqual(2)
    })

    it('applies module color to card text', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goals_screen: { text_inputs: ['Test goal'] },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={cardsContent}
          allScreenResponses={allScreenResponses}
          moduleColor="emerald"
        />
      )

      const coloredText = container.querySelector('.text-emerald-600')
      expect(coloredText).toBeInTheDocument()
    })
  })

  describe('aggregating data from multiple screens', () => {
    const multiScreenContent: SummaryPlanContent = {
      title: 'Complete Summary',
      sections: [
        {
          label: 'All Your Inputs',
          display_from_screens: ['screen_1', 'screen_2', 'screen_3'],
          display_type: 'list',
        },
      ],
    }

    it('aggregates text_inputs from multiple screens', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen_1: { text_inputs: ['From screen 1a', 'From screen 1b'] },
        screen_2: { text_inputs: ['From screen 2'] },
        screen_3: { text_inputs: ['From screen 3a', 'From screen 3b'] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={multiScreenContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('From screen 1a')).toBeInTheDocument()
      expect(screen.getByText('From screen 1b')).toBeInTheDocument()
      expect(screen.getByText('From screen 2')).toBeInTheDocument()
      expect(screen.getByText('From screen 3a')).toBeInTheDocument()
      expect(screen.getByText('From screen 3b')).toBeInTheDocument()
    })

    it('aggregates different response types from multiple screens', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen_1: { text_input: 'Single text input' },
        screen_2: { selection: 'selected_option' },
        screen_3: { selections: ['option_a', 'option_b'] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={multiScreenContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Single text input')).toBeInTheDocument()
      expect(screen.getByText('selected_option')).toBeInTheDocument()
      expect(screen.getByText('option_a')).toBeInTheDocument()
      expect(screen.getByText('option_b')).toBeInTheDocument()
    })

    it('handles missing screens gracefully', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen_1: { text_input: 'First input' },
        // screen_2 and screen_3 are missing
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={multiScreenContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('First input')).toBeInTheDocument()
    })
  })

  describe('extracting different response types', () => {
    const extractionContent: SummaryPlanContent = {
      title: 'Summary',
      sections: [
        {
          label: 'Responses',
          display_from_screens: ['response_screen'],
          display_type: 'list',
        },
      ],
    }

    it('extracts text_input from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        response_screen: { text_input: 'My text input' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={extractionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('My text input')).toBeInTheDocument()
    })

    it('extracts text_inputs (array) from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        response_screen: { text_inputs: ['Input 1', 'Input 2'] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={extractionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Input 1')).toBeInTheDocument()
      expect(screen.getByText('Input 2')).toBeInTheDocument()
    })

    it('extracts selection from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        response_screen: { selection: 'my_selection' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={extractionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('my_selection')).toBeInTheDocument()
    })

    it('extracts selections (array) from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        response_screen: { selections: ['choice_a', 'choice_b', 'choice_c'] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={extractionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('choice_a')).toBeInTheDocument()
      expect(screen.getByText('choice_b')).toBeInTheDocument()
      expect(screen.getByText('choice_c')).toBeInTheDocument()
    })

    it('extracts and formats commitment_id from response', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        response_screen: { commitment_id: 'mc_practice_every_day' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={extractionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      // mc_practice_every_day -> practice every day
      expect(screen.getByText('practice every day')).toBeInTheDocument()
    })

    it('extracts multiple response types from same screen', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        response_screen: {
          text_input: 'Primary input',
          selection: 'Also selected',
        },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={extractionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      // Both should be extracted
      expect(screen.getByText('Primary input')).toBeInTheDocument()
      expect(screen.getByText('Also selected')).toBeInTheDocument()
    })
  })

  describe('handling missing data', () => {
    const missingDataContent: SummaryPlanContent = {
      title: 'Summary',
      sections: [
        {
          label: 'Your Data',
          display_from_screens: ['missing_screen'],
          display_type: 'list',
        },
      ],
    }

    it('shows fallback message when no data is found', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {}

      render(
        <SummaryPlan
          {...defaultProps}
          content={missingDataContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('No response recorded')).toBeInTheDocument()
    })

    it('shows fallback when allScreenResponses is undefined', () => {
      render(
        <SummaryPlan
          {...defaultProps}
          content={missingDataContent}
          allScreenResponses={undefined}
        />
      )

      expect(screen.getByText('No response recorded')).toBeInTheDocument()
    })

    it('shows fallback when screen has empty text_inputs', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        missing_screen: { text_inputs: [] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={missingDataContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('No response recorded')).toBeInTheDocument()
    })

    it('shows fallback when screen has only non-extractable data', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        missing_screen: { revealed_items: ['item1', 'item2'] },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={missingDataContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('No response recorded')).toBeInTheDocument()
    })

    it('logs warning in development when data is missing', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const allScreenResponses: Record<string, ScreenResponse> = {
        other_screen: { text_input: 'exists' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={missingDataContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "SummaryPlan: No data found for screen 'missing_screen'",
        expect.objectContaining({
          availableScreens: ['other_screen'],
        })
      )

      consoleWarnSpy.mockRestore()
      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('multiple sections', () => {
    const multiSectionContent: SummaryPlanContent = {
      title: 'Complete Plan',
      sections: [
        {
          label: 'Your Goal',
          display_from_screens: ['goal_screen'],
          display_type: 'cards',
        },
        {
          label: 'Action Steps',
          display_from_screens: ['steps_screen'],
          display_type: 'numbered',
        },
        {
          label: 'Commitment',
          display_from_screens: ['commitment_screen'],
          display_type: 'list',
        },
      ],
    }

    it('renders all sections with correct display types', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        goal_screen: { text_input: 'Win the championship' },
        steps_screen: { text_inputs: ['Train daily', 'Eat healthy'] },
        commitment_screen: { commitment_id: 'mc_stay_focused' },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={multiSectionContent}
          allScreenResponses={allScreenResponses}
        />
      )

      // Check section labels
      expect(screen.getByText('Your Goal')).toBeInTheDocument()
      expect(screen.getByText('Action Steps')).toBeInTheDocument()
      expect(screen.getByText('Commitment')).toBeInTheDocument()

      // Check content from each section
      expect(screen.getByText('Win the championship')).toBeInTheDocument()
      expect(screen.getByText('Train daily')).toBeInTheDocument()
      expect(screen.getByText('Eat healthy')).toBeInTheDocument()
      expect(screen.getByText('stay focused')).toBeInTheDocument()

      // Check that numbered list has numbers
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('screen ID convention (cross-activity)', () => {
    const crossActivityContent: SummaryPlanContent = {
      title: 'Module Summary',
      sections: [
        {
          label: 'Activity 4 Goal',
          display_from_screens: ['a4_s3_goal_input'],
          display_type: 'cards',
        },
        {
          label: 'Activity 5 Steps',
          display_from_screens: ['a5_s2_step_1', 'a5_s3_step_2', 'a5_s4_step_3'],
          display_type: 'numbered',
        },
      ],
    }

    it('displays data from different activities using screen ID convention', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s1_intro: { revealed_items: ['intro'] },
        a4_s3_goal_input: { text_input: 'My big goal from activity 4' },
        a5_s1_intro: { selection: 'ready' },
        a5_s2_step_1: { text_input: 'First step from activity 5' },
        a5_s3_step_2: { text_input: 'Second step from activity 5' },
        a5_s4_step_3: { text_input: 'Third step from activity 5' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={crossActivityContent}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('My big goal from activity 4')).toBeInTheDocument()
      expect(screen.getByText('First step from activity 5')).toBeInTheDocument()
      expect(screen.getByText('Second step from activity 5')).toBeInTheDocument()
      expect(screen.getByText('Third step from activity 5')).toBeInTheDocument()
    })
  })

  describe('module color theming', () => {
    const basicContent: SummaryPlanContent = {
      title: 'Summary',
      sections: [
        {
          label: 'Data',
          display_from_screens: ['screen'],
          display_type: 'list',
        },
      ],
    }

    it('applies module color to title', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen: { text_input: 'test' },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={allScreenResponses}
          moduleColor="emerald"
        />
      )

      const title = container.querySelector('.text-emerald-600')
      expect(title).toBeInTheDocument()
      expect(title?.textContent).toBe('Summary')
    })

    it('applies module color to continue button', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen: { text_input: 'test' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={allScreenResponses}
          moduleColor="blue"
        />
      )

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toHaveClass('bg-blue-600')
    })

    it('falls back to purple for invalid color', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen: { text_input: 'test' },
      }

      render(
        <SummaryPlan
          {...defaultProps}
          content={basicContent}
          allScreenResponses={allScreenResponses}
          moduleColor="invalid-color"
        />
      )

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toHaveClass('bg-purple-600')
    })
  })

  describe('accessibility', () => {
    const accessibilityContent: SummaryPlanContent = {
      title: 'Accessible Summary',
      sections: [
        {
          label: 'Your Items',
          display_from_screens: ['screen'],
          display_type: 'list',
        },
      ],
    }

    it('continue button is keyboard accessible', () => {
      render(
        <SummaryPlan
          {...defaultProps}
          content={accessibilityContent}
          allScreenResponses={{}}
        />
      )

      const button = screen.getByRole('button', { name: /continue/i })
      button.focus()
      expect(button).toHaveFocus()
    })

    it('section headings are semantic h3 elements', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        screen: { text_input: 'test' },
      }

      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={accessibilityContent}
          allScreenResponses={allScreenResponses}
        />
      )

      const heading = container.querySelector('h3')
      expect(heading).toBeInTheDocument()
      expect(heading?.textContent).toBe('Your Items')
    })

    it('main title is semantic h2 element', () => {
      const { container } = render(
        <SummaryPlan
          {...defaultProps}
          content={accessibilityContent}
          allScreenResponses={{}}
        />
      )

      const heading = container.querySelector('h2')
      expect(heading).toBeInTheDocument()
      expect(heading?.textContent).toBe('Accessible Summary')
    })
  })
})
