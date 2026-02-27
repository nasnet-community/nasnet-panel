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
export const FormFieldDescription = React.forwardRef<
  HTMLParagraphElement,
  FormFieldDescriptionProps
>(({ children, id, className, showIcon = false }, ref) => {
  return (
    <p
      ref={ref}
      id={id}
      className={cn('text-muted-foreground mt-1 flex items-start gap-1.5 text-xs', className)}
    >
      {showIcon && (
        <HelpCircle
          className="text-muted-foreground/60 mt-0.5 h-3 w-3 flex-shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </p>
  );
});

FormFieldDescription.displayName = 'FormFieldDescription';
