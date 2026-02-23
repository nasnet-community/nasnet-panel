import * as React from 'react';
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
 * Memoized FormField to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
declare const FormField: React.MemoExoticComponent<React.ForwardRefExoticComponent<FormFieldProps & React.RefAttributes<HTMLDivElement>>>;
export { FormField };
//# sourceMappingURL=form-field.d.ts.map