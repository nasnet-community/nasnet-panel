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
import { type NotificationInput, type NotificationAction } from '@nasnet/state/stores';
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
/**
 * Options for the generic toast() method (shadcn-compatible API)
 */
export interface GenericToastOptions {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number | null;
    action?: NotificationAction;
}
export interface UseToastReturn {
    /**
     * Generic toast method (shadcn-compatible API)
     * Accepts { title, description, variant } for compatibility
     */
    toast: (options: GenericToastOptions) => string;
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
    promise: <T>(promise: Promise<T>, messages: PromiseToastMessages<T>) => Promise<T>;
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
export declare function useToast(): UseToastReturn;
export default useToast;
//# sourceMappingURL=useToast.d.ts.map