/**
 * Notification Manager Component
 * Bridges Zustand notification store to Sonner toast UI
 *
 * This component subscribes to the notification store and syncs
 * notifications to Sonner toasts. It handles:
 * - Mapping notification types to Sonner toast types
 * - Auto-dismiss logic based on notification type
 * - Progress toast updates
 * - Action buttons (Retry, Undo, etc.)
 * - Cleanup on notification removal
 *
 * @see NAS-4.19: Implement Notification/Toast System
 */
/**
 * NotificationManager Component
 *
 * Invisible component that syncs notification store state to Sonner toasts.
 * Should be included once in the app, typically alongside the Toaster.
 *
 * @internal Used by ToastProvider
 */
export declare function NotificationManager(): null;
export default NotificationManager;
//# sourceMappingURL=NotificationManager.d.ts.map