'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { apiGet, apiPatch, ApiError } from '@/lib/api';

/**
 * Notification preferences response from the API
 */
interface NotificationPreferences {
  daily_checkin_reminder: boolean;
}

/**
 * Props for the NotificationToggle component
 */
export interface NotificationToggleProps {
  /** Optional className for the container */
  className?: string;
}

/**
 * NotificationToggle - Bell icon button with dropdown for managing notification preferences.
 *
 * Features:
 * - Bell icon button that opens a dropdown popover
 * - Toggle for daily check-in reminders
 * - Handles push notification permission states
 * - Shows appropriate messaging for blocked/unsupported states
 * - Optimistic updates with error rollback
 * - Accessible with proper ARIA attributes
 */
export function NotificationToggle({ className }: NotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: subscriptionLoading,
    subscribe,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /**
   * Fetch notification preferences from the API
   */
  const fetchPreferences = useCallback(async () => {
    if (!isSubscribed) return;

    setIsLoadingPrefs(true);
    setError(null);

    try {
      const prefs = await apiGet<NotificationPreferences>('/notifications/preferences');
      setPreferences(prefs);
    } catch (err) {
      console.error('[NotificationToggle] Failed to fetch preferences:', err);
      // Don't show error for preferences fetch - use default state
      setPreferences({ daily_checkin_reminder: true });
    } finally {
      setIsLoadingPrefs(false);
    }
  }, [isSubscribed]);

  /**
   * Update the daily reminder preference
   */
  const updateDailyReminder = async (enabled: boolean) => {
    const previousValue = preferences?.daily_checkin_reminder;

    // Optimistic update
    setPreferences((prev) => prev ? { ...prev, daily_checkin_reminder: enabled } : null);
    setIsUpdating(true);
    setError(null);

    try {
      await apiPatch<NotificationPreferences>('/notifications/preferences', {
        daily_checkin_reminder: enabled,
      });
    } catch (err) {
      console.error('[NotificationToggle] Failed to update preferences:', err);

      // Revert optimistic update
      setPreferences((prev) => prev ? { ...prev, daily_checkin_reminder: previousValue ?? true } : null);

      // Show error message
      if (err instanceof ApiError) {
        setError('Failed to save. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }

      // Clear error after 4 seconds
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle enabling notifications when permission not granted
   */
  const handleEnableNotifications = async () => {
    setError(null);
    const success = await subscribe();
    if (success) {
      // Fetch preferences after successful subscription
      await fetchPreferences();
    }
  };

  /**
   * Toggle the dropdown open/closed
   */
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    setError(null);
  };

  /**
   * Close the dropdown
   */
  const closeDropdown = () => {
    setIsOpen(false);
    setError(null);
  };

  // Fetch preferences when subscribed and dropdown opens
  useEffect(() => {
    if (isOpen && isSubscribed && !preferences) {
      fetchPreferences();
    }
  }, [isOpen, isSubscribed, preferences, fetchPreferences]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Don't render if push notifications aren't supported
  if (!isSupported) {
    return null;
  }

  const isDailyReminderEnabled = preferences?.daily_checkin_reminder ?? false;
  const isPermissionDenied = permission === 'denied';
  const needsSubscription = !isSubscribed && permission !== 'denied';
  const showToggle = isSubscribed && preferences !== null;
  const isLoading = subscriptionLoading || isLoadingPrefs;

  return (
    <div className={cn('relative', className)}>
      {/* Bell icon button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
          isOpen && 'bg-gray-100 text-gray-600'
        )}
        aria-label="Notification settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="w-5 h-5"
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
      </button>

      {/* Dropdown popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-72 bg-white rounded-xl shadow-lg',
            'border border-gray-200',
            'animate-in fade-in slide-in-from-top-2 duration-150'
          )}
          role="dialog"
          aria-label="Notification preferences"
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Notifications
            </h3>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <svg
                  className="animate-spin h-5 w-5 text-sage-600"
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
              </div>
            )}

            {/* Permission denied state */}
            {!isLoading && isPermissionDenied && (
              <div className="py-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Blocked in browser settings
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      To enable reminders, allow notifications for this site in your browser settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Needs subscription state */}
            {!isLoading && needsSubscription && (
              <div className="py-2">
                <p className="text-sm text-gray-600 mb-3">
                  Enable notifications to receive check-in reminders.
                </p>
                <button
                  onClick={handleEnableNotifications}
                  disabled={subscriptionLoading}
                  className={cn(
                    'w-full py-2 px-4 rounded-lg text-sm font-medium',
                    'bg-sage-700 text-sage-50 hover:bg-sage-800',
                    'transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2'
                  )}
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {/* Toggle state */}
            {!isLoading && showToggle && (
              <div className="space-y-3">
                {/* Toggle row */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Daily reminders</span>
                  <button
                    onClick={() => updateDailyReminder(!isDailyReminderEnabled)}
                    disabled={isUpdating}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full',
                      'border-2 border-transparent transition-colors duration-200 ease-in-out',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isDailyReminderEnabled ? 'bg-sage-700' : 'bg-gray-200'
                    )}
                    role="switch"
                    aria-checked={isDailyReminderEnabled}
                    aria-label="Toggle daily reminders"
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
                        'ring-0 transition duration-200 ease-in-out',
                        isDailyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {/* Helper text */}
                <p className="text-xs text-gray-500">
                  {isDailyReminderEnabled
                    ? 'Reminders at 9am & 2pm if you haven\'t checked in yet.'
                    : 'You won\'t receive check-in reminders.'}
                </p>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-xs">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationToggle;
