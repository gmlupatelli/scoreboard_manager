'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UseTimeoutRefResult {
  /**
   * Set a timeout that will be automatically cleared on unmount.
   * @param callback - The function to call after the delay
   * @param delay - The delay in milliseconds
   * @param key - Optional key to identify this timeout. Allows managing multiple timeouts.
   * @returns The timeout ID
   */
  set: (callback: () => void, delay: number, key?: string) => NodeJS.Timeout;
  /**
   * Clear a specific timeout by key
   * @param key - The key of the timeout to clear
   */
  clear: (key: string) => void;
  /**
   * Clear all managed timeouts
   */
  clearAll: () => void;
  /**
   * Check if component is still mounted (useful for async operations)
   */
  isMounted: () => boolean;
}

/**
 * Hook for managing timeouts with automatic cleanup on unmount.
 * Prevents "setState on unmounted component" warnings and stale redirects.
 *
 * @example
 * const { set, clear, isMounted } = useTimeoutRef();
 *
 * // Simple redirect after delay
 * const handleSuccess = () => {
 *   setSuccess(true);
 *   set(() => router.push('/dashboard'), 2000, 'redirect');
 * };
 *
 * // Cancel if user navigates away
 * const handleCancel = () => {
 *   clear('redirect');
 * };
 *
 * @example
 * // Check mount status in async callback
 * const handleAsync = async () => {
 *   const result = await someAsyncOperation();
 *   if (isMounted()) {
 *     setData(result);
 *   }
 * };
 */
export function useTimeoutRef(): UseTimeoutRefResult {
  // Map of timeout keys to their IDs
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Track if component is mounted
  const isMountedRef = useRef(true);
  // Counter for generating unique keys when none provided
  const counterRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    // Capture ref value for cleanup
    const timeouts = timeoutsRef.current;

    return () => {
      isMountedRef.current = false;
      // Clear all timeouts on unmount
      timeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeouts.clear();
    };
  }, []);

  const clear = useCallback((key: string) => {
    const timeoutId = timeoutsRef.current.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(key);
    }
  }, []);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number, key?: string): NodeJS.Timeout => {
      const timeoutKey = key || `timeout-${++counterRef.current}`;

      // Clear any existing timeout with the same key
      clear(timeoutKey);

      const timeoutId = setTimeout(() => {
        // Only execute if still mounted
        if (isMountedRef.current) {
          // Remove from map before executing
          timeoutsRef.current.delete(timeoutKey);
          callback();
        }
      }, delay);

      timeoutsRef.current.set(timeoutKey, timeoutId);
      return timeoutId;
    },
    [clear]
  );

  const isMounted = useCallback(() => {
    return isMountedRef.current;
  }, []);

  return {
    set,
    clear,
    clearAll,
    isMounted,
  };
}
