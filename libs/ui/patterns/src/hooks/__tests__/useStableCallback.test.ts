import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  useStableCallback,
  useStableEventHandler,
  useStableCallbackWithDeps,
  useDebouncedCallback,
  useThrottledCallback,
} from '../useStableCallback';

describe('useStableCallback', () => {
  it('should maintain stable identity across re-renders', () => {
    let count = 0;
    const { result, rerender } = renderHook(() => useStableCallback(() => count));

    const firstCallback = result.current;

    count = 10;
    rerender();

    expect(result.current).toBe(firstCallback);
  });

  it('should call latest version of callback', () => {
    let value = 'initial';
    const { result, rerender } = renderHook(() => useStableCallback(() => value));

    expect(result.current()).toBe('initial');

    value = 'updated';
    rerender();

    expect(result.current()).toBe('updated');
  });

  it('should pass arguments correctly', () => {
    const { result } = renderHook(() => useStableCallback((a: number, b: number) => a + b));

    expect(result.current(2, 3)).toBe(5);
  });

  it('should work with async callbacks', async () => {
    const mockAsync = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useStableCallback(async () => mockAsync()));

    await result.current();
    expect(mockAsync).toHaveBeenCalled();
  });
});

describe('useStableEventHandler', () => {
  it('should prevent default', () => {
    const mockHandler = vi.fn();
    const { result } = renderHook(() => useStableEventHandler(mockHandler));

    const mockEvent = {
      preventDefault: vi.fn(),
    };

    result.current(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
  });

  it('should maintain stable identity', () => {
    let value = 0;
    const { result, rerender } = renderHook(() =>
      useStableEventHandler(() => {
        value++;
      })
    );

    const firstCallback = result.current;
    rerender();

    expect(result.current).toBe(firstCallback);
  });
});

describe('useStableCallbackWithDeps', () => {
  it('should maintain identity when deps unchanged', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useStableCallbackWithDeps(() => dep, [dep]),
      { initialProps: { dep: 'same' } }
    );

    const firstCallback = result.current;
    rerender({ dep: 'same' });

    expect(result.current).toBe(firstCallback);
  });

  it('should change identity when deps change', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useStableCallbackWithDeps(() => dep, [dep]),
      { initialProps: { dep: 'initial' } }
    );

    const firstCallback = result.current;
    rerender({ dep: 'changed' });

    expect(result.current).not.toBe(firstCallback);
  });

  it('should call latest callback', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStableCallbackWithDeps(() => value, []),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current()).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current()).toBe('updated');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce multiple calls', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockFn, 100));

    result.current();
    result.current();
    result.current();

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should call with latest arguments', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockFn, 100));

    result.current('first');
    result.current('second');
    result.current('third');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockFn).toHaveBeenCalledWith('third');
  });

  it('should reset timer on new call', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockFn, 100));

    result.current();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    result.current();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const mockFn = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(mockFn, 100));

    result.current();
    unmount();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should not call after unmount
    expect(mockFn).not.toHaveBeenCalled();
  });
});

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call immediately on first invocation', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(mockFn, 100));

    result.current('first');

    expect(mockFn).toHaveBeenCalledWith('first');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throttle subsequent calls', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(mockFn, 100));

    result.current('first');
    result.current('second');
    result.current('third');

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenLastCalledWith('first');
  });

  it('should allow call after delay', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(mockFn, 100));

    result.current('first');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    result.current('second');

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('second');
  });

  it('should call trailing edge', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(mockFn, 100));

    result.current('first');
    result.current('second');

    expect(mockFn).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('second');
  });
});
