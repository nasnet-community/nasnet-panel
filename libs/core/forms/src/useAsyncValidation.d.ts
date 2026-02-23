/**
 * useAsyncValidation Hook
 *
 * Handles asynchronous validation with debouncing and cancellation.
 * Combines synchronous Zod validation with async server-side validation.
 *
 * @module @nasnet/core/forms/useAsyncValidation
 */
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
export declare function useAsyncValidation<T extends ZodSchema>({ schema, validateFn, debounceMs, }: UseAsyncValidationOptions<T>): AsyncValidationResult;
//# sourceMappingURL=useAsyncValidation.d.ts.map