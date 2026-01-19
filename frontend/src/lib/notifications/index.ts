/**
 * Push Notification Module
 *
 * Re-exports browser adapter and notification utilities
 */

// Browser adapter for dependency injection
export {
  type BrowserAdapter,
  defaultBrowserAdapter,
  getBrowserAdapter,
  setBrowserAdapter,
  resetBrowserAdapter,
  createMockAdapter,
} from './browser-adapter';
