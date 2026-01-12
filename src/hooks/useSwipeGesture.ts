'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  directionLockAngle?: number;
  disabled?: boolean;
  requireOnline?: boolean;
}

export interface SwipeGestureState {
  isSwiping: boolean;
  direction: 'left' | 'right' | null;
  progress: number; // 0-1
}

const SWIPE_THRESHOLD = 120; // px
const DIRECTION_LOCK_ANGLE = 35; // degrees
const PROGRESS_THROTTLE_MS = 33; // ~30fps

/**
 * Custom hook for handling swipe gestures with Pointer Events API (primary) and touch fallback.
 * Includes direction locking, progressive feedback, spring easing, and accessibility support.
 */
export function useSwipeGesture<T extends HTMLElement = HTMLDivElement>(
  options: SwipeGestureOptions = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = SWIPE_THRESHOLD,
    directionLockAngle = DIRECTION_LOCK_ANGLE,
    disabled = false,
    requireOnline = true,
  } = options;

  const elementRef = useRef<T>(null);
  const [swipeState, setSwipeState] = useState<SwipeGestureState>({
    isSwiping: false,
    direction: null,
    progress: 0,
  });

  // Track gesture state
  const gestureState = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isLocked: false,
    direction: null as 'left' | 'right' | null,
    pointerId: null as number | null,
    lastProgressUpdate: 0,
  });

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Check online status if required
  const isOnline = useCallback(() => {
    if (!requireOnline) return true;
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }, [requireOnline]);

  // Check if document is in RTL mode
  const isRTL = useCallback(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.dir === 'rtl';
  }, []);

  // Calculate swipe progress with throttling
  const updateProgress = useCallback(
    (deltaX: number) => {
      const now = Date.now();
      if (now - gestureState.current.lastProgressUpdate < PROGRESS_THROTTLE_MS) {
        return;
      }

      const progress = Math.min(Math.abs(deltaX) / threshold, 1);
      const direction = deltaX > 0 ? 'right' : 'left';

      setSwipeState({
        isSwiping: true,
        direction,
        progress: prefersReducedMotion() ? 0 : progress,
      });

      gestureState.current.lastProgressUpdate = now;
    },
    [threshold, prefersReducedMotion]
  );

  // Reset gesture state
  const resetGesture = useCallback(() => {
    gestureState.current = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isLocked: false,
      direction: null,
      pointerId: null,
      lastProgressUpdate: 0,
    };
    setSwipeState({
      isSwiping: false,
      direction: null,
      progress: 0,
    });
  }, []);

  // Handle gesture start
  const handleGestureStart = useCallback(
    (x: number, y: number, pointerId?: number) => {
      if (disabled || !isOnline()) return;

      gestureState.current = {
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        isLocked: false,
        direction: null,
        pointerId: pointerId ?? null,
        lastProgressUpdate: 0,
      };
    },
    [disabled, isOnline]
  );

  // Handle gesture move
  const handleGestureMove = useCallback(
    (x: number, y: number) => {
      if (disabled || !isOnline()) return;

      const state = gestureState.current;
      if (state.startX === 0) return;

      const deltaX = x - state.startX;
      const deltaY = y - state.startY;

      // Direction locking - only lock after significant movement
      if (!state.isLocked && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));

        // Lock to horizontal if angle is close to horizontal
        if (angle < directionLockAngle || angle > 180 - directionLockAngle) {
          state.isLocked = true;
          state.direction = deltaX > 0 ? 'right' : 'left';
        } else {
          // Not a horizontal swipe, cancel gesture
          resetGesture();
          return;
        }
      }

      // Update progress if locked to horizontal
      if (state.isLocked) {
        state.currentX = x;
        updateProgress(deltaX);
      }
    },
    [disabled, isOnline, directionLockAngle, resetGesture, updateProgress]
  );

  // Handle gesture end
  const handleGestureEnd = useCallback(() => {
    if (disabled || !isOnline()) {
      resetGesture();
      return;
    }

    const state = gestureState.current;
    const deltaX = state.currentX - state.startX;

    // Check if swipe threshold was met
    if (state.isLocked && Math.abs(deltaX) >= threshold) {
      // In RTL, swipe directions are semantically reversed
      const rtl = isRTL();
      const effectiveDirection = state.direction;

      if (effectiveDirection === 'left') {
        // Left swipe
        if (rtl && onSwipeRight) {
          onSwipeRight(); // In RTL, left swipe triggers right action
        } else if (!rtl && onSwipeLeft) {
          onSwipeLeft(); // In LTR, left swipe triggers left action
        }
      } else if (effectiveDirection === 'right') {
        // Right swipe
        if (rtl && onSwipeLeft) {
          onSwipeLeft(); // In RTL, right swipe triggers left action
        } else if (!rtl && onSwipeRight) {
          onSwipeRight(); // In LTR, right swipe triggers right action
        }
      }
    }

    resetGesture();
  }, [disabled, isOnline, isRTL, threshold, onSwipeLeft, onSwipeRight, resetGesture]);

  // Pointer Events handlers (primary)
  useEffect(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only handle touch/pen input
      if (e.pointerType === 'mouse') return;

      e.preventDefault();
      element.setPointerCapture(e.pointerId);
      handleGestureStart(e.clientX, e.clientY, e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerId !== gestureState.current.pointerId) return;
      handleGestureMove(e.clientX, e.clientY);
    };

    const handlePointerEnd = (e: PointerEvent) => {
      if (e.pointerId !== gestureState.current.pointerId) return;
      element.releasePointerCapture(e.pointerId);
      handleGestureEnd();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== gestureState.current.pointerId) return;
      element.releasePointerCapture(e.pointerId);
      resetGesture();
    };

    // Try Pointer Events first (modern browsers)
    if ('PointerEvent' in window) {
      element.addEventListener('pointerdown', handlePointerDown);
      element.addEventListener('pointermove', handlePointerMove);
      element.addEventListener('pointerup', handlePointerEnd);
      element.addEventListener('pointercancel', handlePointerCancel);

      return () => {
        element.removeEventListener('pointerdown', handlePointerDown);
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerEnd);
        element.removeEventListener('pointercancel', handlePointerCancel);
      };
    }

    // Fallback to Touch Events (old Android)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      handleGestureStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleGestureMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      handleGestureEnd();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', resetGesture);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', resetGesture);
    };
  }, [disabled, handleGestureStart, handleGestureMove, handleGestureEnd, resetGesture]);

  return {
    ref: elementRef,
    swipeState,
  };
}
