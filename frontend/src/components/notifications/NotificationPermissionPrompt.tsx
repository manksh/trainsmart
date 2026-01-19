'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Props for the NotificationPermissionPrompt component
 */
export interface NotificationPermissionPromptProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when user clicks "Enable Reminders" */
  onEnable: () => void;
  /** Callback when user clicks "Maybe Later" */
  onDismiss: () => void;
  /** Whether the enable action is loading */
  isLoading?: boolean;
}

/**
 * NotificationPermissionPrompt - Modal to ask users to enable push notifications.
 *
 * Designed to be shown after the user completes their first check-in.
 * Mobile-first design with a bottom sheet on mobile and centered modal on desktop.
 *
 * Features:
 * - Accessible with proper ARIA labels
 * - Focus trap when open
 * - Escape key to close
 * - Click outside to close
 * - Smooth animations
 */
export function NotificationPermissionPrompt({
  isOpen,
  onClose,
  onEnable,
  onDismiss,
  isLoading = false,
}: NotificationPermissionPromptProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Handle click outside modal
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus the modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';

      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center sm:items-center',
        'bg-black/50 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-prompt-title"
      aria-describedby="notification-prompt-description"
    >
      {/* Modal content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md bg-white',
          'rounded-t-2xl sm:rounded-2xl',
          'shadow-xl',
          'max-h-[90vh] overflow-auto',
          'outline-none',
          'animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="p-6 pt-4 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-sage-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2
            id="notification-prompt-title"
            className="text-xl font-semibold text-gray-900 text-center mb-3"
          >
            Never miss your check-in
          </h2>

          {/* Description */}
          <p
            id="notification-prompt-description"
            className="text-gray-600 text-center mb-6 leading-relaxed"
          >
            Quick daily reminders help you build the habit of mental training.
          </p>

          {/* Enable button */}
          <Button
            onClick={onEnable}
            disabled={isLoading}
            variant="sage"
            className="w-full mb-3 h-12 text-base font-medium"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Enabling...
              </span>
            ) : (
              'Enable Reminders'
            )}
          </Button>

          {/* Maybe later link */}
          <button
            onClick={onDismiss}
            disabled={isLoading}
            className={cn(
              'w-full py-3 text-gray-500 hover:text-gray-700',
              'text-base font-medium',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPermissionPrompt;
