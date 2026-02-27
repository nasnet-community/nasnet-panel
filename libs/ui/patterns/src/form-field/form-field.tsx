import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

/**
 * FormFieldProps
 *
 * Props for the FormField component. Provides label, description, error,
 * and required state for accessible form fields.
 */
export interface FormFieldProps {
  /** Label text displayed above the field */
  label: string;
  /** Optional helper text displayed below the label */
  description?: string;
  /** Error message displayed below the field */
  error?: string;
  /** Whether the field is required (shows asterisk) */
  required?: boolean;
  /** Form input element(s) to wrap */
  children: React.ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** HTML id for the input element */
  id?: string;
}

/**
 * FormField base component with forwardRef for accessibility
 *
 * Provides semantic label, description, error message, and required indicator.
 * Automatically connects label to input via generated IDs and ARIA attributes.
 *
 * @example
 * ```tsx
 * <FormField label="Email" description="We'll never share this" required>
 *   <Input type="email" placeholder="you@example.com" />
 * </FormField>
 * ```
 */
const FormFieldBase = React.forwardRef<HTMLDivElement, FormFieldProps>(
  function FormFieldBaseComponent(
    { label, description, error, required, children, className, id },
    ref
  ) {
    const generatedId = React.useId();
    const fieldId = id || generatedId;
    const descriptionId = `${fieldId}-description`;
    const errorId = `${fieldId}-error`;

    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
      >
        <label
          htmlFor={fieldId}
          className={cn(
            'text-foreground text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
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
        <div>
          {React.isValidElement(children) ?
            React.cloneElement(
              children as React.ReactElement<{
                id?: string;
                'aria-describedby'?: string;
                'aria-invalid'?: boolean;
              }>,
              {
                id: fieldId,
                'aria-describedby':
                  error ? errorId
                  : description ? descriptionId
                  : undefined,
                'aria-invalid': !!error,
              }
            )
          : children}
        </div>
        {description && (
          <p
            id={descriptionId}
            className="text-muted-foreground mt-1 text-xs"
          >
            {description}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            className="text-error mt-1 text-xs font-medium"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormFieldBase.displayName = 'FormField';

/**
 * Memoized FormField to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
const FormField = React.memo(FormFieldBase);

export { FormField };
