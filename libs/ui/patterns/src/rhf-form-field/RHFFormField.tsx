/**
 * RHFFormField Component
 *
 * React Hook Form-integrated form field component.
 * Provides automatic error handling, accessibility, and field modes.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import * as React from 'react';

import {
  useFormContext,
  Controller,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Input, cn } from '@nasnet/ui/primitives';

import { FormFieldDescription } from './FormFieldDescription';
import { FormFieldError } from './FormFieldError';

/**
 * Field display modes
 */
export type FieldMode = 'editable' | 'readonly' | 'hidden' | 'computed';

export interface RHFFormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  /** Field name matching the form schema */
  name: Path<TFieldValues>;
  /** Label text */
  label: string;
  /** Help text/description */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Field display mode */
  mode?: FieldMode;
  /** Function to compute value from form values (for computed mode) */
  computeFn?: (values: TFieldValues) => string | number;
  /** Input placeholder */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the input */
  inputClassName?: string;
  /** Custom render function for the input */
  renderInput?: (props: {
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
    error: string | undefined;
    fieldId: string;
    mode: FieldMode;
  }) => React.ReactNode;
  /** Children to render as the input (alternative to renderInput) */
  children?: React.ReactNode;
  /** Form control instance (optional, uses context by default) */
  control?: import('react-hook-form').Control<TFieldValues>;
  /** Pre-resolved error message */
  error?: string;
  /** Hint text shown below the field */
  hint?: string;
}

/**
 * React Hook Form-aware form field component.
 *
 * Automatically integrates with useFormContext for validation and state.
 * Supports field modes (editable, readonly, hidden, computed) for flexible
 * field display logic. Provides full WCAG AAA accessibility with proper
 * ARIA attributes and semantic HTML.
 *
 * Features:
 * - Automatic error extraction from form state
 * - Field mode support (editable, readonly, hidden, computed)
 * - Custom input rendering via renderInput prop or children
 * - Proper ARIA labels, descriptions, and validation messages
 * - Dark mode support via CSS tokens
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RHFFormField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   description="We'll never share your email"
 *   required
 * />
 *
 * // With custom rendering
 * <RHFFormField
 *   name="country"
 *   label="Country"
 *   renderInput={({ field }) => (
 *     <Select {...field}>
 *       <option>USA</option>
 *       <option>Canada</option>
 *     </Select>
 *   )}
 * />
 *
 * // Computed field
 * <RHFFormField
 *   name="fullName"
 *   label="Full Name"
 *   mode="computed"
 *   computeFn={(values) => `${values.firstName} ${values.lastName}`}
 * />
 * ```
 *
 * @see {@link FieldMode} for field display modes
 */
export const RHFFormField = React.memo(function RHFFormField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  description,
  required = false,
  mode = 'editable',
  computeFn,
  placeholder,
  type = 'text',
  className,
  inputClassName,
  renderInput,
  children,
  control: controlProp,
  error: errorProp,
  hint,
}: RHFFormFieldProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  const control = React.useMemo(
    () => controlProp ?? formContext.control,
    [controlProp, formContext.control]
  );
  const watch = React.useMemo(() => formContext.watch, [formContext.watch]);
  const errors = React.useMemo(() => formContext.formState.errors, [formContext.formState.errors]);

  // Generate unique IDs for accessibility
  const fieldId = React.useId();
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  // Get nested error by path (memoized to avoid recreation on each render)
  const getNestedError = React.useCallback(
    (path: string): string | undefined => {
      const parts = path.split('.');
      let current: unknown = errors;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
      if (current && typeof current === 'object' && 'message' in current) {
        return (current as { message?: string }).message;
      }
      return undefined;
    },
    [errors]
  );

  const error = errorProp ?? getNestedError(name);

  // Build aria-describedby value
  const ariaDescribedBy =
    [error ? errorId : null, description ? descriptionId : null].filter(Boolean).join(' ') ||
    undefined;

  // Handle hidden mode
  if (mode === 'hidden') {
    return null;
  }

  // Get computed value if in computed mode
  const computedValue = mode === 'computed' && computeFn ? computeFn(watch()) : undefined;

  const isReadOnly = mode === 'readonly' || mode === 'computed';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          error ? 'text-error' : 'text-foreground'
        )}
      >
        {label}
        {required && (
          <span
            className="text-error ml-1"
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      {/* Input Field */}
      {children ?
        children
      : <Controller
          name={name}
          control={control}
          render={({ field }) => {
            // Allow custom rendering
            if (renderInput) {
              return <>{renderInput({ field, error, fieldId, mode })}</>;
            }

            // Default input rendering
            const inputValue = mode === 'computed' ? computedValue : field.value;

            return (
              <Input
                {...field}
                id={fieldId}
                type={type}
                placeholder={placeholder}
                value={inputValue ?? ''}
                readOnly={isReadOnly}
                disabled={mode === 'readonly'}
                aria-invalid={!!error}
                aria-describedby={ariaDescribedBy}
                aria-required={required}
                className={cn(
                  inputClassName,
                  isReadOnly && 'bg-muted cursor-not-allowed',
                  mode === 'computed' && 'bg-muted/50 italic',
                  error && 'border-error focus-visible:ring-error'
                )}
              />
            );
          }}
        />
      }

      {/* Description (after input) */}
      {description && !error && (
        <FormFieldDescription id={descriptionId}>{description}</FormFieldDescription>
      )}

      {/* Error Message */}
      {error && (
        <FormFieldError
          id={errorId}
          message={error}
        />
      )}

      {/* Hint text */}
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
});

RHFFormField.displayName = 'RHFFormField';
