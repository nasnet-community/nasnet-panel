/**
 * Toast Component
 *
 * Notification component for displaying temporary messages to users.
 * Supports multiple variants (default, success, warning, error, info),
 * swipe-to-dismiss gestures, and auto-close functionality.
 *
 * Built on Radix UI Toast primitive with composable subcomponents:
 * - ToastProvider: Root provider (wraps entire app)
 * - ToastViewport: Container for all toasts
 * - Toast: Individual toast container
 * - ToastTitle: Toast title
 * - ToastDescription: Toast content
 * - ToastAction: Action button
 * - ToastClose: Close button
 *
 * Accessibility:
 * - Automatic ARIA live region announcements
 * - Keyboard accessible (Escape to close)
 * - Swipe gesture support on touch devices
 * - Screen reader friendly
 *
 * @module @nasnet/ui/primitives/toast
 * @example
 * ```tsx
 * // Setup (in app root)
 * <ToastProvider>
 *   <App />
 *   <ToastViewport />
 * </ToastProvider>
 *
 * // Usage with useToast hook
 * import { useToast } from '@nasnet/ui/primitives/toast';
 *
 * const { toast } = useToast();
 * toast({
 *   title: "Success",
 *   description: "Configuration saved successfully.",
 *   variant: "success",
 * });
 * ```
 */

import * as React from 'react';

import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../lib/utils';
import { Icon } from '../icon';

const ToastProvider = ToastPrimitives.Provider;

/**
 * Props for the ToastViewport component
 */
export interface ToastViewportProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> {}

/**
 * ToastViewport component - Container for all toast notifications
 */
const ToastViewport = React.memo(
  React.forwardRef<React.ElementRef<typeof ToastPrimitives.Viewport>, ToastViewportProps>(
    ({ className, ...props }, ref) => (
      <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
          'fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 md:max-w-[420px]',
          className
        )}
        {...props}
      />
    )
  )
);
ToastViewport.displayName = 'ToastViewport';

const toastVariants = cva(
  'gap-component-md border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-up group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:duration-300',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border-border',
        success: 'border-l-success bg-success-light text-success-dark border-l-4',
        warning: 'border-l-warning bg-warning-light text-warning-dark border-l-4',
        error: 'border-l-error bg-error-light text-error-dark border-l-4',
        info: 'border-l-info bg-info-light text-info-dark border-l-4',
        destructive: 'border-l-error bg-error-light text-error-dark border-l-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Props for the Toast component
 */
export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {}

/**
 * Toast component - Individual notification container
 */
const Toast = React.memo(
  React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
    ({ className, variant, ...props }, ref) => (
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      />
    )
  )
);
Toast.displayName = 'Toast';

/**
 * Props for the ToastAction component
 */
export interface ToastActionProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> {}

/**
 * ToastAction component - Action button for toast notifications
 */
const ToastAction = React.memo(
  React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, ToastActionProps>(
    ({ className, ...props }, ref) => (
      <ToastPrimitives.Action
        ref={ref}
        className={cn(
          'text-primary hover:text-primary-hover focus-visible:ring-ring inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--semantic-radius-button)] bg-transparent px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  )
);
ToastAction.displayName = 'ToastAction';

/**
 * Props for the ToastClose component
 */
export interface ToastCloseProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {}

/**
 * ToastClose component - Close button for toast notifications
 */
const ToastClose = React.memo(
  React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, ToastCloseProps>(
    ({ className, ...props }, ref) => (
      <ToastPrimitives.Close
        ref={ref}
        className={cn(
          'hover:bg-muted focus-visible:ring-ring absolute right-3 top-3 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-1 opacity-70 transition-all duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group-hover:opacity-100',
          className
        )}
        aria-label="Close notification"
        {...props}
      >
        <Icon
          icon={X}
          size="sm"
          aria-hidden="true"
        />
      </ToastPrimitives.Close>
    )
  )
);
ToastClose.displayName = 'ToastClose';

/**
 * Props for the ToastTitle component
 */
export interface ToastTitleProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> {}

/**
 * ToastTitle component - Title for toast notifications
 */
const ToastTitle = React.memo(
  React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, ToastTitleProps>(
    ({ className, ...props }, ref) => (
      <ToastPrimitives.Title
        ref={ref}
        className={cn('text-sm font-semibold', className)}
        {...props}
      />
    )
  )
);
ToastTitle.displayName = 'ToastTitle';

/**
 * Props for the ToastDescription component
 */
export interface ToastDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> {}

/**
 * ToastDescription component - Content for toast notifications
 */
const ToastDescription = React.memo(
  React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, ToastDescriptionProps>(
    ({ className, ...props }, ref) => (
      <ToastPrimitives.Description
        ref={ref}
        className={cn('text-muted-foreground text-sm', className)}
        {...props}
      />
    )
  )
);
ToastDescription.displayName = 'ToastDescription';

/** Type for toast action elements */
export type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
