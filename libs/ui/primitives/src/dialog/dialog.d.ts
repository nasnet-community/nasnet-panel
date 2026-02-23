import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
/**
 * Dialog - Root component for modal dialog.
 * Manages open/closed state and focus management.
 *
 * @see https://www.radix-ui.com/docs/primitives/components/dialog
 */
declare const Dialog: React.FC<DialogPrimitive.DialogProps>;
/**
 * DialogTrigger - Button or interactive element that opens the dialog.
 * Typically wrapped with `asChild` to apply trigger props to custom button.
 */
declare const DialogTrigger: React.ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * DialogPortal - Renders dialog content at the document root (outside normal DOM tree).
 * Ensures dialog appears above other content and prevents stacking context issues.
 */
declare const DialogPortal: React.FC<DialogPrimitive.DialogPortalProps>;
/**
 * DialogClose - Button that closes the dialog.
 * Typically used in DialogFooter for cancel/close actions.
 */
declare const DialogClose: React.ForwardRefExoticComponent<DialogPrimitive.DialogCloseProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * DialogOverlay - Semi-transparent backdrop behind the dialog.
 * Provides visual separation and prevents interaction with underlying content.
 * Includes backdrop blur effect and fade animation on open/close.
 */
declare const DialogOverlay: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogOverlayProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const DialogContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
/**
 * DialogHeader - Container for dialog title and description.
 * Flexbox column layout with centered text on mobile, left-aligned on desktop.
 */
declare const DialogHeader: React.MemoExoticComponent<({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => import("react/jsx-runtime").JSX.Element>;
/**
 * DialogFooter - Container for dialog action buttons.
 * Flexbox layout with column-reverse on mobile, row on desktop.
 * Buttons are right-aligned on desktop and stacked on mobile.
 */
declare const DialogFooter: React.MemoExoticComponent<({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => import("react/jsx-runtime").JSX.Element>;
/**
 * DialogTitle - Primary heading within the dialog.
 * Semantic title element with appropriate text styling.
 */
declare const DialogTitle: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogTitleProps & React.RefAttributes<HTMLHeadingElement>, "ref"> & React.RefAttributes<HTMLHeadingElement>>>;
/**
 * DialogDescription - Secondary text or supporting information in dialog.
 * Rendered in muted color for visual distinction.
 */
declare const DialogDescription: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DialogPrimitive.DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>, "ref"> & React.RefAttributes<HTMLParagraphElement>>>;
export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, };
//# sourceMappingURL=dialog.d.ts.map