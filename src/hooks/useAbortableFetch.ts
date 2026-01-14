'use client';

import { useRef, useCallback, useEffect } from 'react';

interface FetchOptions extends RequestInit {
  /** Custom headers to merge with default headers */
  headers?: Record<string, string>;
}

interface UseAbortableFetchResult {
  /**
   * Execute a fetch request with automatic abort handling.
   * Previous pending requests to the same key are automatically aborted.
   * @param url - The URL to fetch
   * @param options - Fetch options (method, headers, body, etc.)
   * @param key - Optional key to track this request. Defaults to URL. Requests with the same key cancel each other.
   * @returns The fetch Response or null if aborted
   */
  execute: (url: string, options?: FetchOptions, key?: string) => Promise<Response | null>;
  /**
   * Abort a specific pending request by key
   * @param key - The key of the request to abort
   */
  abort: (key: string) => void;
  /**
   * Abort all pending requests
   */
  abortAll: () => void;
}

/**
 * Hook for making fetch requests with automatic abort handling.
 * Prevents race conditions by cancelling stale requests and handles cleanup on unmount.
 *
 * @example
 * const { execute, abortAll } = useAbortableFetch();
 *
 * const fetchData = async () => {
 *   const response = await execute('/api/data', { headers: authHeaders });
 *   if (response) { // null if aborted
 *     const data = await response.json();
 *     setData(data);
 *   }
 * };
 *
 * @example
 * // With custom key to prevent duplicate requests
 * const response = await execute('/api/search?q=test', { method: 'GET' }, 'search');
 */
export function useAbortableFetch(): UseAbortableFetchResult {
  // Map of request keys to their AbortControllers
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    // Capture ref value for cleanup
    const controllers = controllersRef.current;

    return () => {
      isMountedRef.current = false;
      // Abort all pending requests on unmount
      controllers.forEach((controller) => {
        controller.abort();
      });
      controllers.clear();
    };
  }, []);

  const abort = useCallback((key: string) => {
    const controller = controllersRef.current.get(key);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(key);
    }
  }, []);

  const abortAll = useCallback(() => {
    controllersRef.current.forEach((controller) => {
      controller.abort();
    });
    controllersRef.current.clear();
  }, []);

  const execute = useCallback(
    async (url: string, options: FetchOptions = {}, key?: string): Promise<Response | null> => {
      const requestKey = key || url;

      // Abort any existing request with the same key
      abort(requestKey);

      // Create new AbortController for this request
      const controller = new AbortController();
      controllersRef.current.set(requestKey, controller);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          credentials: options.credentials || 'include',
        });

        // Clean up controller after successful request
        controllersRef.current.delete(requestKey);

        return response;
      } catch (error) {
        // Clean up controller
        controllersRef.current.delete(requestKey);

        // If aborted, return null instead of throwing
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }

        // Re-throw other errors
        throw error;
      }
    },
    [abort]
  );

  return {
    execute,
    abort,
    abortAll,
  };
}
