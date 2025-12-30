import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TextInput from './TextInput'
import { TextInputContent, ScreenResponse } from '../types'

describe('TextInput', () => {
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

  describe('single input mode (existing behavior)', () => {
    const singleInputContent: TextInputContent = {
      prompt: 'What is your primary goal?',
      placeholder: 'Type your goal here...',
      max_length: 200,
    }

    it('renders the prompt', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      expect(screen.getByText('What is your primary goal?')).toBeInTheDocument()
    })

    it('renders placeholder in textarea', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const textarea = screen.getByPlaceholderText('Type your goal here...')
      expect(textarea).toBeInTheDocument()
    })

    it('renders subtext when provided', () => {
      const contentWithSubtext: TextInputContent = {
        ...singleInputContent,
        subtext: 'Be as specific as possible',
      }

      render(<TextInput {...defaultProps} content={contentWithSubtext} />)
      expect(screen.getByText('Be as specific as possible')).toBeInTheDocument()
    })

    it('disables continue button when input is empty', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toBeDisabled()
    })

    it('enables continue button when input has content', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const textarea = screen.getByPlaceholderText('Type your goal here...')
      fireEvent.change(textarea, { target: { value: 'My goal is to improve' } })

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).not.toBeDisabled()
    })

    it('disables continue button for whitespace-only input', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const textarea = screen.getByPlaceholderText('Type your goal here...')
      fireEvent.change(textarea, { target: { value: '   ' } })

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toBeDisabled()
    })

    it('calls onSaveResponse and onContinue with text_input when continue clicked', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const textarea = screen.getByPlaceholderText('Type your goal here...')
      fireEvent.change(textarea, { target: { value: 'Run a marathon' } })

      const button = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(button)

      expect(mockOnSaveResponse).toHaveBeenCalledWith({ text_input: 'Run a marathon' })
      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })

    it('trims whitespace from input before saving', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const textarea = screen.getByPlaceholderText('Type your goal here...')
      fireEvent.change(textarea, { target: { value: '  My goal  ' } })

      const button = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(button)

      expect(mockOnSaveResponse).toHaveBeenCalledWith({ text_input: 'My goal' })
    })

    it('displays character count when max_length is set', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      expect(screen.getByText('0 / 200')).toBeInTheDocument()
    })

    it('updates character count as user types', () => {
      render(<TextInput {...defaultProps} content={singleInputContent} />)
      const textarea = screen.getByPlaceholderText('Type your goal here...')
      fireEvent.change(textarea, { target: { value: 'Hello' } })

      expect(screen.getByText('5 / 200')).toBeInTheDocument()
    })

    it('restores input from savedResponse', () => {
      const savedResponse: ScreenResponse = { text_input: 'Previously entered goal' }

      render(
        <TextInput
          {...defaultProps}
          content={singleInputContent}
          savedResponse={savedResponse}
        />
      )

      const textarea = screen.getByPlaceholderText('Type your goal here...')
      expect(textarea).toHaveValue('Previously entered goal')
    })
  })

  describe('single input with prefix', () => {
    const prefixContent: TextInputContent = {
      prompt: 'Complete the sentence:',
      prefix: 'I will ',
      placeholder: 'achieve my goal by...',
      max_length: 150,
    }

    it('renders the prefix text', () => {
      render(<TextInput {...defaultProps} content={prefixContent} />)
      expect(screen.getByText('I will')).toBeInTheDocument()
    })

    it('includes prefix in saved response', () => {
      render(<TextInput {...defaultProps} content={prefixContent} />)
      const textarea = screen.getByPlaceholderText('achieve my goal by...')
      fireEvent.change(textarea, { target: { value: 'practice every day' } })

      const button = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(button)

      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        text_input: 'I will practice every day',
      })
    })
  })

  describe('multiple inputs mode', () => {
    const multipleInputContent: TextInputContent = {
      prompt: 'List your action steps',
      subtext: 'Add 2-4 specific steps',
      placeholder: 'Enter a step...',
      max_length: 200,
      multiple: {
        min_entries: 2,
        max_entries: 4,
      },
    }

    it('renders initial inputs equal to min_entries', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      // When placeholder is provided in content, it uses that placeholder
      const textareas = screen.getAllByPlaceholderText('Enter a step...')
      expect(textareas).toHaveLength(2)
    })

    it('uses default Entry placeholder when no placeholder provided', () => {
      const contentWithoutPlaceholder: TextInputContent = {
        prompt: 'List items',
        multiple: {
          min_entries: 2,
          max_entries: 3,
        },
      }

      render(<TextInput {...defaultProps} content={contentWithoutPlaceholder} />)

      // Without placeholder, falls back to "Entry {n}..."
      expect(screen.getByPlaceholderText('Entry 1...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Entry 2...')).toBeInTheDocument()
    })

    it('renders Add another entry button', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)
      expect(screen.getByText('Add another entry')).toBeInTheDocument()
    })

    it('adds new entry when Add button is clicked', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      const addButton = screen.getByText('Add another entry')
      fireEvent.click(addButton)

      const textareas = screen.getAllByRole('textbox')
      expect(textareas).toHaveLength(3)
    })

    it('hides Add button when max_entries is reached', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      // Add entries until max (4)
      const addButton = screen.getByText('Add another entry')
      fireEvent.click(addButton) // 3
      fireEvent.click(addButton) // 4

      // Button should no longer be visible
      expect(screen.queryByText('Add another entry')).not.toBeInTheDocument()
    })

    it('shows remove button when entries exceed min_entries', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      // Initial state should not show remove buttons (at min_entries)
      expect(screen.queryByLabelText(/Remove entry/)).not.toBeInTheDocument()

      // Add an entry
      const addButton = screen.getByText('Add another entry')
      fireEvent.click(addButton)

      // Now remove buttons should appear
      const removeButtons = screen.getAllByLabelText(/Remove entry/)
      expect(removeButtons.length).toBeGreaterThan(0)
    })

    it('removes entry when remove button is clicked', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      // Add an entry
      const addButton = screen.getByText('Add another entry')
      fireEvent.click(addButton)

      // Should have 3 entries
      let textareas = screen.getAllByRole('textbox')
      expect(textareas).toHaveLength(3)

      // Click remove on first entry
      const removeButton = screen.getByLabelText('Remove entry 1')
      fireEvent.click(removeButton)

      // Should have 2 entries
      textareas = screen.getAllByRole('textbox')
      expect(textareas).toHaveLength(2)
    })

    it('disables continue button when fewer than min_entries are filled', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      // Fill only one entry
      const textareas = screen.getAllByRole('textbox')
      fireEvent.change(textareas[0], { target: { value: 'First step' } })

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toBeDisabled()
    })

    it('enables continue button when min_entries are filled', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      const textareas = screen.getAllByRole('textbox')
      fireEvent.change(textareas[0], { target: { value: 'First step' } })
      fireEvent.change(textareas[1], { target: { value: 'Second step' } })

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).not.toBeDisabled()
    })

    it('saves only non-empty entries', () => {
      render(<TextInput {...defaultProps} content={multipleInputContent} />)

      // Add a third entry
      const addButton = screen.getByText('Add another entry')
      fireEvent.click(addButton)

      // Fill first two, leave third empty
      const textareas = screen.getAllByRole('textbox')
      fireEvent.change(textareas[0], { target: { value: 'Step one' } })
      fireEvent.change(textareas[1], { target: { value: 'Step two' } })
      // Leave textareas[2] empty

      const button = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(button)

      expect(mockOnSaveResponse).toHaveBeenCalledWith({
        text_inputs: ['Step one', 'Step two'],
      })
    })

    it('restores multiple inputs from savedResponse', () => {
      const savedResponse: ScreenResponse = {
        text_inputs: ['Saved step 1', 'Saved step 2', 'Saved step 3'],
      }

      render(
        <TextInput
          {...defaultProps}
          content={multipleInputContent}
          savedResponse={savedResponse}
        />
      )

      const textareas = screen.getAllByRole('textbox')
      expect(textareas).toHaveLength(3)
      expect(textareas[0]).toHaveValue('Saved step 1')
      expect(textareas[1]).toHaveValue('Saved step 2')
      expect(textareas[2]).toHaveValue('Saved step 3')
    })
  })

  describe('multiple inputs with entry labels', () => {
    const labeledMultipleContent: TextInputContent = {
      prompt: 'Define your SMART goal',
      multiple: {
        min_entries: 3,
        max_entries: 3,
        entry_labels: ['Specific', 'Measurable', 'Achievable'],
      },
    }

    it('renders custom entry labels', () => {
      render(<TextInput {...defaultProps} content={labeledMultipleContent} />)

      expect(screen.getByText('Specific')).toBeInTheDocument()
      expect(screen.getByText('Measurable')).toBeInTheDocument()
      expect(screen.getByText('Achievable')).toBeInTheDocument()
    })
  })

  describe('context_display integration', () => {
    const contentWithContext: TextInputContent = {
      prompt: 'Break down your goal into steps',
      context_display: {
        from_screen: 'a4_s3_goal_input',
        label: 'Your goal:',
        style: 'card',
      },
      multiple: {
        min_entries: 2,
        max_entries: 4,
      },
    }

    it('renders ContextDisplay when context_display is provided', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s3_goal_input: { text_input: 'Run a 5K marathon' },
      }

      render(
        <TextInput
          {...defaultProps}
          content={contentWithContext}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Your goal:')).toBeInTheDocument()
      expect(screen.getByText('Run a 5K marathon')).toBeInTheDocument()
    })

    it('does not render context display when response is missing', () => {
      const emptyResponses: Record<string, ScreenResponse> = {}

      render(
        <TextInput
          {...defaultProps}
          content={contentWithContext}
          allScreenResponses={emptyResponses}
        />
      )

      // The prompt should still render, but no context
      expect(screen.getByText('Break down your goal into steps')).toBeInTheDocument()
      expect(screen.queryByText('Your goal:')).not.toBeInTheDocument()
    })

    it('shows Activity 4 goal in Activity 5 context (cross-activity data)', () => {
      const allScreenResponses: Record<string, ScreenResponse> = {
        a4_s1_intro: { revealed_items: ['item1'] },
        a4_s3_goal_input: { text_input: 'Improve my serve accuracy' },
        a5_s1_intro: { selection: 'ready' },
      }

      render(
        <TextInput
          {...defaultProps}
          content={contentWithContext}
          allScreenResponses={allScreenResponses}
        />
      )

      expect(screen.getByText('Improve my serve accuracy')).toBeInTheDocument()
    })
  })

  describe('module color theming', () => {
    const basicContent: TextInputContent = {
      prompt: 'Test prompt',
    }

    it('applies amber color to continue button', () => {
      render(<TextInput {...defaultProps} content={basicContent} moduleColor="amber" />)

      // Type something to enable button
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'test' } })

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toHaveClass('bg-amber-600')
    })

    it('applies purple color to continue button', () => {
      render(<TextInput {...defaultProps} content={basicContent} moduleColor="purple" />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'test' } })

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toHaveClass('bg-purple-600')
    })
  })

  describe('edge cases', () => {
    it('handles undefined savedResponse', () => {
      const content: TextInputContent = {
        prompt: 'Test',
      }

      render(
        <TextInput {...defaultProps} content={content} savedResponse={undefined} />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('')
    })

    it('handles content without optional fields', () => {
      const minimalContent: TextInputContent = {
        prompt: 'Minimal prompt',
      }

      render(<TextInput {...defaultProps} content={minimalContent} />)

      expect(screen.getByText('Minimal prompt')).toBeInTheDocument()
      // Should use default placeholder
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
    })

    it('does not call onContinue if continue button is disabled', () => {
      const content: TextInputContent = {
        prompt: 'Test',
      }

      render(<TextInput {...defaultProps} content={content} />)

      const button = screen.getByRole('button', { name: /continue/i })
      expect(button).toBeDisabled()

      // Try to click disabled button
      fireEvent.click(button)

      expect(mockOnContinue).not.toHaveBeenCalled()
      expect(mockOnSaveResponse).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('textarea is keyboard accessible', () => {
      const content: TextInputContent = {
        prompt: 'Test',
        placeholder: 'Enter text',
      }

      render(<TextInput {...defaultProps} content={content} />)

      const textarea = screen.getByPlaceholderText('Enter text')
      textarea.focus()
      expect(textarea).toHaveFocus()
    })

    it('remove buttons have accessible labels', () => {
      const content: TextInputContent = {
        prompt: 'Test',
        multiple: {
          min_entries: 2,
          max_entries: 4,
        },
      }

      render(<TextInput {...defaultProps} content={content} />)

      // Add an entry to show remove buttons
      const addButton = screen.getByText('Add another entry')
      fireEvent.click(addButton)

      // Check for accessible labels
      expect(screen.getByLabelText('Remove entry 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Remove entry 2')).toBeInTheDocument()
    })

    it('continue button is keyboard accessible when enabled', () => {
      const content: TextInputContent = {
        prompt: 'Test',
      }

      render(<TextInput {...defaultProps} content={content} />)

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'test' } })

      const button = screen.getByRole('button', { name: /continue/i })
      button.focus()
      expect(button).toHaveFocus()
    })
  })
})
