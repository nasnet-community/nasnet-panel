/**
 * FormFieldDescription Component
 *
 * Displays help text for form fields with accessibility support.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import * as React from 'react';
export interface FormFieldDescriptionProps {
    /** The description text */
    children: React.ReactNode;
    /** ID for aria-describedby linkage */
    id?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show a help icon */
    showIcon?: boolean;
}
/**
 * Help text/description display for form fields.
 * Linked to inputs via aria-describedby.
 */
export declare const FormFieldDescription: React.ForwardRefExoticComponent<FormFieldDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
//# sourceMappingURL=FormFieldDescription.d.ts.map