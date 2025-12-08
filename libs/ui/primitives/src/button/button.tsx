import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-slate-900 shadow-sm hover:bg-primary-600 hover:shadow-md dark:bg-primary-500 dark:text-slate-900 dark:hover:bg-primary-400',
        action:
          'bg-primary-500 text-slate-900 shadow-sm hover:bg-primary-600 hover:shadow-md dark:bg-primary-500 dark:text-slate-900 dark:hover:bg-primary-400',
        secondary:
          'bg-secondary-500 text-white shadow-sm hover:bg-secondary-600 hover:shadow-md dark:bg-secondary-500 dark:hover:bg-secondary-400',
        destructive:
          'bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md dark:bg-red-500 dark:hover:bg-red-400',
        outline:
          'border-2 border-slate-200 bg-transparent shadow-sm hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600',
        ghost: 
          'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800',
        link: 
          'text-primary-500 underline-offset-4 hover:underline dark:text-primary-400',
      },
      size: {
        default: 'h-11 px-6 py-2.5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
