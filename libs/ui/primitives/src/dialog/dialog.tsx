import * as React from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '../lib/utils';

/**
 * Dialog - Root component for modal dialog.
 * Manages open/closed state and focus management.
 *
 * @see https://www.radix-ui.com/docs/primitives/components/dialog
 */
const Dialog = DialogPrimitive.Root;

/**
 * DialogTrigger - Button or interactive element that opens the dialog.
 * Typically wrapped with `asChild` to apply trigger props to custom button.
 */
const DialogTrigger = DialogPrimitive.Trigger;

/**
 * DialogPortal - Renders dialog content at the document root (outside normal DOM tree).
 * Ensures dialog appears above other content and prevents stacking context issues.
 */
const DialogPortal = DialogPrimitive.Portal;

/**
 * DialogClose - Button that closes the dialog.
 * Typically used in DialogFooter for cancel/close actions.
 */
const DialogClose = DialogPrimitive.Close;

/**
 * DialogOverlay - Semi-transparent backdrop behind the dialog.
 * Provides visual separation and prevents interaction with underlying content.
 * Includes backdrop blur effect and fade animation on open/close.
 */
const DialogOverlay = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-200',
        className
      )}
      {...props}
    />
  ))
);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent - Main content container for the dialog.
 * Renders in a portal, includes overlay backdrop, and provides keyboard navigation.
 * Includes an automatic close button in the top-right corner.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *     </DialogHeader>
 *     Content here
 *   </DialogContent>
 * </Dialog>
 * ```
 */
const DialogContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'border-border bg-card text-card-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[var(--semantic-radius-modal)] border p-6 shadow-[var(--semantic-shadow-modal)] transition-all duration-200 sm:w-full',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="hover:bg-accent focus-visible:ring-ring absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-1.5 opacity-70 transition-all duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  ))
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * DialogHeader - Container for dialog title and description.
 * Flexbox column layout with centered text on mobile, left-aligned on desktop.
 */
const DialogHeader = React.memo(({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

/**
 * DialogFooter - Container for dialog action buttons.
 * Flexbox layout with column-reverse on mobile, row on desktop.
 * Buttons are right-aligned on desktop and stacked on mobile.
 */
const DialogFooter = React.memo(({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

/**
 * DialogTitle - Primary heading within the dialog.
 * Semantic title element with appropriate text styling.
 */
const DialogTitle = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-card-foreground text-lg font-semibold leading-tight', className)}
      {...props}
    />
  ))
);
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription - Secondary text or supporting information in dialog.
 * Rendered in muted color for visual distinction.
 */
const DialogDescription = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
  >(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  ))
);
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
