/**
 * FormSubmitButton Component
 *
 * Submit button that integrates with React Hook Form state.
 * Automatically disabled when form is invalid or submitting.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import * as React from 'react';
import { type ButtonProps } from '@nasnet/ui/primitives';
export interface FormSubmitButtonProps extends Omit<ButtonProps, 'type'> {
    /** Loading state text */
    loadingText?: string;
    /** Whether to disable when form is invalid (even before submission) */
    disableOnInvalid?: boolean;
}
/**
 * Form submit button that automatically handles:
 * - Disabled state when submitting
 * - Disabled state when form is invalid (optional)
 * - Loading spinner during submission
 *
 * @example
 * ```tsx
 * <FormSubmitButton>
 *   Save Changes
 * </FormSubmitButton>
 *
 * <FormSubmitButton loadingText="Saving..." disableOnInvalid>
 *   Save Configuration
 * </FormSubmitButton>
 * ```
 */
export declare const FormSubmitButton: React.ForwardRefExoticComponent<FormSubmitButtonProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=FormSubmitButton.d.ts.map