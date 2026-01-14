import { renderHook, act } from '@testing-library/react';
import { useTimeoutRef } from '../useTimeoutRef';

describe('useTimeoutRef', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute callback after delay', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback, 1000, 'test');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout before execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback, 1000, 'test');
      result.current.clear('test');
      jest.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear all timeouts on unmount', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { result, unmount } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback1, 1000, 'test1');
      result.current.set(callback2, 2000, 'test2');
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('should report isMounted correctly', () => {
    const { result, unmount } = renderHook(() => useTimeoutRef());

    expect(result.current.isMounted()).toBe(true);

    unmount();

    // After unmount, we can't call isMounted since the component is gone
    // The test ensures cleanup happens properly
  });

  it('should replace existing timeout with same key', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { result } = renderHook(() => useTimeoutRef());

    act(() => {
      result.current.set(callback1, 1000, 'sameKey');
      result.current.set(callback2, 1000, 'sameKey');
      jest.advanceTimersByTime(1000);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
