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
import { type VariantProps } from 'class-variance-authority';
declare const ToastProvider: React.FC<ToastPrimitives.ToastProviderProps>;
/**
 * Props for the ToastViewport component
 */
export interface ToastViewportProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> {
}
/**
 * ToastViewport component - Container for all toast notifications
 */
declare const ToastViewport: React.MemoExoticComponent<React.ForwardRefExoticComponent<ToastViewportProps & React.RefAttributes<HTMLOListElement>>>;
declare const toastVariants: (props?: ({
    variant?: "success" | "error" | "warning" | "info" | "default" | "destructive" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Props for the Toast component
 */
export interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, VariantProps<typeof toastVariants> {
}
/**
 * Toast component - Individual notification container
 */
declare const Toast: React.MemoExoticComponent<React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLLIElement>>>;
/**
 * Props for the ToastAction component
 */
export interface ToastActionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> {
}
/**
 * ToastAction component - Action button for toast notifications
 */
declare const ToastAction: React.MemoExoticComponent<React.ForwardRefExoticComponent<ToastActionProps & React.RefAttributes<HTMLButtonElement>>>;
/**
 * Props for the ToastClose component
 */
export interface ToastCloseProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {
}
/**
 * ToastClose component - Close button for toast notifications
 */
declare const ToastClose: React.MemoExoticComponent<React.ForwardRefExoticComponent<ToastCloseProps & React.RefAttributes<HTMLButtonElement>>>;
/**
 * Props for the ToastTitle component
 */
export interface ToastTitleProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> {
}
/**
 * ToastTitle component - Title for toast notifications
 */
declare const ToastTitle: React.MemoExoticComponent<React.ForwardRefExoticComponent<ToastTitleProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * Props for the ToastDescription component
 */
export interface ToastDescriptionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> {
}
/**
 * ToastDescription component - Content for toast notifications
 */
declare const ToastDescription: React.MemoExoticComponent<React.ForwardRefExoticComponent<ToastDescriptionProps & React.RefAttributes<HTMLDivElement>>>;
/** Type for toast action elements */
export type ToastActionElement = React.ReactElement<typeof ToastAction>;
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, };
//# sourceMappingURL=toast.d.ts.map