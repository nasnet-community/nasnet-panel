/**
 * Button Component
 *
 * Primary interactive element for triggering actions across the application.
 * Supports 7 variants (default, action, secondary, destructive, outline, ghost, link),
 * 4 sizes (default, sm, lg, icon), and built-in loading state management.
 *
 * Features:
 * - Multiple semantic variants for different interaction contexts
 * - Built-in loading spinner with customizable text
 * - Automatic width management to prevent layout shift
 * - Can render as any element via asChild + Radix Slot
 * - Responsive spacing based on platform (mobile/tablet/desktop)
 *
 * Accessibility:
 * - aria-busy set during loading to indicate processing state
 * - aria-disabled managed for semantic HTML
 * - Automatic focus indicators with ring styling
 * - Keyboard accessible (Enter/Space to activate)
 * - Icon buttons should include aria-label when icon-only
 * - 44px minimum touch target on mobile devices
 *
 * @module @nasnet/ui/primitives/button
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants for different contexts
 * <Button variant="default">Save Changes</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 * <Button variant="ghost">Dismiss</Button>
 * <Button variant="link">Learn more</Button>
 *
 * // Loading state (spinner shows, button disables)
 * <Button isLoading>Saving...</Button>
 * <Button isLoading loadingText="Applying config...">
 *   Apply Configuration
 * </Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon" aria-label="Close dialog">
 *   <X className="h-4 w-4" />
 * </Button>
 *
 * // Render as link
 * <Button asChild variant="outline">
 *   <a href="/dashboard">Go to Dashboard</a>
 * </Button>
 * ```
 */

import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';
import { Spinner } from '../spinner';

const buttonVariants = cva(
  'focus-visible:ring-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--semantic-radius-button)] text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        action: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        destructive: 'bg-error text-error-foreground hover:bg-error-hover',
        outline: 'border-border hover:bg-accent border bg-transparent',
        ghost: 'hover:bg-muted text-foreground bg-transparent',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2.5',
        sm: 'h-8 px-4 text-xs',
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

/**
 * Props for the Button component
 * @template T - HTML button element or other element via asChild
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as a different element using Radix Slot.
   * Useful for rendering as links or custom components.
   * @default false
   */
  asChild?: boolean;
  /**
   * Show loading spinner and disable the button.
   * Prevents user interaction while operation is in progress.
   * Sets aria-busy="true" for accessibility.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Text to show during loading state.
   * If not provided, uses children content.
   * Useful for showing different text like "Saving..." or "Applying...".
   * Recommended for accessibility to indicate action in progress.
   */
  loadingText?: string;
  /**
   * Additional CSS classes to apply to the button.
   * Merged with computed variant and size classes using cn() utility.
   */
  className?: string;
}

/**
 * Button component - Primary interactive element for user actions
 */
const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
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
      const spinnerSize =
        size === 'sm' ? 'sm'
        : size === 'lg' ? 'md'
        : 'sm';

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
          {isLoading ?
            <>
              <Spinner
                size={spinnerSize}
                className="mr-1"
                label={loadingText || 'Loading'}
              />
              <span>{loadingText || children}</span>
            </>
          : children}
        </Comp>
      );
    }
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
