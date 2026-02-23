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
export declare const CLIPBOARD_TIMEOUT_MS = 2000;
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
export declare function useClipboard(options?: UseClipboardOptions): UseClipboardReturn;
//# sourceMappingURL=useClipboard.d.ts.map