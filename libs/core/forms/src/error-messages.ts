/**
 * Custom Zod Error Messages with i18n Support
 *
 * Provides localized error messages for Zod validation.
 *
 * @module @nasnet/core/forms/error-messages
 */

import { z, type ZodErrorMap, ZodIssueCode, type ZodIssue } from 'zod';

/**
 * Translation function type.
 */
export type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>
) => string;

/**
 * Default English error messages.
 */
export const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  'validation.required': 'This field is required',
  'validation.string.min': 'Must be at least {{min}} characters',
  'validation.string.max': 'Must be at most {{max}} characters',
  'validation.string.length': 'Must be exactly {{length}} characters',
  'validation.number.min': 'Must be at least {{min}}',
  'validation.number.max': 'Must be at most {{max}}',
  'validation.number.int': 'Must be a whole number',
  'validation.number.positive': 'Must be a positive number',
  'validation.number.negative': 'Must be a negative number',
  'validation.email.invalid': 'Please enter a valid email address',
  'validation.url.invalid': 'Please enter a valid URL',
  'validation.date.invalid': 'Please enter a valid date',
  'validation.format.invalid': 'Invalid format',
  'validation.type.invalid': 'Expected {{expected}}',
  'validation.enum.invalid': 'Invalid option selected',
  'validation.union.invalid': 'Invalid input',
  'validation.array.min': 'Must have at least {{min}} items',
  'validation.array.max': 'Must have at most {{max}} items',
};

/**
 * Default translation function using template strings.
 */
function defaultTranslate(
  key: string,
  params?: Record<string, string | number>
): string {
  let message = DEFAULT_ERROR_MESSAGES[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(`{{${k}}}`, String(v));
    });
  }

  return message;
}

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
export function createZodErrorMap(
  t: TranslateFunction = defaultTranslate
): ZodErrorMap {
  return (issue: ZodIssue, ctx) => {
    let message: string;

    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === 'undefined' || issue.received === 'null') {
          message = t('validation.required');
        } else {
          message = t('validation.type.invalid', { expected: issue.expected });
        }
        break;

      case ZodIssueCode.too_small:
        if (issue.type === 'string') {
          if (issue.minimum === 1) {
            message = t('validation.required');
          } else {
            message = t('validation.string.min', { min: issue.minimum });
          }
        } else if (issue.type === 'number') {
          message = t('validation.number.min', { min: issue.minimum });
        } else if (issue.type === 'array') {
          message = t('validation.array.min', { min: issue.minimum });
        } else {
          message = ctx.defaultError;
        }
        break;

      case ZodIssueCode.too_big:
        if (issue.type === 'string') {
          message = t('validation.string.max', { max: issue.maximum });
        } else if (issue.type === 'number') {
          message = t('validation.number.max', { max: issue.maximum });
        } else if (issue.type === 'array') {
          message = t('validation.array.max', { max: issue.maximum });
        } else {
          message = ctx.defaultError;
        }
        break;

      case ZodIssueCode.invalid_string:
        switch (issue.validation) {
          case 'email':
            message = t('validation.email.invalid');
            break;
          case 'url':
            message = t('validation.url.invalid');
            break;
          case 'datetime':
            message = t('validation.date.invalid');
            break;
          case 'regex':
            message = t('validation.format.invalid');
            break;
          default:
            message = t('validation.format.invalid');
        }
        break;

      case ZodIssueCode.invalid_enum_value:
        message = t('validation.enum.invalid');
        break;

      case ZodIssueCode.invalid_union:
        message = t('validation.union.invalid');
        break;

      case ZodIssueCode.invalid_date:
        message = t('validation.date.invalid');
        break;

      case ZodIssueCode.not_finite:
        message = t('validation.number.positive');
        break;

      default:
        message = ctx.defaultError;
    }

    return { message };
  };
}

/**
 * Sets the global Zod error map with the provided translation function.
 *
 * @param t - Translation function
 */
export function setGlobalErrorMap(t?: TranslateFunction): void {
  z.setErrorMap(createZodErrorMap(t));
}

/**
 * Format a validation error message for display.
 *
 * @param error - Error message or object
 * @returns Formatted error string
 */
export function formatValidationError(
  error: string | { message: string } | undefined
): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return error.message;
}
