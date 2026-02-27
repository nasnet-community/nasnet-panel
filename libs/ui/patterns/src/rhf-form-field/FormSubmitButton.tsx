/**
 * FormSubmitButton Component
 *
 * Submit button that integrates with React Hook Form state.
 * Automatically disabled when form is invalid or submitting.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import * as React from 'react';

import { Loader2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Button, type ButtonProps } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/primitives';

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
export const FormSubmitButton = React.forwardRef<HTMLButtonElement, FormSubmitButtonProps>(
  (
    {
      children,
      loadingText = 'Submitting...',
      disableOnInvalid = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const {
      formState: { isSubmitting, isValid },
    } = useFormContext();

    // Button is disabled if:
    // - Explicitly disabled
    // - Form is submitting
    // - disableOnInvalid is true and form is invalid
    const isDisabled = disabled || isSubmitting || (disableOnInvalid && !isValid);

    return (
      <Button
        ref={ref}
        type="submit"
        disabled={isDisabled}
        variant="default"
        className={cn(
          'relative h-10 w-full sm:w-auto',
          isDisabled && 'opacity-50',
          isSubmitting && 'cursor-wait',
          className
        )}
        aria-busy={isSubmitting}
        aria-disabled={isDisabled}
        {...props}
      >
        {isSubmitting ?
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            <span>{loadingText}</span>
          </>
        : children}
      </Button>
    );
  }
);

FormSubmitButton.displayName = 'FormSubmitButton';
