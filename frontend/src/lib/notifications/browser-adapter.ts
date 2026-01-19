/**
 * Browser API Adapter for Push Notifications
 *
 * This module provides an abstraction layer over browser APIs to enable
 * dependency injection for testing. In production, the default adapter
 * uses real browser APIs. In tests, a mock adapter can be injected.
 */

/**
 * Interface defining all browser API methods needed by notifications
 */
export interface BrowserAdapter {
  // Environment checks
  isWindowDefined(): boolean;
  isServiceWorkerSupported(): boolean;
  isPushManagerSupported(): boolean;
  isNotificationSupported(): boolean;

  // Notification API
  getNotificationPermission(): NotificationPermission;
  requestNotificationPermission(): Promise<NotificationPermission>;

  // Service Worker API
  getServiceWorkerReady(): Promise<ServiceWorkerRegistration>;

  // Storage
  getLocalStorageItem(key: string): string | null;
  setLocalStorageItem(key: string, value: string): void;
  removeLocalStorageItem(key: string): void;

  // Utilities
  atob(encoded: string): string;
  getUserAgent(): string;
}

/**
 * Default browser adapter implementation using real browser APIs
 */
const createDefaultAdapter = (): BrowserAdapter => ({
  isWindowDefined: () => typeof window !== 'undefined',

  isServiceWorkerSupported: () =>
    typeof window !== 'undefined' && 'serviceWorker' in navigator,

  isPushManagerSupported: () =>
    typeof window !== 'undefined' && 'PushManager' in window,

  isNotificationSupported: () =>
    typeof window !== 'undefined' && 'Notification' in window,

  getNotificationPermission: () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'default';
    }
    return Notification.permission;
  },

  requestNotificationPermission: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.requestPermission();
  },

  getServiceWorkerReady: () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return Promise.reject(new Error('Service Worker not supported'));
    }
    return navigator.serviceWorker.ready;
  },

  getLocalStorageItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setLocalStorageItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage may be unavailable (e.g., private browsing)
    }
  },

  removeLocalStorageItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage may be unavailable
    }
  },

  atob: (encoded: string) => {
    if (typeof window !== 'undefined') {
      return window.atob(encoded);
    }
    // Fallback for Node.js environment (should not be used in production)
    return Buffer.from(encoded, 'base64').toString('binary');
  },

  getUserAgent: () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return '';
    }
    return navigator.userAgent;
  },
});

/**
 * The default adapter instance using real browser APIs
 */
export const defaultBrowserAdapter: BrowserAdapter = createDefaultAdapter();

/**
 * Current adapter (can be swapped for testing)
 */
let currentAdapter: BrowserAdapter = defaultBrowserAdapter;

/**
 * Get the current browser adapter
 */
export function getBrowserAdapter(): BrowserAdapter {
  return currentAdapter;
}

/**
 * Set a custom browser adapter (for testing)
 */
export function setBrowserAdapter(adapter: BrowserAdapter): void {
  currentAdapter = adapter;
}

/**
 * Reset to the default browser adapter
 */
export function resetBrowserAdapter(): void {
  currentAdapter = defaultBrowserAdapter;
}

/**
 * Factory to create a mock adapter with customizable overrides (for testing)
 */
export function createMockAdapter(
  overrides: Partial<BrowserAdapter> = {}
): BrowserAdapter {
  return {
    isWindowDefined: () => true,
    isServiceWorkerSupported: () => true,
    isPushManagerSupported: () => true,
    isNotificationSupported: () => true,
    getNotificationPermission: () => 'default',
    requestNotificationPermission: async () => 'granted',
    getServiceWorkerReady: async () =>
      ({
        pushManager: {
          getSubscription: async () => null,
          subscribe: async () => ({}),
        },
      } as unknown as ServiceWorkerRegistration),
    getLocalStorageItem: () => null,
    setLocalStorageItem: () => {},
    removeLocalStorageItem: () => {},
    atob: (str) => Buffer.from(str, 'base64').toString('binary'),
    getUserAgent: () => 'Test Browser',
    ...overrides,
  };
}
