/**
 * FormFieldDescription Component
 *
 * Displays help text for form fields with accessibility support.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import * as React from 'react';

import { HelpCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

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
export const FormFieldDescription = React.forwardRef<HTMLParagraphElement, FormFieldDescriptionProps>(
  ({ children, id, className, showIcon = false }, ref) => {
    return (
      <p
        ref={ref}
        id={id}
        className={cn(
          'flex items-start gap-1.5 text-sm text-muted-foreground',
          className
        )}
      >
        {showIcon && (
          <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/60" aria-hidden="true" />
        )}
        <span>{children}</span>
      </p>
    );
  }
);

FormFieldDescription.displayName = 'FormFieldDescription';
