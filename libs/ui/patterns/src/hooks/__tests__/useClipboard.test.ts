/**
 * Tests for useClipboard hook
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useClipboard, CLIPBOARD_TIMEOUT_MS } from '../useClipboard';

describe('useClipboard', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock modern Clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('basic copy functionality', () => {
    it('copies text to clipboard using modern API', async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('192.168.1.1');
      });

      expect(mockWriteText).toHaveBeenCalledWith('192.168.1.1');
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('returns true on successful copy', async () => {
      const { result } = renderHook(() => useClipboard());

      let success = false;
      await act(async () => {
        success = await result.current.copy('test value');
      });

      expect(success).toBe(true);
    });

    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('timeout behavior', () => {
    it('resets copied state after default 2000ms timeout', async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS);
      });

      expect(result.current.copied).toBe(false);
    });

    it('respects custom timeout option', async () => {
      const customTimeout = 5000;
      const { result } = renderHook(() => useClipboard({ timeout: customTimeout }));

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      // Should still be copied after default timeout
      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS);
      });
      expect(result.current.copied).toBe(true);

      // Should reset after custom timeout
      act(() => {
        vi.advanceTimersByTime(customTimeout - CLIPBOARD_TIMEOUT_MS);
      });
      expect(result.current.copied).toBe(false);
    });

    it('cancels previous timeout when copying again', async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('first');
      });

      // Advance halfway through timeout
      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS / 2);
      });

      // Copy again
      await act(async () => {
        await result.current.copy('second');
      });

      expect(result.current.copied).toBe(true);

      // Original timeout would have expired, but new timeout should still be active
      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS / 2);
      });

      expect(result.current.copied).toBe(true);

      // Now advance full new timeout
      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS / 2);
      });

      expect(result.current.copied).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles clipboard permission errors', async () => {
      const permissionError = new Error('Permission denied');
      mockWriteText.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useClipboard());

      let success = false;
      await act(async () => {
        success = await result.current.copy('test');
      });

      expect(success).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(result.current.error).toEqual(permissionError);
    });

    it('handles non-Error rejections', async () => {
      mockWriteText.mockRejectedValue('string error');

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to copy to clipboard');
    });

    it('clears error on subsequent successful copy', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useClipboard());

      // First copy fails
      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.error).not.toBeNull();

      // Reset mock to succeed
      mockWriteText.mockResolvedValue(undefined);

      // Second copy succeeds
      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.copied).toBe(true);
    });
  });

  describe('reset functionality', () => {
    it('resets copied state immediately', async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.copied).toBe(false);
    });

    it('clears error on reset', async () => {
      mockWriteText.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it('cancels pending timeout on reset', async () => {
      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      act(() => {
        result.current.reset();
      });

      // Advancing time should not cause any state changes
      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS);
      });

      // State should remain reset
      expect(result.current.copied).toBe(false);
    });
  });

  describe('callback options', () => {
    it('calls onSuccess callback on successful copy', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useClipboard({ onSuccess }));

      await act(async () => {
        await result.current.copy('test value');
      });

      expect(onSuccess).toHaveBeenCalledWith('test value');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('calls onError callback on failed copy', async () => {
      const error = new Error('Copy failed');
      mockWriteText.mockRejectedValue(error);

      const onError = vi.fn();
      const { result } = renderHook(() => useClipboard({ onError }));

      await act(async () => {
        await result.current.copy('test');
      });

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('does not call onSuccess on failed copy', async () => {
      mockWriteText.mockRejectedValue(new Error('Error'));

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useClipboard({ onSuccess }));

      await act(async () => {
        await result.current.copy('test');
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('fallback behavior for legacy browsers', () => {
    // Store original clipboard to restore later
    let originalClipboard: Clipboard | undefined;

    beforeEach(() => {
      // Store and remove modern Clipboard API
      originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
      vi.restoreAllMocks();
    });

    it('uses execCommand fallback when Clipboard API is unavailable', async () => {
      const execCommand = vi.fn().mockReturnValue(true);
      document.execCommand = execCommand;

      // Create a proper mock textarea element
      const mockTextArea = document.createElement('textarea');
      const selectSpy = vi.spyOn(mockTextArea, 'select');
      const focusSpy = vi.spyOn(mockTextArea, 'focus');

      vi.spyOn(document, 'createElement').mockReturnValue(mockTextArea);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextArea);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextArea);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('fallback test');
      });

      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(result.current.copied).toBe(true);
    });

    it('handles fallback failure gracefully', async () => {
      const execCommand = vi.fn().mockReturnValue(false);
      document.execCommand = execCommand;

      const mockTextArea = document.createElement('textarea');
      vi.spyOn(document, 'createElement').mockReturnValue(mockTextArea);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextArea);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextArea);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('fallback test');
      });

      expect(result.current.copied).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });

  describe('loading state', () => {
    it('sets isLoading during copy operation', async () => {
      let resolvePromise: () => void;
      mockWriteText.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useClipboard());

      // Start copy operation
      let copyPromise: Promise<boolean>;
      act(() => {
        copyPromise = result.current.copy('test');
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!();
        await copyPromise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('clears isLoading on error', async () => {
      mockWriteText.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('clears timeout on unmount', async () => {
      const { result, unmount } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      // Unmount before timeout expires
      unmount();

      // This should not cause any errors or memory leaks
      act(() => {
        vi.advanceTimersByTime(CLIPBOARD_TIMEOUT_MS);
      });
    });
  });
});
