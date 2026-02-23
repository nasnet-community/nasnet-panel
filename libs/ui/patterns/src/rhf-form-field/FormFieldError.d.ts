/**
 * FormFieldError Component
 *
 * Displays field-level validation errors with accessibility support.
 * Supports i18n-ready error messages.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import * as React from 'react';
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
export declare const FormFieldError: React.ForwardRefExoticComponent<FormFieldErrorProps & React.RefAttributes<HTMLParagraphElement>>;
//# sourceMappingURL=FormFieldError.d.ts.map