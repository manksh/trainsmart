/**
 * Tests for push notification utilities.
 *
 * Uses dependency injection via BrowserAdapter for reliable testing
 * without complex browser API mocking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setBrowserAdapter,
  resetBrowserAdapter,
  createMockAdapter,
  type BrowserAdapter,
} from './notifications/browser-adapter';
import {
  isPushSupported,
  shouldShowPrompt,
  recordPromptDismissal,
  resetPromptDismissals,
  getPermissionStatus,
  requestPermission,
  urlBase64ToUint8Array,
  getCurrentSubscription,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  registerSubscription,
  isSubscribed,
} from './notifications';

// Constants matching the implementation
const PROMPT_DISMISSAL_KEY = 'trainsmart_notification_prompt_dismissals';
const MAX_DISMISSALS = 3;
const DISMISSAL_COOLDOWN_DAYS = 7;

// Mock fetch for API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage globally for api.ts which uses it directly for auth tokens
const globalLocalStorageStore: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => globalLocalStorageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    globalLocalStorageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete globalLocalStorageStore[key];
  },
  clear: () => {
    Object.keys(globalLocalStorageStore).forEach((key) => delete globalLocalStorageStore[key]);
  },
  length: 0,
  key: () => null,
});

describe('Push Notification Utilities', () => {
  // Storage for mock localStorage
  let localStorageStore: Record<string, string> = {};

  // Create a base mock adapter with localStorage simulation
  function createTestAdapter(overrides: Partial<BrowserAdapter> = {}): BrowserAdapter {
    return createMockAdapter({
      getLocalStorageItem: (key: string) => localStorageStore[key] ?? null,
      setLocalStorageItem: (key: string, value: string) => {
        localStorageStore[key] = value;
      },
      removeLocalStorageItem: (key: string) => {
        delete localStorageStore[key];
      },
      ...overrides,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageStore = {};
    mockFetch.mockReset();
    resetBrowserAdapter();
  });

  afterEach(() => {
    resetBrowserAdapter();
  });

  // ===========================================================================
  // isPushSupported tests
  // ===========================================================================

  describe('isPushSupported', () => {
    it('returns true when all APIs are present', () => {
      setBrowserAdapter(createTestAdapter());
      expect(isPushSupported()).toBe(true);
    });

    it('returns false when window is undefined (SSR)', () => {
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));
      expect(isPushSupported()).toBe(false);
    });

    it('returns false when ServiceWorker is not supported', () => {
      setBrowserAdapter(createTestAdapter({ isServiceWorkerSupported: () => false }));
      expect(isPushSupported()).toBe(false);
    });

    it('returns false when PushManager is not supported', () => {
      setBrowserAdapter(createTestAdapter({ isPushManagerSupported: () => false }));
      expect(isPushSupported()).toBe(false);
    });

    it('returns false when Notification API is not supported', () => {
      setBrowserAdapter(createTestAdapter({ isNotificationSupported: () => false }));
      expect(isPushSupported()).toBe(false);
    });
  });

  // ===========================================================================
  // getPermissionStatus tests
  // ===========================================================================

  describe('getPermissionStatus', () => {
    it('returns granted when permission is granted', () => {
      setBrowserAdapter(createTestAdapter({ getNotificationPermission: () => 'granted' }));
      expect(getPermissionStatus()).toBe('granted');
    });

    it('returns default when permission is default', () => {
      setBrowserAdapter(createTestAdapter({ getNotificationPermission: () => 'default' }));
      expect(getPermissionStatus()).toBe('default');
    });

    it('returns denied when permission is denied', () => {
      setBrowserAdapter(createTestAdapter({ getNotificationPermission: () => 'denied' }));
      expect(getPermissionStatus()).toBe('denied');
    });

    it('returns default when window is undefined', () => {
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));
      expect(getPermissionStatus()).toBe('default');
    });

    it('returns default when Notification API is not supported', () => {
      setBrowserAdapter(createTestAdapter({ isNotificationSupported: () => false }));
      expect(getPermissionStatus()).toBe('default');
    });
  });

  // ===========================================================================
  // shouldShowPrompt tests
  // ===========================================================================

  describe('shouldShowPrompt', () => {
    it('returns true for fresh user with no dismissals', () => {
      setBrowserAdapter(createTestAdapter());
      expect(shouldShowPrompt()).toBe(true);
    });

    it('returns false when window is undefined', () => {
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));
      expect(shouldShowPrompt()).toBe(false);
    });

    it('returns false after maximum dismissals reached', () => {
      const data = { count: MAX_DISMISSALS, lastDismissedAt: Date.now() - 100000000 };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      expect(shouldShowPrompt()).toBe(false);
    });

    it('returns false after exceeding maximum dismissals', () => {
      const data = { count: MAX_DISMISSALS + 5, lastDismissedAt: Date.now() - 100000000 };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      expect(shouldShowPrompt()).toBe(false);
    });

    it('returns false within cooldown period after dismissal', () => {
      const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;
      const data = { count: 1, lastDismissedAt: oneDayAgo };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      expect(shouldShowPrompt()).toBe(false);
    });

    it('returns true after cooldown period expires', () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const data = { count: 1, lastDismissedAt: eightDaysAgo };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      expect(shouldShowPrompt()).toBe(true);
    });

    it('returns true just after cooldown boundary', () => {
      const justAfterCooldown = Date.now() - (DISMISSAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000 + 1);
      const data = { count: 1, lastDismissedAt: justAfterCooldown };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      expect(shouldShowPrompt()).toBe(true);
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageStore[PROMPT_DISMISSAL_KEY] = 'invalid-json';
      setBrowserAdapter(createTestAdapter());

      expect(() => shouldShowPrompt()).not.toThrow();
      expect(shouldShowPrompt()).toBe(true);
    });
  });

  // ===========================================================================
  // recordPromptDismissal tests
  // ===========================================================================

  describe('recordPromptDismissal', () => {
    it('increments dismissal count from 0 to 1', () => {
      setBrowserAdapter(createTestAdapter());
      recordPromptDismissal();

      const stored = JSON.parse(localStorageStore[PROMPT_DISMISSAL_KEY]);
      expect(stored.count).toBe(1);
    });

    it('increments existing dismissal count', () => {
      const data = { count: 2, lastDismissedAt: Date.now() - 100000 };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      recordPromptDismissal();

      const stored = JSON.parse(localStorageStore[PROMPT_DISMISSAL_KEY]);
      expect(stored.count).toBe(3);
    });

    it('sets timestamp of dismissal', () => {
      setBrowserAdapter(createTestAdapter());
      const beforeTime = Date.now();
      recordPromptDismissal();
      const afterTime = Date.now();

      const stored = JSON.parse(localStorageStore[PROMPT_DISMISSAL_KEY]);
      expect(stored.lastDismissedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(stored.lastDismissedAt).toBeLessThanOrEqual(afterTime);
    });

    it('handles corrupted stored data gracefully', () => {
      localStorageStore[PROMPT_DISMISSAL_KEY] = 'not-json';
      setBrowserAdapter(createTestAdapter());

      expect(() => recordPromptDismissal()).not.toThrow();

      const stored = JSON.parse(localStorageStore[PROMPT_DISMISSAL_KEY]);
      expect(stored.count).toBe(1);
    });

    it('does nothing when window is undefined', () => {
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));
      recordPromptDismissal();

      expect(localStorageStore[PROMPT_DISMISSAL_KEY]).toBeUndefined();
    });
  });

  // ===========================================================================
  // resetPromptDismissals tests
  // ===========================================================================

  describe('resetPromptDismissals', () => {
    it('removes dismissal data from localStorage', () => {
      const data = { count: 3, lastDismissedAt: Date.now() };
      localStorageStore[PROMPT_DISMISSAL_KEY] = JSON.stringify(data);
      setBrowserAdapter(createTestAdapter());

      resetPromptDismissals();

      expect(localStorageStore[PROMPT_DISMISSAL_KEY]).toBeUndefined();
    });

    it('does nothing when window is undefined', () => {
      localStorageStore[PROMPT_DISMISSAL_KEY] = 'some-data';
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));

      resetPromptDismissals();

      expect(localStorageStore[PROMPT_DISMISSAL_KEY]).toBe('some-data');
    });
  });

  // ===========================================================================
  // urlBase64ToUint8Array tests
  // ===========================================================================

  describe('urlBase64ToUint8Array', () => {
    it('converts base64url string to Uint8Array', () => {
      setBrowserAdapter(createTestAdapter());
      const base64 = 'SGVsbG8'; // "Hello" in base64
      const result = urlBase64ToUint8Array(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles base64url characters (- and _)', () => {
      setBrowserAdapter(createTestAdapter());
      const base64url = 'SGVs-W8_';
      expect(() => urlBase64ToUint8Array(base64url)).not.toThrow();
    });

    it('adds padding when necessary', () => {
      setBrowserAdapter(createTestAdapter());
      const unpadded = 'SGVsbG8';
      const result = urlBase64ToUint8Array(unpadded);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  // ===========================================================================
  // requestPermission tests
  // ===========================================================================

  describe('requestPermission', () => {
    it('requests permission and returns granted', async () => {
      setBrowserAdapter(
        createTestAdapter({
          requestNotificationPermission: async () => 'granted',
        })
      );

      const result = await requestPermission();
      expect(result).toBe('granted');
    });

    it('returns denied when permission is denied', async () => {
      setBrowserAdapter(
        createTestAdapter({
          requestNotificationPermission: async () => 'denied',
        })
      );

      const result = await requestPermission();
      expect(result).toBe('denied');
    });

    it('returns denied when push is not supported', async () => {
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));

      const result = await requestPermission();
      expect(result).toBe('denied');
    });

    it('handles errors gracefully', async () => {
      setBrowserAdapter(
        createTestAdapter({
          requestNotificationPermission: async () => {
            throw new Error('Permission request failed');
          },
        })
      );

      const result = await requestPermission();
      expect(result).toBe('denied');
    });
  });

  // ===========================================================================
  // getCurrentSubscription tests
  // ===========================================================================

  describe('getCurrentSubscription', () => {
    it('returns null when no subscription exists', async () => {
      const mockRegistration = {
        pushManager: {
          getSubscription: async () => null,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      const result = await getCurrentSubscription();
      expect(result).toBeNull();
    });

    it('returns existing subscription', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      };

      const mockRegistration = {
        pushManager: {
          getSubscription: async () => mockSubscription,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      const result = await getCurrentSubscription();
      expect(result).toBe(mockSubscription);
    });

    it('handles errors gracefully', async () => {
      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => {
            throw new Error('Service worker error');
          },
        })
      );

      const result = await getCurrentSubscription();
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // subscribeToNotifications tests
  // ===========================================================================

  describe('subscribeToNotifications', () => {
    it('returns null when push is not supported', async () => {
      setBrowserAdapter(createTestAdapter({ isWindowDefined: () => false }));

      const result = await subscribeToNotifications();
      expect(result).toBeNull();
    });

    it('returns null when permission is denied', async () => {
      setBrowserAdapter(
        createTestAdapter({
          requestNotificationPermission: async () => 'denied',
        })
      );

      const result = await subscribeToNotifications();
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // unsubscribeFromNotifications tests
  // ===========================================================================

  describe('unsubscribeFromNotifications', () => {
    it('unsubscribes existing subscription', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true);
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        unsubscribe: mockUnsubscribe,
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      };

      const mockRegistration = {
        pushManager: {
          getSubscription: async () => mockSubscription,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      // Mock the fetch for DELETE call
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await unsubscribeFromNotifications();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('does not throw when no subscription exists', async () => {
      const mockRegistration = {
        pushManager: {
          getSubscription: async () => null,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      await expect(unsubscribeFromNotifications()).resolves.not.toThrow();
    });

    it('continues even if backend notification fails', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true);
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        unsubscribe: mockUnsubscribe,
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      };

      const mockRegistration = {
        pushManager: {
          getSubscription: async () => mockSubscription,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      // Backend call fails
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(unsubscribeFromNotifications()).resolves.not.toThrow();
      // But should still unsubscribe locally
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // isSubscribed tests
  // ===========================================================================

  describe('isSubscribed', () => {
    it('returns true when subscription exists', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
      };

      const mockRegistration = {
        pushManager: {
          getSubscription: async () => mockSubscription,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      const result = await isSubscribed();
      expect(result).toBe(true);
    });

    it('returns false when no subscription exists', async () => {
      const mockRegistration = {
        pushManager: {
          getSubscription: async () => null,
        },
      } as unknown as ServiceWorkerRegistration;

      setBrowserAdapter(
        createTestAdapter({
          getServiceWorkerReady: async () => mockRegistration,
        })
      );

      const result = await isSubscribed();
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // registerSubscription tests
  // ===========================================================================

  describe('registerSubscription', () => {
    it('sends correct payload to backend', async () => {
      setBrowserAdapter(createTestAdapter());
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'device-id' }),
      });

      const mockSubscription = {
        endpoint: 'https://push.example.com/register-test',
        toJSON: () => ({
          endpoint: 'https://push.example.com/register-test',
          keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        }),
      } as unknown as PushSubscription;

      await registerSubscription(mockSubscription);

      const postCall = mockFetch.mock.calls.find(
        (call: any[]) => call[1]?.method === 'POST'
      );

      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall![1].body);
      expect(body.endpoint).toBe('https://push.example.com/register-test');
      expect(body.p256dh_key).toBe('p256dh-key');
      expect(body.auth_key).toBe('auth-key');
    });

    it('throws error for invalid subscription', async () => {
      setBrowserAdapter(createTestAdapter());
      const mockSubscription = {
        endpoint: null,
        toJSON: () => ({
          endpoint: null,
          keys: null,
        }),
      } as unknown as PushSubscription;

      await expect(registerSubscription(mockSubscription)).rejects.toThrow(
        'Invalid subscription'
      );
    });

    it('includes user agent in payload', async () => {
      setBrowserAdapter(createTestAdapter({ getUserAgent: () => 'Custom User Agent' }));
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'device-id' }),
      });

      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      } as unknown as PushSubscription;

      await registerSubscription(mockSubscription);

      const postCall = mockFetch.mock.calls.find(
        (call: any[]) => call[1]?.method === 'POST'
      );

      const body = JSON.parse(postCall![1].body);
      expect(body.user_agent).toBe('Custom User Agent');
    });
  });
});
