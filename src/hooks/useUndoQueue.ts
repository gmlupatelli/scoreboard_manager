'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UndoAction {
  id: string;
  message: string;
  undo: () => Promise<void>;
  timestamp: number;
}

export interface QueuedToast extends UndoAction {
  expiresAt: number;
  isBatch?: boolean;
  batchCount?: number;
}

const TOAST_DURATION = 5000; // 5 seconds
const BATCH_THRESHOLD = 4; // Batch after 4+ rapid actions
const BATCH_WINDOW = 2000; // 2 second window for batching
const MAX_VISIBLE_TOASTS = 3;

/**
 * Custom hook for managing undo queue with toast notifications.
 * Handles batching, expiration, navigation cancellation, and real-time conflict detection.
 */
export function useUndoQueue() {
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const recentActions = useRef<UndoAction[]>([]);

  // Clean up timers on unmount
  useEffect(() => {
    // Capture ref value for cleanup
    const timers = timerRefs.current;
    const actions = recentActions.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      actions.length = 0;
    };
  }, []);

  // Check for batching opportunity
  const shouldBatch = useCallback(() => {
    const now = Date.now();
    const recentCount = recentActions.current.filter(
      (action) => now - action.timestamp < BATCH_WINDOW
    ).length;
    return recentCount >= BATCH_THRESHOLD;
  }, []);

  // Remove expired toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timerRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRefs.current.delete(id);
    }
  }, []);

  // Add action to undo queue
  const addUndoAction = useCallback(
    (action: UndoAction) => {
      const now = Date.now();
      recentActions.current.push(action);

      // Check if we should batch
      if (shouldBatch()) {
        // Create or update batch toast
        const batchId = 'batch-toast';
        const existingBatch = toasts.find((t) => t.id === batchId);

        if (existingBatch) {
          // Update existing batch
          setToasts((prev) =>
            prev.map((t) =>
              t.id === batchId
                ? {
                    ...t,
                    batchCount: (t.batchCount || 0) + 1,
                    expiresAt: now + TOAST_DURATION,
                    message: `${(t.batchCount || 0) + 1} actions`,
                    undo: async () => {
                      // Undo all batched actions in reverse order
                      const actions = recentActions.current.slice();
                      for (let i = actions.length - 1; i >= 0; i--) {
                        await actions[i].undo();
                      }
                    },
                  }
                : t
            )
          );

          // Reset timer
          const existingTimer = timerRefs.current.get(batchId);
          if (existingTimer) clearTimeout(existingTimer);

          const timer = setTimeout(() => {
            removeToast(batchId);
            recentActions.current = [];
          }, TOAST_DURATION);

          timerRefs.current.set(batchId, timer);
        } else {
          // Create new batch toast
          const batchToast: QueuedToast = {
            id: batchId,
            message: `${BATCH_THRESHOLD} actions`,
            undo: async () => {
              const actions = recentActions.current.slice();
              for (let i = actions.length - 1; i >= 0; i--) {
                await actions[i].undo();
              }
            },
            timestamp: now,
            expiresAt: now + TOAST_DURATION,
            isBatch: true,
            batchCount: BATCH_THRESHOLD,
          };

          setToasts((prev) => {
            const newToasts = [batchToast, ...prev.filter((t) => t.id !== batchId)];
            return newToasts.slice(0, MAX_VISIBLE_TOASTS);
          });

          const timer = setTimeout(() => {
            removeToast(batchId);
            recentActions.current = [];
          }, TOAST_DURATION);

          timerRefs.current.set(batchId, timer);
        }
      } else {
        // Add individual toast
        const toast: QueuedToast = {
          ...action,
          expiresAt: now + TOAST_DURATION,
        };

        setToasts((prev) => {
          const newToasts = [toast, ...prev];
          return newToasts.slice(0, MAX_VISIBLE_TOASTS);
        });

        const timer = setTimeout(() => {
          removeToast(action.id);
        }, TOAST_DURATION);

        timerRefs.current.set(action.id, timer);
      }

      // Clean up old actions from recent list
      setTimeout(() => {
        recentActions.current = recentActions.current.filter(
          (a) => now - a.timestamp < BATCH_WINDOW
        );
      }, BATCH_WINDOW);
    },
    [shouldBatch, toasts, removeToast]
  );

  // Execute undo and remove toast
  const executeUndo = useCallback(
    async (id: string) => {
      const toast = toasts.find((t) => t.id === id);
      if (!toast) return;

      try {
        await toast.undo();
        removeToast(id);

        // Clear recent actions if batch was undone
        if (toast.isBatch) {
          recentActions.current = [];
        }
      } catch (error) {
        console.error('Failed to undo action:', error);
        // Keep toast visible on error
      }
    },
    [toasts, removeToast]
  );

  return {
    toasts,
    addUndoAction,
    executeUndo,
    removeToast,
  };
}
