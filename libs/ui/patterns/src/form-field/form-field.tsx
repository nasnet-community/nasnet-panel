import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

export interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, description, error, required, children, className, id }, ref) => {
    const fieldId = id || React.useId();
    const descriptionId = `${fieldId}-description`;
    const errorId = `${fieldId}-error`;

    return (
      <div ref={ref} className={cn('space-y-2.5', className)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error ? 'text-error' : 'text-slate-700 dark:text-slate-300'
          )}
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
        <div>
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, {
                id: fieldId,
                'aria-describedby': error ? errorId : description ? descriptionId : undefined,
                'aria-invalid': !!error,
              })
            : children}
        </div>
        {error && (
          <p id={errorId} className="text-sm font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
