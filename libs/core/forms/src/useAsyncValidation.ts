/**
 * useAsyncValidation Hook
 *
 * Handles asynchronous validation with debouncing and cancellation.
 * Combines synchronous Zod validation with async server-side validation.
 *
 * @module @nasnet/core/forms/useAsyncValidation
 */

import { useCallback, useRef, useState } from 'react';

import type { UseAsyncValidationOptions, AsyncValidationResult } from './types';
import type { ZodSchema } from 'zod';

/**
 * Custom hook for asynchronous field validation with debouncing.
 *
 * Features:
 * - Runs synchronous Zod validation first
 * - Debounces async validation to reduce API calls
 * - Supports AbortController for request cancellation
 * - Automatically cancels pending validation on new input
 *
 * @template T - Zod schema type
 * @param options - Async validation configuration
 * @returns Async validation state and methods
 *
 * @example
 * ```tsx
 * const asyncValidation = useAsyncValidation({
 *   schema: z.string().email(),
 *   validateFn: async (email) => {
 *     const exists = await checkEmailExists(email);
 *     return exists ? 'Email already registered' : null;
 *   },
 *   debounceMs: 500,
 * });
 *
 * // In your component
 * <input
 *   onChange={(e) => asyncValidation.validate(e.target.value)}
 *   onBlur={() => asyncValidation.validate(value)}
 * />
 * {asyncValidation.isValidating && <Spinner />}
 * {asyncValidation.error && <Error>{asyncValidation.error}</Error>}
 * ```
 */
export function useAsyncValidation<T extends ZodSchema>({
  schema,
  validateFn,
  debounceMs = 300,
}: UseAsyncValidationOptions<T>): AsyncValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Cancel any pending validation.
   */
  const cancel = useCallback(() => {
    // Cancel pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsValidating(false);
  }, []);

  /**
   * Run validation with debouncing.
   */
  const validate = useCallback(
    (value: unknown) => {
      // Cancel any pending validation
      cancel();

      // First, run synchronous Zod validation
      const zodResult = schema.safeParse(value);
      if (!zodResult.success) {
        setError(zodResult.error.errors[0]?.message || 'Invalid value');
        return;
      }

      // Clear previous error if Zod passes
      setError(null);

      // Debounce async validation
      timeoutRef.current = setTimeout(async () => {
        setIsValidating(true);

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
          const asyncError = await validateFn(value);

          // Check if aborted before setting state
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setError(asyncError);
        } catch (err) {
          // Ignore aborted requests
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }

          // Check if aborted before setting error state
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setError('Validation failed');
        } finally {
          // Only update isValidating if not aborted
          if (!abortControllerRef.current?.signal.aborted) {
            setIsValidating(false);
          }
        }
      }, debounceMs);
    },
    [schema, validateFn, debounceMs, cancel]
  );

  return {
    isValidating,
    error,
    validate,
    cancel,
  };
}
