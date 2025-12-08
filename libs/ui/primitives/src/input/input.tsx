import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const inputVariants = cva(
  'flex w-full rounded-xl border bg-white px-4 py-3 text-base transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:placeholder:text-slate-500',
  {
    variants: {
      variant: {
        default: 
          'border-slate-200 text-slate-900 shadow-sm dark:border-slate-700 dark:text-slate-50',
        error: 
          'border-red-300 text-slate-900 shadow-sm focus-visible:ring-red-500 dark:border-red-700 dark:text-slate-50',
      },
      inputSize: {
        default: 'h-11',
        sm: 'h-9 px-3 py-2 text-sm',
        lg: 'h-12 px-5 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ 
            variant: error ? 'error' : variant, 
            inputSize 
          }), 
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
