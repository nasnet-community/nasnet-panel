/**
 * Button Component
 *
 * Primary interactive element for triggering actions.
 * Supports loading states, multiple variants, and sizes.
 *
 * Accessibility:
 * - Uses aria-busy during loading state
 * - Automatically disabled during loading to prevent double-submission
 * - Maintains button width during loading to prevent layout shift
 *
 * @module @nasnet/ui/primitives/button
 */

import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';
import { Spinner } from '../spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md',
        action:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover hover:shadow-md',
        destructive:
          'bg-error text-error-foreground shadow-sm hover:bg-error-hover hover:shadow-md',
        outline:
          'border-2 border-border bg-transparent shadow-sm hover:bg-accent hover:border-border',
        ghost:
          'bg-transparent hover:bg-accent',
        link:
          'text-primary underline-offset-4 hover:underline',
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
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
  /** Show loading spinner and disable the button */
  isLoading?: boolean;
  /** Text to show during loading (replaces children) */
  loadingText?: string;
}

/**
 * Button Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants
 * <Button variant="destructive">Delete</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 *
 * // Loading state
 * <Button isLoading>Saving</Button>
 * <Button isLoading loadingText="Saving...">Save</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Determine spinner size based on button size
    const spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'sm' : 'sm';

    // When loading, disable the button and show spinner
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={spinnerSize} className="mr-1" label={loadingText || 'Loading'} />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
