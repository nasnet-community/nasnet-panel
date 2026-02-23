/**
 * Custom Zod Error Messages with i18n Support
 *
 * Provides localized error messages for Zod validation.
 *
 * @module @nasnet/core/forms/error-messages
 */
import { type ZodErrorMap } from 'zod';
/**
 * Translation function type.
 */
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;
/**
 * Default English error messages.
 */
export declare const DEFAULT_ERROR_MESSAGES: Record<string, string>;
/**
 * Creates a custom Zod error map that integrates with i18n.
 *
 * @param t - Translation function (defaults to built-in messages)
 * @returns Zod error map
 *
 * @example
 * ```typescript
 * // With react-i18next
 * import { useTranslation } from 'react-i18next';
 *
 * function Form() {
 *   const { t } = useTranslation('validation');
 *   const errorMap = createZodErrorMap(t);
 *
 *   // Use globally
 *   z.setErrorMap(errorMap);
 *
 *   // Or per-schema
 *   const schema = z.string().min(1);
 *   schema.parse('', { errorMap });
 * }
 * ```
 */
export declare function createZodErrorMap(t?: TranslateFunction): ZodErrorMap;
/**
 * Sets the global Zod error map with the provided translation function.
 *
 * @param t - Translation function
 */
export declare function setGlobalErrorMap(t?: TranslateFunction): void;
/**
 * Format a validation error message for display.
 *
 * @param error - Error message or object
 * @returns Formatted error string
 */
export declare function formatValidationError(error: string | {
    message: string;
} | undefined): string;
//# sourceMappingURL=error-messages.d.ts.map