/**
 * Tests for push notification utilities.
 *
 * These tests verify:
 * - Browser capability detection
 * - Prompt display logic (dismissals, cooldowns)
 * - Subscription management
 * - Service worker integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock browser APIs before importing the module
const mockNavigator = {
  serviceWorker: {
    ready: Promise.resolve({
      pushManager: {
        getSubscription: vi.fn(),
        subscribe: vi.fn(),
      },
    }),
    register: vi.fn(),
  },
  userAgent: 'Mozilla/5.0 (Test Browser)',
}

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: vi.fn(),
}

const mockPushManager = {
  getSubscription: vi.fn(),
  subscribe: vi.fn(),
}

// Setup global mocks
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
})

Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
})

Object.defineProperty(global, 'PushManager', {
  value: mockPushManager,
  writable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock fetch for API calls
const mockFetch = vi.fn()
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true,
})

// Mock btoa/atob
Object.defineProperty(global, 'btoa', {
  value: (str: string) => Buffer.from(str).toString('base64'),
  writable: true,
})

Object.defineProperty(global, 'atob', {
  value: (str: string) => Buffer.from(str, 'base64').toString(),
  writable: true,
})

// Import after mocks are set up
import {
  isPushSupported,
  shouldShowPrompt,
  recordPromptDismissal,
  resetPromptDismissals,
  getPermissionStatus,
  requestPermission,
  getVapidPublicKey,
  urlBase64ToUint8Array,
  getCurrentSubscription,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  registerSubscription,
  isSubscribed,
} from './notifications'

// Constants matching the implementation
const PROMPT_DISMISSAL_KEY = 'trainsmart_notification_prompt_dismissals'
const MAX_DISMISSALS = 3
const DISMISSAL_COOLDOWN_DAYS = 7

describe('Push Notification Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Reset notification permission
    ;(global.Notification as any).permission = 'default'

    // Reset mock implementations
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // isPushSupported tests
  // ===========================================================================

  describe('isPushSupported', () => {
    it('returns true when browser has all required APIs', () => {
      // With our mocks, all APIs are available
      expect(isPushSupported()).toBe(true)
    })

    it('returns false when serviceWorker is not available', () => {
      const originalServiceWorker = navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      })

      expect(isPushSupported()).toBe(false)

      // Restore
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      })
    })

    it('returns false when PushManager is not available', () => {
      const originalPushManager = global.PushManager
      ;(global as any).PushManager = undefined

      expect(isPushSupported()).toBe(false)

      // Restore
      ;(global as any).PushManager = originalPushManager
    })

    it('returns false when Notification API is not available', () => {
      const originalNotification = global.Notification
      ;(global as any).Notification = undefined

      expect(isPushSupported()).toBe(false)

      // Restore
      ;(global as any).Notification = originalNotification
    })

    it('returns false on server-side (no window)', () => {
      const originalWindow = global.window
      ;(global as any).window = undefined

      expect(isPushSupported()).toBe(false)

      // Restore
      ;(global as any).window = originalWindow
    })
  })

  // ===========================================================================
  // getPermissionStatus tests
  // ===========================================================================

  describe('getPermissionStatus', () => {
    it('returns current notification permission', () => {
      ;(global.Notification as any).permission = 'granted'
      expect(getPermissionStatus()).toBe('granted')
    })

    it('returns default when Notification API unavailable', () => {
      const originalNotification = global.Notification
      ;(global as any).Notification = undefined

      expect(getPermissionStatus()).toBe('default')

      ;(global as any).Notification = originalNotification
    })
  })

  // ===========================================================================
  // shouldShowPrompt tests
  // ===========================================================================

  describe('shouldShowPrompt', () => {
    it('returns true for fresh user with no dismissals', () => {
      // No localStorage entries
      expect(shouldShowPrompt()).toBe(true)
    })

    it('returns false after maximum dismissals reached', () => {
      // Set dismissal count to max using JSON format
      const data = { count: MAX_DISMISSALS, lastDismissedAt: Date.now() - 100000000 }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      expect(shouldShowPrompt()).toBe(false)
    })

    it('returns false after exceeding maximum dismissals', () => {
      const data = { count: MAX_DISMISSALS + 5, lastDismissedAt: Date.now() - 100000000 }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      expect(shouldShowPrompt()).toBe(false)
    })

    it('returns false within cooldown period after dismissal', () => {
      // Dismissed 1 day ago (within 7-day cooldown)
      const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000
      const data = { count: 1, lastDismissedAt: oneDayAgo }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      expect(shouldShowPrompt()).toBe(false)
    })

    it('returns true after cooldown period expires', () => {
      // Dismissed 8 days ago (outside 7-day cooldown)
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      const data = { count: 1, lastDismissedAt: eightDaysAgo }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      expect(shouldShowPrompt()).toBe(true)
    })

    it('returns false at exactly cooldown boundary', () => {
      // Dismissed exactly 7 days ago (still within cooldown)
      const sevenDaysAgo = Date.now() - DISMISSAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      const data = { count: 1, lastDismissedAt: sevenDaysAgo }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      // At exactly boundary, should still be in cooldown
      expect(shouldShowPrompt()).toBe(false)
    })

    it('returns true just after cooldown boundary', () => {
      // Dismissed 7 days + 1 millisecond ago
      const justAfterCooldown =
        Date.now() - (DISMISSAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000 + 1)
      const data = { count: 1, lastDismissedAt: justAfterCooldown }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      expect(shouldShowPrompt()).toBe(true)
    })

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, 'invalid-json')

      // Should not throw and should return true (treat as fresh user)
      expect(() => shouldShowPrompt()).not.toThrow()
      expect(shouldShowPrompt()).toBe(true)
    })
  })

  // ===========================================================================
  // recordPromptDismissal tests
  // ===========================================================================

  describe('recordPromptDismissal', () => {
    it('increments dismissal count from 0 to 1', () => {
      recordPromptDismissal()

      const storedCall = localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0] === PROMPT_DISMISSAL_KEY
      )
      expect(storedCall).toBeDefined()

      const stored = JSON.parse(storedCall![1])
      expect(stored.count).toBe(1)
    })

    it('increments existing dismissal count', () => {
      const data = { count: 2, lastDismissedAt: Date.now() - 100000 }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      recordPromptDismissal()

      const storedCall = localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0] === PROMPT_DISMISSAL_KEY
      )
      const stored = JSON.parse(storedCall![1])
      expect(stored.count).toBe(3)
    })

    it('sets timestamp of dismissal', () => {
      const beforeTime = Date.now()
      recordPromptDismissal()
      const afterTime = Date.now()

      const storedCall = localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0] === PROMPT_DISMISSAL_KEY
      )
      const stored = JSON.parse(storedCall![1])

      expect(stored.lastDismissedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(stored.lastDismissedAt).toBeLessThanOrEqual(afterTime)
    })

    it('handles corrupted stored data gracefully', () => {
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, 'not-json')

      // Should not throw and should reset to count 1
      expect(() => recordPromptDismissal()).not.toThrow()

      const storedCall = localStorageMock.setItem.mock.calls.find(
        (call: string[]) => call[0] === PROMPT_DISMISSAL_KEY
      )
      const stored = JSON.parse(storedCall![1])
      expect(stored.count).toBe(1)
    })
  })

  // ===========================================================================
  // resetPromptDismissals tests
  // ===========================================================================

  describe('resetPromptDismissals', () => {
    it('removes dismissal data from localStorage', () => {
      const data = { count: 3, lastDismissedAt: Date.now() }
      localStorageMock.setItem(PROMPT_DISMISSAL_KEY, JSON.stringify(data))

      resetPromptDismissals()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(PROMPT_DISMISSAL_KEY)
    })
  })

  // ===========================================================================
  // urlBase64ToUint8Array tests
  // ===========================================================================

  describe('urlBase64ToUint8Array', () => {
    it('converts base64url string to Uint8Array', () => {
      // A simple base64url-encoded string
      const base64 = 'SGVsbG8' // "Hello" in base64
      const result = urlBase64ToUint8Array(base64)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles base64url characters (- and _)', () => {
      // Base64url uses - instead of + and _ instead of /
      const base64url = 'SGVs-W8_' // Contains base64url characters
      expect(() => urlBase64ToUint8Array(base64url)).not.toThrow()
    })

    it('adds padding when necessary', () => {
      // Test string without proper padding
      const unpadded = 'SGVsbG8' // Missing padding =
      const result = urlBase64ToUint8Array(unpadded)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  // ===========================================================================
  // requestPermission tests
  // ===========================================================================

  describe('requestPermission', () => {
    it('requests permission and returns granted', async () => {
      ;(global.Notification as any).requestPermission = vi
        .fn()
        .mockResolvedValue('granted')

      const result = await requestPermission()

      expect(global.Notification.requestPermission).toHaveBeenCalled()
      expect(result).toBe('granted')
    })

    it('returns denied when permission is denied', async () => {
      ;(global.Notification as any).requestPermission = vi
        .fn()
        .mockResolvedValue('denied')

      const result = await requestPermission()
      expect(result).toBe('denied')
    })

    it('returns denied when push is not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      })

      const result = await requestPermission()
      expect(result).toBe('denied')

      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      })
    })

    it('handles errors gracefully', async () => {
      ;(global.Notification as any).requestPermission = vi
        .fn()
        .mockRejectedValue(new Error('Permission request failed'))

      const result = await requestPermission()
      expect(result).toBe('denied')
    })
  })

  // ===========================================================================
  // getVapidPublicKey tests
  // ===========================================================================

  describe('getVapidPublicKey', () => {
    it('fetches VAPID public key from backend', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ vapid_public_key: 'test-vapid-key-123' }),
      })

      const result = await getVapidPublicKey()

      expect(result).toBe('test-vapid-key-123')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/vapid-public-key'),
        expect.any(Object)
      )
    })
  })

  // ===========================================================================
  // getCurrentSubscription tests
  // ===========================================================================

  describe('getCurrentSubscription', () => {
    it('returns null when no subscription exists', async () => {
      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      const result = await getCurrentSubscription()
      expect(result).toBeNull()
    })

    it('returns existing subscription', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      const result = await getCurrentSubscription()
      expect(result).toBe(mockSubscription)
    })

    it('handles errors gracefully', async () => {
      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.reject(new Error('Service worker error')),
        configurable: true,
      })

      const result = await getCurrentSubscription()
      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // subscribeToNotifications tests
  // ===========================================================================

  describe('subscribeToNotifications', () => {
    beforeEach(() => {
      // Setup successful API responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ vapid_public_key: 'test-vapid-key' }),
      })
    })

    it('requests notification permission if not already granted', async () => {
      ;(global.Notification as any).permission = 'default'
      ;(global.Notification as any).requestPermission = vi
        .fn()
        .mockResolvedValue('granted')

      const mockSubscription = {
        endpoint: 'https://push.example.com/abc',
        toJSON: () => ({
          endpoint: 'https://push.example.com/abc',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      await subscribeToNotifications()

      expect(global.Notification.requestPermission).toHaveBeenCalled()
    })

    it('returns null when permission is denied', async () => {
      ;(global.Notification as any).permission = 'default'
      ;(global.Notification as any).requestPermission = vi
        .fn()
        .mockResolvedValue('denied')

      const result = await subscribeToNotifications()
      expect(result).toBeNull()
    })

    it('returns existing subscription if already subscribed', async () => {
      ;(global.Notification as any).permission = 'granted'

      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({
          endpoint: 'https://push.example.com/existing',
          keys: { p256dh: 'existing-key', auth: 'existing-auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(existingSubscription),
        subscribe: vi.fn(),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      const result = await subscribeToNotifications()

      expect(result).toBe(existingSubscription)
      expect(mockPushManager.subscribe).not.toHaveBeenCalled()
    })

    it('creates new subscription with correct VAPID key', async () => {
      ;(global.Notification as any).permission = 'granted'

      const newSubscription = {
        endpoint: 'https://push.example.com/new',
        toJSON: () => ({
          endpoint: 'https://push.example.com/new',
          keys: { p256dh: 'new-key', auth: 'new-auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(newSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      await subscribeToNotifications()

      expect(mockPushManager.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          userVisibleOnly: true,
          applicationServerKey: expect.any(Uint8Array),
        })
      )
    })

    it('registers subscription with backend', async () => {
      ;(global.Notification as any).permission = 'granted'

      const newSubscription = {
        endpoint: 'https://push.example.com/new',
        toJSON: () => ({
          endpoint: 'https://push.example.com/new',
          keys: { p256dh: 'new-key', auth: 'new-auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(newSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      // Mock both API calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ vapid_public_key: 'test-vapid-key' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'device-id', is_active: true }),
        })

      await subscribeToNotifications()

      // Check that POST to /devices was called
      const deviceCall = mockFetch.mock.calls.find(
        (call: any[]) =>
          call[0].includes('/devices') && call[1]?.method === 'POST'
      )
      expect(deviceCall).toBeDefined()
    })

    it('returns null when push is not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      })

      const result = await subscribeToNotifications()
      expect(result).toBeNull()

      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      })
    })
  })

  // ===========================================================================
  // unsubscribeFromNotifications tests
  // ===========================================================================

  describe('unsubscribeFromNotifications', () => {
    it('unsubscribes existing subscription', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true)
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        unsubscribe: mockUnsubscribe,
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      mockFetch.mockResolvedValue({ ok: true })

      await unsubscribeFromNotifications()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('does not throw when no subscription exists', async () => {
      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      await expect(unsubscribeFromNotifications()).resolves.not.toThrow()
    })

    it('notifies backend of unsubscription', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true)
      const mockSubscription = {
        endpoint: 'https://push.example.com/to-remove',
        unsubscribe: mockUnsubscribe,
        toJSON: () => ({
          endpoint: 'https://push.example.com/to-remove',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      mockFetch.mockResolvedValue({ ok: true })

      await unsubscribeFromNotifications()

      // Check that DELETE was called
      const deleteCall = mockFetch.mock.calls.find(
        (call: any[]) => call[1]?.method === 'DELETE'
      )
      expect(deleteCall).toBeDefined()
    })

    it('continues even if backend notification fails', async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true)
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
        unsubscribe: mockUnsubscribe,
        toJSON: () => ({
          endpoint: 'https://push.example.com/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      // Backend call fails
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Should not throw
      await expect(unsubscribeFromNotifications()).resolves.not.toThrow()
      // But should still unsubscribe locally
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // isSubscribed tests
  // ===========================================================================

  describe('isSubscribed', () => {
    it('returns true when subscription exists', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/test',
      }

      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      const result = await isSubscribed()
      expect(result).toBe(true)
    })

    it('returns false when no subscription exists', async () => {
      const mockPushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
      }

      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.resolve({ pushManager: mockPushManager }),
        configurable: true,
      })

      const result = await isSubscribed()
      expect(result).toBe(false)
    })
  })
})

// ===========================================================================
// registerSubscription tests
// ===========================================================================

describe('registerSubscription', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('sends correct payload to backend', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'device-id' }),
    })

    const mockSubscription = {
      endpoint: 'https://push.example.com/register-test',
      toJSON: () => ({
        endpoint: 'https://push.example.com/register-test',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      }),
    } as unknown as PushSubscription

    await registerSubscription(mockSubscription)

    const postCall = mockFetch.mock.calls.find(
      (call: any[]) => call[1]?.method === 'POST'
    )

    expect(postCall).toBeDefined()
    const body = JSON.parse(postCall![1].body)
    expect(body.endpoint).toBe('https://push.example.com/register-test')
    expect(body.p256dh_key).toBe('p256dh-key')
    expect(body.auth_key).toBe('auth-key')
  })

  it('throws error for invalid subscription', async () => {
    const mockSubscription = {
      endpoint: null,
      toJSON: () => ({
        endpoint: null,
        keys: null,
      }),
    } as unknown as PushSubscription

    await expect(registerSubscription(mockSubscription)).rejects.toThrow(
      'Invalid subscription'
    )
  })

  it('includes user agent in payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'device-id' }),
    })

    const mockSubscription = {
      endpoint: 'https://push.example.com/test',
      toJSON: () => ({
        endpoint: 'https://push.example.com/test',
        keys: { p256dh: 'key', auth: 'auth' },
      }),
    } as unknown as PushSubscription

    await registerSubscription(mockSubscription)

    const postCall = mockFetch.mock.calls.find(
      (call: any[]) => call[1]?.method === 'POST'
    )

    const body = JSON.parse(postCall![1].body)
    expect(body.user_agent).toBeDefined()
  })
})

// ===========================================================================
// Edge Cases and Error Handling
// ===========================================================================

describe('Edge Cases', () => {
  it('handles localStorage being unavailable', () => {
    const originalLocalStorage = global.localStorage
    ;(global as any).localStorage = undefined

    // These should not throw
    expect(() => shouldShowPrompt()).not.toThrow()
    expect(() => recordPromptDismissal()).not.toThrow()
    expect(() => resetPromptDismissals()).not.toThrow()

    ;(global as any).localStorage = originalLocalStorage
  })

  it('handles window being undefined (SSR)', () => {
    const originalWindow = global.window
    ;(global as any).window = undefined

    expect(isPushSupported()).toBe(false)
    expect(shouldShowPrompt()).toBe(false)

    ;(global as any).window = originalWindow
  })

  it('handles service worker registration failure', async () => {
    Object.defineProperty(navigator.serviceWorker, 'ready', {
      value: Promise.reject(new Error('Registration failed')),
      configurable: true,
    })

    const result = await getCurrentSubscription()
    expect(result).toBeNull()
  })
})
