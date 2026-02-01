/**
 * useToast Hook
 * Convenience hook for triggering toast notifications in components
 *
 * This hook wraps the existing notification store functions and adds
 * Sonner-specific functionality like toast.promise() for async operations.
 *
 * Note: The actual notification store functions (showSuccess, showError, etc.)
 * are already exported from @nasnet/state/stores. This hook provides a
 * component-friendly interface with additional utilities.
 *
 * @see NAS-4.19: Implement Notification/Toast System
 * @see libs/state/stores/src/ui/notification.store.ts
 */

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import {
  useNotificationStore,
  type NotificationInput,
  type NotificationAction,
} from '@nasnet/state/stores';

/**
 * Extended toast options for more control
 */
export interface ToastOptions {
  /**
   * Toast message body
   */
  message?: string;

  /**
   * Custom duration in ms (null = no auto-dismiss)
   */
  duration?: number | null;

  /**
   * Action button configuration
   */
  action?: NotificationAction;
}

/**
 * Progress toast options
 */
export interface ProgressToastOptions extends ToastOptions {
  /**
   * Initial progress value (0-100)
   */
  progress?: number;
}

/**
 * Promise toast messages configuration
 */
export interface PromiseToastMessages<T> {
  /**
   * Message shown while promise is pending
   */
  loading: string;

  /**
   * Message shown on success (can be function for dynamic message)
   */
  success: string | ((data: T) => string);

  /**
   * Message shown on error (can be function for dynamic message)
   */
  error: string | ((error: unknown) => string);
}

/**
 * Return type for useToast hook
 */
export interface UseToastReturn {
  /**
   * Show a success toast
   */
  success: (title: string, options?: ToastOptions) => string;

  /**
   * Show an error toast (persistent until dismissed)
   */
  error: (title: string, options?: ToastOptions) => string;

  /**
   * Show a warning toast
   */
  warning: (title: string, options?: ToastOptions) => string;

  /**
   * Show an info toast
   */
  info: (title: string, options?: ToastOptions) => string;

  /**
   * Show a progress toast
   * Returns the notification ID for later updates
   */
  progress: (title: string, options?: ProgressToastOptions) => string;

  /**
   * Update an existing notification
   */
  update: (id: string, updates: Partial<NotificationInput>) => void;

  /**
   * Dismiss a notification by ID
   */
  dismiss: (id: string) => void;

  /**
   * Dismiss all notifications
   */
  dismissAll: () => void;

  /**
   * Show a toast that tracks a promise
   * Shows loading → success/error based on promise result
   */
  promise: <T>(
    promise: Promise<T>,
    messages: PromiseToastMessages<T>
  ) => Promise<T>;
}

/**
 * useToast Hook
 *
 * Provides toast notification utilities for React components.
 * Integrates with the Zustand notification store and Sonner.
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { success, error, promise } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Configuration saved!');
 *     } catch (e) {
 *       error('Failed to save', { message: e.message });
 *     }
 *   };
 *
 *   // Or use promise helper
 *   const handleSaveWithPromise = () => {
 *     promise(saveData(), {
 *       loading: 'Saving...',
 *       success: 'Configuration saved!',
 *       error: (e) => `Failed: ${e.message}`,
 *     });
 *   };
 *
 *   return <Button onClick={handleSave}>Save</Button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function UploadButton() {
 *   const { progress, update, dismiss, success } = useToast();
 *
 *   const handleUpload = async () => {
 *     const id = progress('Uploading firmware...', { progress: 0 });
 *
 *     // Simulate progress
 *     for (let i = 0; i <= 100; i += 10) {
 *       await delay(100);
 *       update(id, { progress: i });
 *     }
 *
 *     dismiss(id);
 *     success('Firmware uploaded!');
 *   };
 *
 *   return <Button onClick={handleUpload}>Upload</Button>;
 * }
 * ```
 */
export function useToast(): UseToastReturn {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const updateNotification = useNotificationStore((s) => s.updateNotification);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearAllNotifications = useNotificationStore((s) => s.clearAllNotifications);

  const success = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addNotification({
        type: 'success',
        title,
        message: options?.message,
        duration: options?.duration,
        action: options?.action,
      });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addNotification({
        type: 'error',
        title,
        message: options?.message,
        duration: options?.duration ?? null, // Errors persist by default
        action: options?.action,
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addNotification({
        type: 'warning',
        title,
        message: options?.message,
        duration: options?.duration,
        action: options?.action,
      });
    },
    [addNotification]
  );

  const info = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addNotification({
        type: 'info',
        title,
        message: options?.message,
        duration: options?.duration,
        action: options?.action,
      });
    },
    [addNotification]
  );

  const progressToast = useCallback(
    (title: string, options?: ProgressToastOptions): string => {
      return addNotification({
        type: 'progress',
        title,
        message: options?.message,
        progress: options?.progress ?? 0,
        duration: null, // Progress toasts never auto-dismiss
        action: options?.action,
      });
    },
    [addNotification]
  );

  const update = useCallback(
    (id: string, updates: Partial<NotificationInput>) => {
      updateNotification(id, updates);
    },
    [updateNotification]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeNotification(id);
      // Also dismiss from Sonner directly for immediate visual feedback
      toast.dismiss(id);
    },
    [removeNotification]
  );

  const dismissAll = useCallback(() => {
    clearAllNotifications();
    toast.dismiss();
  }, [clearAllNotifications]);

  const promiseToast = useCallback(
    async <T,>(
      promise: Promise<T>,
      messages: PromiseToastMessages<T>
    ): Promise<T> => {
      const loadingId = addNotification({
        type: 'progress',
        title: messages.loading,
      });

      try {
        const result = await promise;

        // Remove loading notification
        removeNotification(loadingId);
        toast.dismiss(loadingId);

        // Show success
        const successMessage =
          typeof messages.success === 'function'
            ? messages.success(result)
            : messages.success;

        addNotification({
          type: 'success',
          title: successMessage,
        });

        return result;
      } catch (e) {
        // Remove loading notification
        removeNotification(loadingId);
        toast.dismiss(loadingId);

        // Show error
        const errorMessage =
          typeof messages.error === 'function' ? messages.error(e) : messages.error;

        addNotification({
          type: 'error',
          title: errorMessage,
        });

        throw e;
      }
    },
    [addNotification, removeNotification]
  );

  return useMemo(
    () => ({
      success,
      error,
      warning,
      info,
      progress: progressToast,
      update,
      dismiss,
      dismissAll,
      promise: promiseToast,
    }),
    [success, error, warning, info, progressToast, update, dismiss, dismissAll, promiseToast]
  );
}

export default useToast;
