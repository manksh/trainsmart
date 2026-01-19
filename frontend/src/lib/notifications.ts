/**
 * Push notification subscription utilities
 *
 * This module provides functions for managing push notification subscriptions,
 * including permission handling, subscription management, and prompt dismissal tracking.
 *
 * Uses dependency injection via BrowserAdapter for testability.
 */

import { apiGet, apiPost, apiDelete } from './api';
import { getBrowserAdapter } from './notifications/browser-adapter';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_DISMISSAL_KEY = 'trainsmart_notification_prompt_dismissals';
const MAX_DISMISSALS = 3;
const DISMISSAL_COOLDOWN_DAYS = 7;

// ============================================================================
// Types
// ============================================================================

/**
 * Device registration payload for the backend
 */
interface DeviceRegistrationPayload {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
}

/**
 * Stored dismissal data for prompt tracking
 */
interface DismissalData {
  count: number;
  lastDismissedAt: number; // timestamp
}

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Checks if push notifications are supported in the current browser.
 * Requires Service Worker API, Push API, and Notification API.
 */
export function isPushSupported(): boolean {
  const adapter = getBrowserAdapter();
  if (!adapter.isWindowDefined()) return false;

  return (
    adapter.isServiceWorkerSupported() &&
    adapter.isPushManagerSupported() &&
    adapter.isNotificationSupported()
  );
}

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Gets the current notification permission status.
 * Returns 'default' if notifications are not supported.
 */
export function getPermissionStatus(): NotificationPermission {
  const adapter = getBrowserAdapter();
  if (!adapter.isWindowDefined() || !adapter.isNotificationSupported()) {
    return 'default';
  }
  return adapter.getNotificationPermission();
}

/**
 * Requests notification permission from the user.
 * Returns the resulting permission status.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('[Notifications] Push notifications not supported');
    return 'denied';
  }

  const adapter = getBrowserAdapter();
  try {
    const permission = await adapter.requestNotificationPermission();
    return permission;
  } catch (error) {
    console.error('[Notifications] Failed to request permission:', error);
    return 'denied';
  }
}

// ============================================================================
// VAPID Key Management
// ============================================================================

/**
 * Fetches the VAPID public key from the backend.
 * This key is required for creating push subscriptions.
 */
export async function getVapidPublicKey(): Promise<string> {
  const response = await apiGet<{ vapid_public_key: string }>(
    '/notifications/vapid-public-key'
  );
  return response.vapid_public_key;
}

/**
 * Converts a base64-encoded VAPID key to a Uint8Array.
 * Required for the PushManager.subscribe() method.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const adapter = getBrowserAdapter();
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = adapter.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Gets the current service worker registration.
 * Throws if service worker is not supported or registration fails.
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const adapter = getBrowserAdapter();
  if (!adapter.isServiceWorkerSupported()) {
    throw new Error('Service Worker not supported');
  }

  const registration = await adapter.getServiceWorkerReady();
  return registration;
}

/**
 * Gets the current push subscription, if any.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await getServiceWorkerRegistration();
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Notifications] Failed to get current subscription:', error);
    return null;
  }
}

/**
 * Subscribes to push notifications.
 * Returns the PushSubscription if successful, null otherwise.
 */
export async function subscribeToNotifications(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Notifications] Push notifications not supported');
    return null;
  }

  // Check/request permission
  const permission = await requestPermission();
  if (permission !== 'granted') {
    console.warn('[Notifications] Permission not granted:', permission);
    return null;
  }

  try {
    // Get VAPID key from backend
    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Get service worker registration
    const registration = await getServiceWorkerRegistration();

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      // Already subscribed, register with backend (in case it's not registered)
      await registerSubscription(existingSubscription);
      return existingSubscription;
    }

    // Create new subscription
    // Note: applicationServerKey needs to be cast to satisfy TypeScript's strict ArrayBuffer checks
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    // Register subscription with backend
    await registerSubscription(subscription);

    return subscription;
  } catch (error) {
    console.error('[Notifications] Failed to subscribe:', error);
    throw error;
  }
}

