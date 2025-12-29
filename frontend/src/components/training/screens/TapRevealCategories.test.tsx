import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TapRevealCategories from './TapRevealCategories'
import { TapRevealCategoriesContent } from '../types'

describe('TapRevealCategories', () => {
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

  const basicContent: TapRevealCategoriesContent = {
    header: 'Common Stress Responses',
    reveal_mode: 'sequential',
    categories: [
      {
        id: 'physical',
        title: 'Physical Signs',
        items: [
          { id: 'phys1', text: 'Rapid heartbeat' },
          { id: 'phys2', text: 'Muscle tension' },
          { id: 'phys3', text: 'Shallow breathing' },
        ],
      },
      {
        id: 'mental',
        title: 'Mental Signs',
        items: [
          { id: 'ment1', text: 'Racing thoughts' },
          { id: 'ment2', text: 'Difficulty concentrating' },
        ],
      },
    ],
  }

  const anyOrderContent: TapRevealCategoriesContent = {
    header: 'Common Stress Responses',
    reveal_mode: 'any_order',
    categories: [
      {
        id: 'physical',
        title: 'Physical Signs',
        items: [
          { id: 'phys1', text: 'Rapid heartbeat' },
          { id: 'phys2', text: 'Muscle tension' },
        ],
      },
    ],
  }

  describe('basic rendering', () => {
    it('renders the header text when provided', () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Common Stress Responses')).toBeInTheDocument()
    })

    it('renders all category titles', () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      expect(screen.getByText('Physical Signs')).toBeInTheDocument()
      expect(screen.getByText('Mental Signs')).toBeInTheDocument()
    })

    it('category titles are always visible', () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      const physicalHeader = screen.getByText('Physical Signs')
      const mentalHeader = screen.getByText('Mental Signs')

      expect(physicalHeader).toBeVisible()
      expect(mentalHeader).toBeVisible()
    })

    it('renders tap-to-reveal button for first item in sequential mode', () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      // In sequential mode, only first item should have reveal button
      const revealButtons = screen.getAllByRole('button', { name: /tap to reveal/i })
      expect(revealButtons.length).toBe(1)
    })

    it('renders tap-to-reveal buttons for all items in any_order mode', () => {
      render(<TapRevealCategories {...defaultProps} content={anyOrderContent} />)

      // In any_order mode, all items should have reveal buttons
      const revealButtons = screen.getAllByRole('button', { name: /tap to reveal/i })
      expect(revealButtons.length).toBe(2)
    })

    it('does not render header when not provided', () => {
      const contentWithoutHeader: TapRevealCategoriesContent = {
        reveal_mode: 'sequential',
        categories: basicContent.categories,
      }

      render(<TapRevealCategories {...defaultProps} content={contentWithoutHeader} />)

      expect(screen.queryByText('Common Stress Responses')).not.toBeInTheDocument()
      expect(screen.getByText('Physical Signs')).toBeInTheDocument()
    })
  })

  describe('sequential reveal mode', () => {
    it('reveals items in order - first item first', async () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      // Click the reveal button (only one should be active in sequential mode)
      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      // The first item text should now be visible
      await waitFor(() => {
        expect(screen.getByText('Rapid heartbeat')).toBeInTheDocument()
      })
    })

    it('reveals next item after first is revealed', async () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      // Reveal first item
      let revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(screen.getByText('Rapid heartbeat')).toBeInTheDocument()
      })

      // Now second reveal button should be available
      revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(screen.getByText('Muscle tension')).toBeInTheDocument()
      })
    })

    it('saves revealed_items to response after each reveal', async () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenCalledWith({
          revealed_items: ['phys1'],
        })
      })
    })

    it('progressively saves all revealed items', async () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      // Reveal first item
      let revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenLastCalledWith({
          revealed_items: ['phys1'],
        })
      })

      // Reveal second item
      revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenLastCalledWith({
          revealed_items: ['phys1', 'phys2'],
        })
      })
    })
  })

  describe('any_order reveal mode', () => {
    it('allows revealing any item first', async () => {
      render(<TapRevealCategories {...defaultProps} content={anyOrderContent} />)

      // Both buttons should be available
      const revealButtons = screen.getAllByRole('button', { name: /tap to reveal/i })
      expect(revealButtons.length).toBe(2)

      // Click second button (items can be revealed in any order)
      fireEvent.click(revealButtons[1])

      await waitFor(() => {
        expect(screen.getByText('Muscle tension')).toBeInTheDocument()
      })
    })
  })

  describe('continue button behavior', () => {
    it('disables continue button when not all items are revealed', () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
    })

    it('enables continue button when all items are revealed', async () => {
      const smallContent: TapRevealCategoriesContent = {
        reveal_mode: 'sequential',
        categories: [
          {
            id: 'test',
            title: 'Test Category',
            items: [{ id: 'item1', text: 'Single item' }],
          },
        ],
      }

      render(<TapRevealCategories {...defaultProps} content={smallContent} />)

      // Reveal the only item
      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i })
        expect(continueButton).not.toBeDisabled()
      })
    })

    it('calls onContinue when continue button is clicked after all items revealed', async () => {
      const smallContent: TapRevealCategoriesContent = {
        reveal_mode: 'sequential',
        categories: [
          {
            id: 'test',
            title: 'Test Category',
            items: [{ id: 'item1', text: 'Single item' }],
          },
        ],
      }

      render(<TapRevealCategories {...defaultProps} content={smallContent} />)

      // Reveal all items
      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i })
        expect(continueButton).not.toBeDisabled()
      })

      const continueButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(continueButton)

      expect(mockOnContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('saved response restoration', () => {
    it('restores state from savedResponse on mount', () => {
      const savedResponse = {
        revealed_items: ['phys1', 'phys2'],
      }

      render(
        <TapRevealCategories
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Pre-revealed items should be visible
      expect(screen.getByText('Rapid heartbeat')).toBeInTheDocument()
      expect(screen.getByText('Muscle tension')).toBeInTheDocument()

      // Non-revealed items should not be visible as text
      expect(screen.queryByText('Shallow breathing')).not.toBeInTheDocument()
    })

    it('allows continuing to reveal from saved state', async () => {
      const savedResponse = {
        revealed_items: ['phys1', 'phys2'],
      }

      render(
        <TapRevealCategories
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Should still have reveal button for next item
      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(mockOnSaveResponse).toHaveBeenCalledWith({
          revealed_items: ['phys1', 'phys2', 'phys3'],
        })
      })
    })

    it('enables continue if all items were previously revealed', () => {
      const allItemIds = basicContent.categories.flatMap((cat) => cat.items.map((item) => item.id))
      const savedResponse = {
        revealed_items: allItemIds,
      }

      render(
        <TapRevealCategories
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })
  })

  describe('subtext after reveal', () => {
    it('shows subtext_after_reveal when all items are revealed', async () => {
      const contentWithSubtext: TapRevealCategoriesContent = {
        reveal_mode: 'sequential',
        categories: [
          {
            id: 'test',
            title: 'Test',
            items: [{ id: 'item1', text: 'Only item' }],
          },
        ],
        subtext_after_reveal: 'Great job exploring all the signs!',
      }

      render(<TapRevealCategories {...defaultProps} content={contentWithSubtext} />)

      // Subtext should not be visible initially
      expect(screen.queryByText('Great job exploring all the signs!')).not.toBeInTheDocument()

      // Reveal the item
      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      fireEvent.click(revealButton)

      await waitFor(() => {
        expect(screen.getByText('Great job exploring all the signs!')).toBeInTheDocument()
      })
    })

    it('does not show subtext when not all items are revealed', () => {
      const contentWithSubtext: TapRevealCategoriesContent = {
        ...basicContent,
        subtext_after_reveal: 'All revealed!',
      }

      render(<TapRevealCategories {...defaultProps} content={contentWithSubtext} />)

      expect(screen.queryByText('All revealed!')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('reveal buttons are keyboard accessible', async () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} />)

      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })

      // Focus the button
      revealButton.focus()
      expect(revealButton).toHaveFocus()

      // Trigger with keyboard (Enter key)
      fireEvent.keyDown(revealButton, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Rapid heartbeat')).toBeInTheDocument()
      })
    })

    it('revealed items have listitem role', async () => {
      const savedResponse = {
        revealed_items: ['phys1'],
      }

      render(
        <TapRevealCategories
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      const revealedItem = screen.getByRole('listitem', { name: 'Rapid heartbeat' })
      expect(revealedItem).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty categories gracefully', () => {
      const emptyContent: TapRevealCategoriesContent = {
        header: 'Empty Test',
        reveal_mode: 'sequential',
        categories: [],
      }

      render(<TapRevealCategories {...defaultProps} content={emptyContent} />)

      expect(screen.getByText('Empty Test')).toBeInTheDocument()
      // Continue should be enabled since there are no items to reveal
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    it('handles category with no items', () => {
      const contentWithEmptyCategory: TapRevealCategoriesContent = {
        reveal_mode: 'sequential',
        categories: [
          {
            id: 'empty',
            title: 'Empty Category',
            items: [],
          },
          {
            id: 'filled',
            title: 'Filled Category',
            items: [{ id: 'item1', text: 'An item' }],
          },
        ],
      }

      render(<TapRevealCategories {...defaultProps} content={contentWithEmptyCategory} />)

      expect(screen.getByText('Empty Category')).toBeInTheDocument()
      expect(screen.getByText('Filled Category')).toBeInTheDocument()

      // Should still require revealing the one item
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
    })

    it('handles savedResponse with invalid item ids gracefully', () => {
      const savedResponse = {
        revealed_items: ['invalid_id', 'another_invalid'],
      }

      render(
        <TapRevealCategories
          {...defaultProps}
          content={basicContent}
          savedResponse={savedResponse}
        />
      )

      // Should not crash and should still show reveal button for valid items
      const revealButton = screen.getByRole('button', { name: /tap to reveal/i })
      expect(revealButton).toBeInTheDocument()
    })

    it('handles undefined savedResponse', () => {
      render(<TapRevealCategories {...defaultProps} content={basicContent} savedResponse={undefined} />)

      // Should render normally with no items revealed
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeDisabled()
    })
  })
})
