/**
 * useClipboard Hook
 *
 * Provides clipboard copy functionality with visual feedback.
 * Uses native Clipboard API with fallback for older browsers.
 *
 * @example
 * ```tsx
 * const { copy, copied, error, reset } = useClipboard();
 *
 * <Button onClick={() => copy('192.168.1.1')}>
 *   {copied ? <Check /> : <Copy />}
 * </Button>
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Configuration options for useClipboard hook
 */
export interface UseClipboardOptions {
  /**
   * Duration in ms before copied state resets
   * @default 2000
   */
  timeout?: number;

  /**
   * Callback fired on successful copy
   */
  onSuccess?: (value: string) => void;

  /**
   * Callback fired on copy failure
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useClipboard hook
 */
export interface UseClipboardReturn {
  /**
   * Copy text to clipboard
   */
  copy: (value: string) => Promise<boolean>;

  /**
   * Whether content was recently copied
   */
  copied: boolean;

  /**
   * Error from last copy attempt, if any
   */
  error: Error | null;

  /**
   * Reset the copied state immediately
   */
  reset: () => void;

  /**
   * Whether a copy operation is in progress
   */
  isLoading: boolean;
}

/**
 * Standard timeout duration for copied state (matches toast duration)
 */
export const CLIPBOARD_TIMEOUT_MS = 2000;

/**
 * Fallback copy method for browsers without Clipboard API
 */
function fallbackCopyText(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = '0';
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }

  document.body.removeChild(textArea);
  return success;
}

/**
 * Hook for copying text to clipboard with visual feedback
 *
 * Features:
 * - Modern Clipboard API as primary method
 * - Fallback using execCommand for older browsers
 * - Auto-reset copied state after timeout
 * - Error handling with graceful fallback
 * - Callback support for success/error
 *
 * @param options - Configuration options
 * @returns Clipboard utilities and state
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = CLIPBOARD_TIMEOUT_MS, onSuccess, onError } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Reset copied state and clear any pending timeout
   */
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCopied(false);
    setError(null);
  }, []);

  /**
   * Copy text to clipboard
   */
  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(value);
        } else {
          // Fall back to execCommand for older browsers
          const success = fallbackCopyText(value);
          if (!success) {
            throw new Error('Failed to copy using fallback method');
          }
        }

        setCopied(true);
        setIsLoading(false);

        // Schedule reset after timeout
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, timeout);

        // Fire success callback
        onSuccess?.(value);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);
        setCopied(false);
        setIsLoading(false);

        // Fire error callback
        onError?.(error);
        return false;
      }
    },
    [timeout, onSuccess, onError]
  );

  return {
    copy,
    copied,
    error,
    reset,
    isLoading,
  };
}