/**
 * Registers a push subscription with the backend.
 */
export async function registerSubscription(
  subscription: PushSubscription
): Promise<void> {
  const adapter = getBrowserAdapter();
  const subscriptionJson = subscription.toJSON();

  if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
    throw new Error('Invalid subscription: missing endpoint or keys');
  }

  const payload: DeviceRegistrationPayload = {
    endpoint: subscriptionJson.endpoint,
    p256dh_key: subscriptionJson.keys.p256dh,
    auth_key: subscriptionJson.keys.auth,
    user_agent: adapter.getUserAgent() || undefined,
  };

  await apiPost('/notifications/devices', payload);
}

/**
 * Unsubscribes from push notifications.
 * Removes the subscription from both the browser and the backend.
 */
export async function unsubscribeFromNotifications(): Promise<void> {
  try {
    const subscription = await getCurrentSubscription();

    if (subscription) {
      const subscriptionJson = subscription.toJSON();

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify backend to remove the device
      if (subscriptionJson.endpoint) {
        try {
          // Use base64 encoding for the endpoint as a device identifier
          const adapter = getBrowserAdapter();
          const deviceId = adapter.atob
            ? btoa(subscriptionJson.endpoint)
            : Buffer.from(subscriptionJson.endpoint).toString('base64');
          await apiDelete(`/notifications/devices/${deviceId}`);
        } catch (error) {
          // Backend might not have this subscription, that's okay
          console.warn('[Notifications] Failed to unregister from backend:', error);
        }
      }
    }
  } catch (error) {
    console.error('[Notifications] Failed to unsubscribe:', error);
    throw error;
  }
}

// ============================================================================
// Prompt Dismissal Tracking
// ============================================================================

/**
 * Gets the current dismissal data from localStorage.
 */
function getDismissalData(): DismissalData {
  const adapter = getBrowserAdapter();
  if (!adapter.isWindowDefined()) {
    return { count: 0, lastDismissedAt: 0 };
  }

  try {
    const stored = adapter.getLocalStorageItem(PROMPT_DISMISSAL_KEY);
    if (!stored) {
      return { count: 0, lastDismissedAt: 0 };
    }
    return JSON.parse(stored) as DismissalData;
  } catch {
    return { count: 0, lastDismissedAt: 0 };
  }
}

/**
 * Records that the user dismissed the notification prompt.
 * Increments the dismissal count and updates the timestamp.
 */
export function recordPromptDismissal(): void {
  const adapter = getBrowserAdapter();
  if (!adapter.isWindowDefined()) return;

  const data = getDismissalData();
  const newData: DismissalData = {
    count: data.count + 1,
    lastDismissedAt: Date.now(),
  };

  adapter.setLocalStorageItem(PROMPT_DISMISSAL_KEY, JSON.stringify(newData));
}

/**
 * Checks if the notification prompt should be shown to the user.
 * Returns false if:
 * - The 7-day cooldown hasn't passed since the last dismissal
 * - The user has dismissed the prompt 3 or more times
 */
export function shouldShowPrompt(): boolean {
  const adapter = getBrowserAdapter();
  if (!adapter.isWindowDefined()) return false;

  const data = getDismissalData();

  // If user has dismissed too many times, don't show again
  if (data.count >= MAX_DISMISSALS) {
    return false;
  }

  // If never dismissed, show the prompt
  if (data.lastDismissedAt === 0) {
    return true;
  }

  // Check if cooldown period has passed
  const cooldownMs = DISMISSAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const timeSinceLastDismissal = Date.now() - data.lastDismissedAt;

  return timeSinceLastDismissal > cooldownMs;
}

/**
 * Resets the prompt dismissal tracking.
 * Useful for testing or when the user manually enables notifications.
 */
export function resetPromptDismissals(): void {
  const adapter = getBrowserAdapter();
  if (!adapter.isWindowDefined()) return;
  adapter.removeLocalStorageItem(PROMPT_DISMISSAL_KEY);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if the user is currently subscribed to push notifications.
 */
export async function isSubscribed(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}
