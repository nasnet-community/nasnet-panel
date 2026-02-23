/**
 * useRelativeTime Hook Tests
 * Tests for the relative time display hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRelativeTime } from './useRelativeTime';

describe('useRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string for null timestamp', () => {
    const { result } = renderHook(() => useRelativeTime(null));
    expect(result.current).toBe('');
  });

  it('should return empty string for undefined timestamp', () => {
    const { result } = renderHook(() => useRelativeTime(undefined));
    expect(result.current).toBe('');
  });

  it('should return "Updated just now" for timestamps < 5 seconds ago', () => {
    const now = new Date();
    const { result } = renderHook(() => useRelativeTime(now));
    expect(result.current).toBe('Updated just now');
  });

  it('should return seconds for timestamps between 5-59 seconds ago', () => {
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const { result } = renderHook(() => useRelativeTime(tenSecondsAgo));
    expect(result.current).toBe('Updated 10 seconds ago');
  });

  it('should return minutes for timestamps between 1-59 minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { result } = renderHook(() => useRelativeTime(fiveMinutesAgo));
    expect(result.current).toBe('Updated 5 minutes ago');
  });

  it('should return hours for timestamps > 60 minutes ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const { result } = renderHook(() => useRelativeTime(twoHoursAgo));
    expect(result.current).toBe('Updated 2 hours ago');
  });

  it('should use singular form for 1 second', () => {
    // Start with a timestamp 5 seconds old
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const { result } = renderHook(() => useRelativeTime(fiveSecondsAgo));

    // Verify initial state
    expect(result.current).toBe('Updated 5 seconds ago');

    // Advance time by 4 seconds (now 9 seconds old)
    vi.advanceTimersByTime(4000);

    // At 9 seconds, should still show seconds (not transitioned to minutes yet)
    expect(result.current).toContain('second');
  });

  it('should use singular form for 1 minute', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const { result } = renderHook(() => useRelativeTime(oneMinuteAgo));
    expect(result.current).toBe('Updated 1 minute ago');
  });

  it('should use singular form for 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { result } = renderHook(() => useRelativeTime(oneHourAgo));
    expect(result.current).toBe('Updated 1 hour ago');
  });

  it('should update relative time every second', async () => {
    const timestamp = new Date(Date.now() - 5000); // 5 seconds ago
    const { result } = renderHook(() => useRelativeTime(timestamp));

    expect(result.current).toBe('Updated 5 seconds ago');

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(result.current).toBe('Updated 6 seconds ago');
    });
  });

  it('should transition from "just now" to seconds', async () => {
    const timestamp = new Date();
    const { result } = renderHook(() => useRelativeTime(timestamp));

    expect(result.current).toBe('Updated just now');

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(result.current).toBe('Updated 5 seconds ago');
    });
  });

  it('should transition from seconds to minutes', async () => {
    const timestamp = new Date(Date.now() - 59000); // 59 seconds ago
    const { result } = renderHook(() => useRelativeTime(timestamp));

    expect(result.current).toBe('Updated 59 seconds ago');

    // Advance time by 1 second (now 60 seconds = 1 minute)
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(result.current).toBe('Updated 1 minute ago');
    });
  });

  it('should clean up interval on unmount', () => {
    const timestamp = new Date();
    const { unmount } = renderHook(() => useRelativeTime(timestamp));

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('should handle timestamp updates correctly', () => {
    const initialTimestamp = new Date(Date.now() - 10000);
    const { result, rerender } = renderHook(
      ({ timestamp }) => useRelativeTime(timestamp),
      {
        initialProps: { timestamp: initialTimestamp },
      }
    );

    expect(result.current).toBe('Updated 10 seconds ago');

    // Update to a more recent timestamp
    const newTimestamp = new Date(Date.now() - 5000);
    rerender({ timestamp: newTimestamp });

    expect(result.current).toBe('Updated 5 seconds ago');
  });
});
