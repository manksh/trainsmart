'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getCurrentSubscription,
} from '@/lib/notifications';

/**
 * State interface for the useNotifications hook
 */
export interface UseNotificationsState {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Current notification permission status */
  permission: NotificationPermission;
  /** Whether the user is currently subscribed to push notifications */
  isSubscribed: boolean;
  /** Whether subscription status is being loaded or changed */
  isLoading: boolean;
  /** Error message if subscription/unsubscription failed */
  error: string | null;
}

/**
 * Result interface for the useNotifications hook
 */
export interface UseNotificationsResult extends UseNotificationsState {
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Manually check/refresh the subscription status */
  checkSubscription: () => Promise<void>;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for managing push notification subscriptions.
 *
 * Provides subscription state and actions for enabling/disabling notifications.
 * Automatically checks subscription status on mount.
 *
 * @example
 * ```tsx
 * function NotificationSettings() {
 *   const {
 *     isSupported,
 *     permission,
 *     isSubscribed,
 *     isLoading,
 *     error,
 *     subscribe,
 *     unsubscribe
 *   } = useNotifications();
 *
 *   if (!isSupported) {
 *     return <p>Push notifications not supported</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Status: {isSubscribed ? 'Subscribed' : 'Not subscribed'}</p>
 *       {error && <p className="text-red-500">{error}</p>}
 *       <button
 *         onClick={isSubscribed ? unsubscribe : subscribe}
 *         disabled={isLoading}
 *       >
 *         {isSubscribed ? 'Disable' : 'Enable'} Notifications
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotifications(): UseNotificationsResult {
  const [state, setState] = useState<UseNotificationsState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  /**
   * Check the current subscription status
   */
  const checkSubscription = useCallback(async () => {
    // Only update loading state if not already loading to avoid flickering
    setState((prev) => ({
      ...prev,
      error: null,
    }));

    try {
      const supported = isPushSupported();
      const permission = getPermissionStatus();
      const subscription = await getCurrentSubscription();

      setState({
        isSupported: supported,
        permission,
        isSubscribed: subscription !== null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[useNotifications] Failed to check subscription:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check notification status',
      }));
    }
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await subscribeToNotifications();

      if (subscription) {
        setState((prev) => ({
          ...prev,
          isSubscribed: true,
          permission: 'granted',
          isLoading: false,
        }));
        return true;
      } else {
        // Permission was likely denied or something else went wrong
        const permission = getPermissionStatus();
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error:
            permission === 'denied'
              ? 'Notification permission was denied'
              : 'Failed to enable notifications',
        }));
        return false;
      }
    } catch (error) {
      console.error('[useNotifications] Subscribe failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to enable notifications',
      }));
      return false;
    }
  }, []);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await unsubscribeFromNotifications();

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      console.error('[useNotifications] Unsubscribe failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to disable notifications',
      }));
      return false;
    }
  }, []);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Listen for permission changes (some browsers support this)
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('permissions' in navigator) ||
      !isPushSupported()
    ) {
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      // Re-check subscription when permission changes
      checkSubscription();
    };

    // Try to get and observe the notification permission status
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        permissionStatus = status;
        status.addEventListener('change', handlePermissionChange);
      })
      .catch(() => {
        // Some browsers don't support querying notification permission
        // This is fine, we just won't auto-update on permission change
      });

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [checkSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkSubscription,
    clearError,
  };
}

export default useNotifications;
