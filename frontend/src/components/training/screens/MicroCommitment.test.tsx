import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MicroCommitment from './MicroCommitment'
import { MicroCommitmentContent } from '../types'

describe('MicroCommitment', () => {
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

  const basicContent: MicroCommitmentContent = {
    prompt: 'Choose your commitment for this week:',
    options: [
      { id: 'option1', text: 'Practice deep breathing' },
      { id: 'option2', text: 'Take a mindful walk' },
      { id: 'option3', text: 'Journal for 5 minutes' },
    ],
  }

  describe('basic rendering', () => {
    it('renders the prompt text', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Choose your commitment for this week:')).toBeInTheDocument()
    })

    it('renders all commitment options', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Practice deep breathing')).toBeInTheDocument()
      expect(screen.getByText('Take a mindful walk')).toBeInTheDocument()
      expect(screen.getByText('Journal for 5 minutes')).toBeInTheDocument()
    })

    it('renders the commit button', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      expect(screen.getByRole('button', { name: /i commit to this/i })).toBeInTheDocument()
    })

    it('disables commit button when no option is selected', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).toBeDisabled()
    })
  })

  describe('option selection', () => {
    it('enables commit button when an option is selected', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      const option = screen.getByText('Practice deep breathing')
      fireEvent.click(option)

      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).not.toBeDisabled()
    })

    it('allows changing selection to a different option', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      // Select first option
      const firstOption = screen.getByText('Practice deep breathing')
      fireEvent.click(firstOption)

      // Select second option
      const secondOption = screen.getByText('Take a mindful walk')
      fireEvent.click(secondOption)

      // Both should be clickable, and commit button should still be enabled
      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).not.toBeDisabled()
    })
  })

  describe('confirmation flow', () => {
    it('shows confirmation view after clicking commit button', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      // Select an option
      const option = screen.getByText('Practice deep breathing')
      fireEvent.click(option)

      // Click commit button
      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      fireEvent.click(commitButton)

      // Should show confirmation view
      expect(screen.getByText('Your Commitment')).toBeInTheDocument()
      expect(screen.getByText('Practice deep breathing')).toBeInTheDocument()
    })

    it('shows continue button in confirmation view', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      // Select and commit
      fireEvent.click(screen.getByText('Practice deep breathing'))
      fireEvent.click(screen.getByRole('button', { name: /i commit to this/i }))

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('calls onSaveResponse and onContinue when clicking continue', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} />)

      // Select and commit
      fireEvent.click(screen.getByText('Practice deep breathing'))
      fireEvent.click(screen.getByRole('button', { name: /i commit to this/i }))

      // Click continue
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        commitment_id: 'option1',
        commitment_text: 'Practice deep breathing',
      })
      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('saved response handling - fixed auto-selection bug', () => {
    it('pre-selects saved commitment but does NOT auto-show confirmation', () => {
      const savedResponse = { commitment_id: 'option2' }

      render(
        <MicroCommitment
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Should still show selection view (not confirmation)
      expect(screen.getByText('Choose your commitment for this week:')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /i commit to this/i })).toBeInTheDocument()

      // Should NOT show confirmation view automatically
      expect(screen.queryByText('Your Commitment')).not.toBeInTheDocument()
    })

    it('pre-selects the saved option enabling the commit button', () => {
      const savedResponse = { commitment_id: 'option2' }

      render(
        <MicroCommitment
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Commit button should be enabled because option is pre-selected
      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).not.toBeDisabled()
    })

    it('allows user to change their selection even with saved response', () => {
      const savedResponse = { commitment_id: 'option2' }

      render(
        <MicroCommitment
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Change selection to a different option
      fireEvent.click(screen.getByText('Journal for 5 minutes'))

      // Commit with new selection
      fireEvent.click(screen.getByRole('button', { name: /i commit to this/i }))
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      // Should save the new selection
      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        commitment_id: 'option3',
        commitment_text: 'Journal for 5 minutes',
      })
    })
  })

  describe('custom input field', () => {
    const contentWithCustomInput: MicroCommitmentContent = {
      prompt: 'What will you commit to?',
      options: [
        { id: 'feedback', text: 'I will ask for feedback' },
        { id: 'practice', text: 'I will practice more' },
      ],
      allow_custom_input: true,
      follow_up_prompt: 'Be specific - what exactly will you do?',
    }

    it('shows custom input field after selecting an option when allow_custom_input is true', () => {
      render(<MicroCommitment {...defaultProps} content={contentWithCustomInput} />)

      // Select an option
      fireEvent.click(screen.getByText('I will ask for feedback'))

      // Custom input should appear
      expect(screen.getByText('Be specific - what exactly will you do?')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type your specific commitment...')).toBeInTheDocument()
    })

    it('does not show custom input before selecting an option', () => {
      render(<MicroCommitment {...defaultProps} content={contentWithCustomInput} />)

      // Custom input should not appear yet
      expect(screen.queryByText('Be specific - what exactly will you do?')).not.toBeInTheDocument()
    })

    it('uses default prompt when follow_up_prompt is not provided', () => {
      const contentWithDefaultPrompt: MicroCommitmentContent = {
        prompt: 'What will you commit to?',
        options: [{ id: 'option1', text: 'Option 1' }],
        allow_custom_input: true,
      }

      render(<MicroCommitment {...defaultProps} content={contentWithDefaultPrompt} />)

      fireEvent.click(screen.getByText('Option 1'))

      expect(screen.getByText("Let's get specific for you:")).toBeInTheDocument()
    })

    it('includes custom input in saved response', () => {
      render(<MicroCommitment {...defaultProps} content={contentWithCustomInput} />)

      // Select an option
      fireEvent.click(screen.getByText('I will ask for feedback'))

      // Enter custom input
      const input = screen.getByPlaceholderText('Type your specific commitment...')
      fireEvent.change(input, { target: { value: 'Ask coach after practice' } })

      // Commit and continue
      fireEvent.click(screen.getByRole('button', { name: /i commit to this/i }))
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        commitment_id: 'feedback',
        commitment_text: 'I will ask for feedback',
        custom_input: 'Ask coach after practice',
      })
    })

    it('shows custom input in confirmation view', () => {
      render(<MicroCommitment {...defaultProps} content={contentWithCustomInput} />)

      // Select and add custom input
      fireEvent.click(screen.getByText('I will ask for feedback'))
      const input = screen.getByPlaceholderText('Type your specific commitment...')
      fireEvent.change(input, { target: { value: 'Ask coach after practice' } })

      // Commit
      fireEvent.click(screen.getByRole('button', { name: /i commit to this/i }))

      // Custom input should be shown in confirmation
      expect(screen.getByText('"Ask coach after practice"')).toBeInTheDocument()
    })

    it('restores custom input from saved response', () => {
      const savedResponse = {
        commitment_id: 'feedback',
        custom_input: 'Saved custom text',
      }

      render(
        <MicroCommitment
          {...defaultProps}
          content={contentWithCustomInput}
          savedResponse={savedResponse as any}
        />
      )

      // The input should have the saved custom text
      const input = screen.getByPlaceholderText('Type your specific commitment...')
      expect(input).toHaveValue('Saved custom text')
    })

    it('does not include empty custom input in response', () => {
      render(<MicroCommitment {...defaultProps} content={contentWithCustomInput} />)

      // Select without adding custom input
      fireEvent.click(screen.getByText('I will ask for feedback'))

      // Commit and continue (custom input is empty)
      fireEvent.click(screen.getByRole('button', { name: /i commit to this/i }))
      fireEvent.click(screen.getByRole('button', { name: /continue/i }))

      // Should NOT include custom_input since it's empty
      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        commitment_id: 'feedback',
        commitment_text: 'I will ask for feedback',
      })
    })
  })

  describe('color theming', () => {
    it('applies emerald color theme', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} moduleColor="emerald" />)

      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).toHaveClass('bg-emerald-600')
    })

    it('applies blue color theme', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} moduleColor="blue" />)

      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).toHaveClass('bg-blue-600')
    })

    it('defaults to purple for unknown color', () => {
      render(<MicroCommitment {...defaultProps} content={basicContent} moduleColor="unknown" />)

      const commitButton = screen.getByRole('button', { name: /i commit to this/i })
      expect(commitButton).toHaveClass('bg-purple-600')
    })
  })
})
