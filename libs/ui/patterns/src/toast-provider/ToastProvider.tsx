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

import { Toaster, type ToasterProps } from 'sonner';

import { useThemeStore } from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/ui/layouts';

import { NotificationManager } from './NotificationManager';

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
 * Custom class names for toast styling
 * Uses NasNetConnect design tokens
 *
 * Accessibility (AC7):
 * - Sonner automatically adds aria-live regions for toast announcements
 * - Error toasts use role="alert" for immediate announcement
 * - Non-error toasts use aria-live="polite" for non-interrupting announcements
 * - Escape key dismisses focused toast (built into Sonner)
 * - Focus is managed to not trap users
 * - All interactive elements have visible focus indicators
 */
const TOAST_CLASS_NAMES = {
  toast: 'rounded-2xl shadow-xl border font-sans',
  title: 'font-semibold text-sm',
  description: 'text-sm opacity-90',
  actionButton:
    'bg-primary text-primary-foreground hover:bg-primary/90 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  cancelButton:
    'bg-muted text-muted-foreground hover:bg-muted/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  closeButton:
    'bg-background text-foreground border border-border hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  success:
    'border-success/50 bg-success-light text-success-dark dark:bg-success/10 dark:text-success-light',
  error:
    'border-error/50 bg-error-light text-error-dark dark:bg-error/10 dark:text-error-light',
  warning:
    'border-warning/50 bg-warning-light text-warning-dark dark:bg-warning/10 dark:text-warning-light',
  info: 'border-info/50 bg-info-light text-info-dark dark:bg-info/10 dark:text-info-light',
  loading:
    'border-muted bg-muted/50 text-muted-foreground dark:bg-muted/10 dark:text-muted-foreground',
} as const;

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
function ToastProviderComponent({
  children,
  position,
  visibleToasts = 3,
  richColors = true,
  expand = true,
  gap = 12,
}: ToastProviderProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const platform = usePlatform();

  // Responsive position: bottom-right for desktop, bottom-center for mobile
  const responsivePosition: ToasterProps['position'] =
    position ?? (platform === 'mobile' ? 'bottom-center' : 'bottom-right');

  // Calculate offset to avoid bottom navigation on mobile
  const offset = platform === 'mobile' ? '72px' : '16px';

  return (
    <>
      {children}
      <Toaster
        theme={resolvedTheme}
        position={responsivePosition}
        richColors={richColors}
        expand={expand}
        visibleToasts={visibleToasts}
        gap={gap}
        offset={offset}
        closeButton
        toastOptions={{
          classNames: TOAST_CLASS_NAMES,
          // Default durations handled by NotificationManager based on type
        }}
      />
      <NotificationManager />
    </>
  );
}

export const ToastProvider = React.memo(ToastProviderComponent);
ToastProvider.displayName = 'ToastProvider';

export default ToastProvider;
