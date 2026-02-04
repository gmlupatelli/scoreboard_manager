import { renderHook, act } from '@testing-library/react';
import { useTimeoutRef } from '../useTimeoutRef';

describe('useTimeoutRef', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should set a timeout and execute callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback, 1000, 'test-key');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clear a specific timeout by key', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback, 1000, 'test-key');
    });

    act(() => {
      jest.advanceTimersByTime(500);
      result.current.clear('test-key');
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear all timeouts', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback1, 1000, 'key1');
      result.current.set(callback2, 2000, 'key2');
    });

    act(() => {
      jest.advanceTimersByTime(500);
      result.current.clearAll();
      jest.advanceTimersByTime(2000);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('should only execute callback if component is still mounted', () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback, 1000, 'test-key');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should track mount state correctly', () => {
    const { result, unmount } = renderHook(() => useTimeoutRef());

    expect(result.current.isMounted()).toBe(true);

    unmount();

    expect(result.current.isMounted()).toBe(false);
  });

  it('should support multiple timeouts with different keys', () => {
    const callbacks = {
      callback1: jest.fn(),
      callback2: jest.fn(),
      callback3: jest.fn(),
    };

    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callbacks.callback1, 1000, 'key1');
      result.current.set(callbacks.callback2, 2000, 'key2');
      result.current.set(callbacks.callback3, 3000, 'key3');
    });

    // First timeout fires
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callbacks.callback1).toHaveBeenCalledTimes(1);
    expect(callbacks.callback2).not.toHaveBeenCalled();
    expect(callbacks.callback3).not.toHaveBeenCalled();

    // Clear second timeout
    result.current.clear('key2');

    // Third timeout fires
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(callbacks.callback1).toHaveBeenCalledTimes(1);
    expect(callbacks.callback2).not.toHaveBeenCalled();
    expect(callbacks.callback3).toHaveBeenCalledTimes(1);
  });

  it('should handle clearing non-existent timeouts gracefully', () => {
    const { result } = renderHook(() => useTimeoutRef());

    expect(() => {
      result.current.clear('non-existent-key');
    }).not.toThrow();
  });

  it('should allow replacing an existing timeout', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback1, 1000, 'key');
      jest.advanceTimersByTime(500);
      result.current.set(callback2, 1000, 'key'); // Replace with same key
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should clean up on unmount', () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback, 1000, 'key');
    });

    unmount();

    // Accessing after unmount should not throw
    expect(() => {
      result.current.isMounted();
    }).not.toThrow();
  });
});
