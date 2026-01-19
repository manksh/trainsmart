/// <reference lib="webworker" />

/**
 * Custom service worker push notification handlers.
 * This file is automatically imported by @ducanh2912/next-pwa into the generated SW.
 */

// TypeScript requires explicit cast for service worker global scope
const sw = self as unknown as ServiceWorkerGlobalScope;

/**
 * Notification payload structure from the backend
 */
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Extended notification options with vibrate support
 */
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
}

/**
 * Default notification icon - uses the app icon
 */
const DEFAULT_ICON = '/icons/icon-192.svg';

/**
 * Default badge icon for notification
 */
const DEFAULT_BADGE = '/icons/icon-192.svg';

/**
 * Default URL to navigate to when notification is clicked
 */
const DEFAULT_CLICK_URL = '/checkin';

/**
 * Handle push events - parse payload and show notification
 */
sw.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW Push] Received push event without data');
    return;
  }

  let payload: PushPayload;

  try {
    payload = event.data.json() as PushPayload;
  } catch (error) {
    // If JSON parsing fails, try to use the text as the body
    const text = event.data.text();
    payload = {
      title: 'TrainSmart',
      body: text || 'You have a new notification',
    };
    console.warn('[SW Push] Failed to parse push data as JSON, using text fallback:', error);
  }

  const { title, body, icon, badge, url, tag, data } = payload;

  const notificationOptions: ExtendedNotificationOptions = {
    body,
    icon: icon || DEFAULT_ICON,
    badge: badge || DEFAULT_BADGE,
    tag: tag || 'trainsmart-notification',
    data: {
      url: url || DEFAULT_CLICK_URL,
      ...data,
    },
    // Vibration pattern for mobile devices
    vibrate: [100, 50, 100],
    // Keep notification until user interacts
    requireInteraction: false,
  };

  // Use waitUntil to keep the service worker alive until the notification is shown
  event.waitUntil(
    sw.registration.showNotification(title || 'TrainSmart', notificationOptions)
  );
});

/**
 * Handle notification click - focus app or open URL from notification data
 */
sw.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();

  // Get the URL from notification data, fallback to default
  const notificationData = event.notification.data as { url?: string } | undefined;
  const urlToOpen = notificationData?.url || DEFAULT_CLICK_URL;

  // Ensure the URL is absolute
  const fullUrl = new URL(urlToOpen, sw.location.origin).href;

  // Use waitUntil to keep the service worker alive
  event.waitUntil(
    (async () => {
      // Get all window clients
      const clients = await sw.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Try to find an existing window/tab to focus
      for (const client of clients) {
        // Check if there's already a window open at our origin
        if (client.url.startsWith(sw.location.origin) && 'focus' in client) {
          await (client as WindowClient).focus();
          // Navigate the existing window to the target URL
          if ('navigate' in client) {
            await (client as WindowClient).navigate(fullUrl);
          }
          return;
        }
      }

      // No existing window found, open a new one
      await sw.clients.openWindow(fullUrl);
    })()
  );
});

/**
 * Handle notification close - can be used for analytics
 */
sw.addEventListener('notificationclose', (event) => {
  // Could send analytics here if needed
  console.log('[SW Push] Notification closed:', event.notification.tag);
});

// Export empty object to make this a module (required for TypeScript)
export {};
