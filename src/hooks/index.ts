/**
 * Custom hooks for the Scoreboard Manager application.
 *
 * These hooks provide reusable functionality for:
 * - Authentication guards (useAuthGuard)
 * - Abortable fetch requests (useAbortableFetch)
 * - Timeout management (useTimeoutRef)
 * - Infinite scrolling (useInfiniteScroll)
 * - Undo queue (useUndoQueue)
 */

// Auth & Navigation
export { useAuthGuard } from './useAuthGuard';

// Data Fetching
export { useAbortableFetch } from './useAbortableFetch';

// UI & Interactions
export { useInfiniteScroll } from './useInfiniteScroll';
export { useUndoQueue } from './useUndoQueue';

// Utilities
export { useTimeoutRef } from './useTimeoutRef';

// Pricing
export { useDynamicPricing } from './useDynamicPricing';
