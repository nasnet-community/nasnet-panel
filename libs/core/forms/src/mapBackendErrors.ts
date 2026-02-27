/**
 * Backend Error Mapping Utilities
 *
 * Maps backend validation errors to React Hook Form field errors.
 * Handles nested field paths for complex form structures.
 *
 * @module @nasnet/core/forms/mapBackendErrors
 */

import type { ValidationError } from './types';
import type { UseFormSetError, FieldPath, FieldValues, UseFormClearErrors } from 'react-hook-form';

/**
 * Maps backend validation errors to React Hook Form field errors.
 * Handles nested paths like "peers.0.endpoint" correctly.
 *
 * @template T - Form field values type
 * @param errors - Array of backend validation errors
 * @param setError - React Hook Form setError function
 *
 * @example
 * ```tsx
 * const result = await validateMutation({ variables: { data } });
 *
 * if (!result.isValid) {
 *   mapBackendErrorsToForm(result.errors, form.setError);
 * }
 * ```
 */
export function mapBackendErrorsToForm<T extends FieldValues>(
  errors: ValidationError[],
  setError: UseFormSetError<T>
): void {
  errors.forEach((error) => {
    if (error.fieldPath) {
      setError(error.fieldPath as FieldPath<T>, {
        type: 'server',
        message: error.message,
      });
    }
  });
}

/**
 * Clears all server-type errors from the form.
 * Call this before re-validating to remove stale server errors.
 *
 * @template T - Form field values type
 * @param errors - Current form errors object
 * @param clearErrors - React Hook Form clearErrors function
 *
 * @example
 * ```tsx
 * // Before making a new API call
 * clearServerErrors(form.formState.errors, form.clearErrors);
 * ```
 */
export function clearServerErrors<T extends FieldValues>(
  errors: Record<string, { type?: string }>,
  clearErrors: UseFormClearErrors<T>
): void {
  Object.entries(errors).forEach(([field, error]) => {
    if (error?.type === 'server') {
      clearErrors(field as FieldPath<T>);
    }
  });
}

/**
 * Converts a backend error to a form-compatible error object.
 *
 * @param error - Backend validation error
 * @returns Object with type and message for React Hook Form
 *
 * @example
 * ```typescript
 * const error = toFormError({
 *   fieldPath: 'email',
 *   message: 'Email already exists'
 * });
 * // { type: 'server', message: 'Email already exists' }
 * ```
 */
export function toFormError(error: ValidationError): {
  type: string;
  message: string;
} {
  return {
    type: 'server',
    message: error.message,
  };
}

/**
 * Groups errors by field path for batch processing.
 *
 * @param errors - Array of backend validation errors
 * @returns Map of field paths to arrays of errors
 *
 * @example
 * ```typescript
 * const grouped = groupErrorsByField([
 *   { fieldPath: 'email', message: 'Already exists' },
 *   { fieldPath: 'email', message: 'Invalid format' },
 *   { fieldPath: 'name', message: 'Too short' }
 * ]);
 * // Map {
 * //   'email' => [{ fieldPath: 'email', message: 'Already exists' }, ...],
 * //   'name' => [{ fieldPath: 'name', message: 'Too short' }]
 * // }
 * ```
 */
export function groupErrorsByField(errors: ValidationError[]): Map<string, ValidationError[]> {
  const grouped = new Map<string, ValidationError[]>();

  errors.forEach((error) => {
    const path = error.fieldPath || '_root';
    const existing = grouped.get(path) || [];
    grouped.set(path, [...existing, error]);
  });

  return grouped;
}

/**
 * Creates a formatted error message from multiple errors on the same field.
 *
 * @param errors - Array of validation errors for a single field
 * @returns Combined error message joined with periods
 *
 * @example
 * ```typescript
 * const message = combineFieldErrors([
 *   { fieldPath: 'email', message: 'Already exists' },
 *   { fieldPath: 'email', message: 'Invalid domain' }
 * ]);
 * // "Already exists. Invalid domain"
 * ```
 */
export function combineFieldErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;

  return errors.map((e) => e.message).join('. ');
}
