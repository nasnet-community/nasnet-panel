/**
 * FormFieldError Component
 *
 * Displays field-level validation errors with accessibility support.
 * Supports i18n-ready error messages.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import * as React from 'react';

import { AlertCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

export interface FormFieldErrorProps {
  /** The error message to display */
  message?: string;
  /** ID for aria-describedby linkage */
  id?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show an icon */
  showIcon?: boolean;
}

/**
 * Error message display for form fields.
 * Integrates with WCAG AAA accessibility requirements.
 */
export const FormFieldError = React.forwardRef<HTMLParagraphElement, FormFieldErrorProps>(
  ({ message, id, className, showIcon = true }, ref) => {
    if (!message) return null;

    return (
      <p
        ref={ref}
        id={id}
        role="alert"
        aria-live="polite"
        className={cn('text-error mt-1 flex items-center gap-1.5 text-xs font-medium', className)}
      >
        {showIcon && (
          <AlertCircle
            className="h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
        )}
        <span>{message}</span>
      </p>
    );
  }
);

FormFieldError.displayName = 'FormFieldError';
