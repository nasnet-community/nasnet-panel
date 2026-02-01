/**
 * Toast Provider Module
 * Exports toast provider components for notification UI
 *
 * @see NAS-4.19: Implement Notification/Toast System
 */

export { ToastProvider } from './ToastProvider';
export type { ToastProviderProps } from './ToastProvider';

export { NotificationManager } from './NotificationManager';

// Re-export convenience functions from notification store for easy access
// These can be called from anywhere without needing React hooks
export {
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from '@nasnet/state/stores';

// Re-export toast hook from hooks module
export { useToast } from '../hooks/useToast';
export type {
  ToastOptions,
  ProgressToastOptions,
  PromiseToastMessages,
  UseToastReturn,
} from '../hooks/useToast';
