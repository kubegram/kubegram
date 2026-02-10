/**
 * Storage key for canvas persistence
 */
export const CANVAS_STORAGE_KEY = 'x-kubegram-canvas';

/**
 * Default canvas dimensions
 */
export const DEFAULT_CANVAS_SIZE = {
  width: 10000,
  height: 10000,
} as const;

/**
 * Default viewport dimensions (accounting for sidebar and header)
 */
export const DEFAULT_VIEWPORT_DIMENSIONS = {
  width: window.innerWidth - 256, // Default with sidebar
  height: window.innerHeight - 64, // Default with header
} as const;

/**
 * Cookie expiration time in milliseconds (30 days)
 */
export const COOKIE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;
