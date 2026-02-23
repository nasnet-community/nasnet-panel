/**
 * Toast Provider Component
 * Provides Sonner toast functionality with theme integration and notification store sync
 *
 * Features:
 * - Sonner Toaster with theme support (light/dark)
 * - Responsive positioning (bottom-right desktop, bottom-center mobile)
 * - Max 3 visible toasts with queue management
 * - NotificationManager for store-to-Sonner sync
 *
 * @see NAS-4.19: Implement Notification/Toast System
 * @see Docs/design/ux-design/7-ux-pattern-decisions.md#Feedback
 */
import * as React from 'react';
import { type ToasterProps } from 'sonner';
/**
 * Toast provider props
 */
export interface ToastProviderProps {
    /**
     * Children to render
     */
    children: React.ReactNode;
    /**
     * Override position (default: responsive based on platform)
     */
    position?: ToasterProps['position'];
    /**
     * Maximum visible toasts (default: 3)
     */
    visibleToasts?: number;
    /**
     * Enable rich colors mode (default: true)
     */
    richColors?: boolean;
    /**
     * Enable expand mode on hover (default: true)
     */
    expand?: boolean;
    /**
     * Gap between toasts in pixels (default: 12)
     */
    gap?: number;
}
/**
 * ToastProvider Component
 *
 * Wraps children with Sonner Toaster and NotificationManager for
 * automatic sync between Zustand notification store and Sonner toasts.
 *
 * @example
 * ```tsx
 * // In app providers
 * <ToastProvider>
 *   <RouterProvider router={router} />
 * </ToastProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Custom configuration
 * <ToastProvider
 *   position="top-center"
 *   visibleToasts={5}
 *   expand={false}
 * >
 *   {children}
 * </ToastProvider>
 * ```
 */
declare function ToastProviderComponent({ children, position, visibleToasts, richColors, expand, gap, }: ToastProviderProps): import("react/jsx-runtime").JSX.Element;
export declare const ToastProvider: React.MemoExoticComponent<typeof ToastProviderComponent>;
export default ToastProvider;
//# sourceMappingURL=ToastProvider.d.ts.map