/**
 * Tests for NotificationPermissionPrompt component.
 *
 * This component is a modal dialog that prompts users to enable push notifications.
 * Tests cover:
 * - Rendering and content
 * - User interactions (enable, dismiss, close)
 * - Accessibility features
 * - Loading states
 * - Keyboard navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt'

describe('NotificationPermissionPrompt', () => {
  const mockOnClose = vi.fn()
  const mockOnEnable = vi.fn()
  const mockOnDismiss = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onEnable: mockOnEnable,
    onDismiss: mockOnDismiss,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any body style changes
    document.body.style.overflow = ''
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('rendering', () => {
    it('renders correctly when open', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      expect(
        screen.getByText('Never miss your check-in')
      ).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<NotificationPermissionPrompt {...defaultProps} isOpen={false} />)

      expect(
        screen.queryByText('Never miss your check-in')
      ).not.toBeInTheDocument()
    })

    it('renders the title correctly', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const title = screen.getByRole('heading', {
        name: /never miss your check-in/i,
      })
      expect(title).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      expect(
        screen.getByText(/quick daily reminders help you build the habit/i)
      ).toBeInTheDocument()
    })

    it('renders the enable button', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const enableButton = screen.getByRole('button', {
        name: /enable reminders/i,
      })
      expect(enableButton).toBeInTheDocument()
    })

    it('renders the dismiss button', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const dismissButton = screen.getByRole('button', { name: /maybe later/i })
      expect(dismissButton).toBeInTheDocument()
    })

    it('renders the notification icon', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      // The SVG has aria-hidden="true", so we check for its container
      const iconContainer = document.querySelector('.bg-sage-100')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Interaction Tests
  // ===========================================================================

  describe('interactions', () => {
    it('calls onEnable when enable button is clicked', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const enableButton = screen.getByRole('button', {
        name: /enable reminders/i,
      })
      fireEvent.click(enableButton)

      expect(mockOnEnable).toHaveBeenCalledTimes(1)
    })

    it('calls onDismiss when maybe later button is clicked', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const dismissButton = screen.getByRole('button', { name: /maybe later/i })
      fireEvent.click(dismissButton)

      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking the backdrop', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      // Click the backdrop (the outer dialog container)
      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when clicking inside the modal', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const title = screen.getByText('Never miss your check-in')
      fireEvent.click(title)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('calls onClose when pressing Escape key', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('loading state', () => {
    it('disables enable button when loading', () => {
      render(<NotificationPermissionPrompt {...defaultProps} isLoading={true} />)

      const enableButton = screen.getByRole('button', { name: /enabling/i })
      expect(enableButton).toBeDisabled()
    })

    it('shows loading text and spinner when loading', () => {
      render(<NotificationPermissionPrompt {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Enabling...')).toBeInTheDocument()
    })

    it('disables maybe later button when loading', () => {
      render(<NotificationPermissionPrompt {...defaultProps} isLoading={true} />)

      const dismissButton = screen.getByRole('button', { name: /maybe later/i })
      expect(dismissButton).toBeDisabled()
    })

    it('does not close on backdrop click when loading', async () => {
      render(<NotificationPermissionPrompt {...defaultProps} isLoading={true} />)

      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('does not close on Escape key when loading', () => {
      render(<NotificationPermissionPrompt {...defaultProps} isLoading={true} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('accessibility', () => {
    it('has correct dialog role', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('has aria-modal set to true', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute(
        'aria-labelledby',
        'notification-prompt-title'
      )

      const title = document.getElementById('notification-prompt-title')
      expect(title).toBeInTheDocument()
      expect(title?.textContent).toBe('Never miss your check-in')
    })

    it('has aria-describedby pointing to description', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute(
        'aria-describedby',
        'notification-prompt-description'
      )

      const description = document.getElementById(
        'notification-prompt-description'
      )
      expect(description).toBeInTheDocument()
    })

    it('prevents body scroll when open', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <NotificationPermissionPrompt {...defaultProps} />
      )

      expect(document.body.style.overflow).toBe('hidden')

      rerender(<NotificationPermissionPrompt {...defaultProps} isOpen={false} />)

      expect(document.body.style.overflow).toBe('unset')
    })

    it('focuses the modal when opened', async () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      await waitFor(() => {
        // The modal container should receive focus
        const modalContent = document.querySelector('[tabindex="-1"]')
        expect(modalContent).toBe(document.activeElement)
      })
    })

    it('has accessible button labels', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const enableButton = screen.getByRole('button', {
        name: /enable reminders/i,
      })
      const dismissButton = screen.getByRole('button', { name: /maybe later/i })

      expect(enableButton).toBeInTheDocument()
      expect(dismissButton).toBeInTheDocument()
    })

    it('icon has aria-hidden attribute', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const svg = document.querySelector('svg[aria-hidden="true"]')
      expect(svg).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Focus Management Tests
  // ===========================================================================

  describe('focus management', () => {
    it('contains focusable elements within the modal', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const enableButton = screen.getByRole('button', {
        name: /enable reminders/i,
      })
      const dismissButton = screen.getByRole('button', { name: /maybe later/i })

      // Both buttons should be focusable
      expect(enableButton).not.toBeDisabled()
      expect(dismissButton).not.toBeDisabled()
    })

    it('restores focus to previous element when closed', async () => {
      // Create a button to focus before opening the modal
      const { rerender } = render(
        <>
          <button data-testid="previous-focus">Previous</button>
          <NotificationPermissionPrompt {...defaultProps} isOpen={false} />
        </>
      )

      const previousButton = screen.getByTestId('previous-focus')
      previousButton.focus()
      expect(document.activeElement).toBe(previousButton)

      // Open the modal
      rerender(
        <>
          <button data-testid="previous-focus">Previous</button>
          <NotificationPermissionPrompt {...defaultProps} />
        </>
      )

      // Close the modal
      rerender(
        <>
          <button data-testid="previous-focus">Previous</button>
          <NotificationPermissionPrompt {...defaultProps} isOpen={false} />
        </>
      )

      // Focus should be restored (may need waitFor in real environment)
      await waitFor(() => {
        expect(document.activeElement).toBe(previousButton)
      })
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles rapid open/close transitions', () => {
      const { rerender } = render(
        <NotificationPermissionPrompt {...defaultProps} />
      )

      // Rapidly toggle open state
      rerender(<NotificationPermissionPrompt {...defaultProps} isOpen={false} />)
      rerender(<NotificationPermissionPrompt {...defaultProps} isOpen={true} />)
      rerender(<NotificationPermissionPrompt {...defaultProps} isOpen={false} />)
      rerender(<NotificationPermissionPrompt {...defaultProps} isOpen={true} />)

      // Should still render correctly
      expect(screen.getByText('Never miss your check-in')).toBeInTheDocument()
    })

    it('handles callback functions that throw', () => {
      const throwingOnEnable = vi.fn(() => {
        throw new Error('Test error')
      })

      render(
        <NotificationPermissionPrompt
          {...defaultProps}
          onEnable={throwingOnEnable}
        />
      )

      const enableButton = screen.getByRole('button', {
        name: /enable reminders/i,
      })

      // Should call the callback (which will throw)
      expect(() => fireEvent.click(enableButton)).toThrow('Test error')
      expect(throwingOnEnable).toHaveBeenCalled()
    })

    it('handles unmounting while in loading state', () => {
      const { unmount } = render(
        <NotificationPermissionPrompt {...defaultProps} isLoading={true} />
      )

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow()
    })

    it('does not call callbacks multiple times on double click', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      const enableButton = screen.getByRole('button', {
        name: /enable reminders/i,
      })

      // Simulate double click
      fireEvent.doubleClick(enableButton)

      // Double click should only trigger once for click handlers
      // (unless explicitly handling dblclick event)
      expect(mockOnEnable).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Responsive Design Tests
  // ===========================================================================

  describe('responsive design', () => {
    it('renders mobile handle bar', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      // The handle bar container has specific classes
      const handleBar = document.querySelector('.sm\\:hidden .bg-gray-300')
      expect(handleBar).toBeInTheDocument()
    })

    it('applies bottom sheet styling for mobile', () => {
      render(<NotificationPermissionPrompt {...defaultProps} />)

      // The modal has rounded-t-2xl for mobile (top rounded) and sm:rounded-2xl for desktop
      const modalContent = document.querySelector('.rounded-t-2xl')
      expect(modalContent).toBeInTheDocument()
    })
  })
})
