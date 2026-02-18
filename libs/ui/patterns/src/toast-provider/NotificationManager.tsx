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

import * as React from 'react';

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { toast, type ExternalToast } from 'sonner';

import {
  useNotificationStore,
  type Notification,
  type NotificationType,
} from '@nasnet/state/stores';

/**
 * Map notification types to Sonner toast methods
 */
type SonnerToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default';

const TYPE_MAP: Record<NotificationType, SonnerToastType> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
  progress: 'loading',
};

/**
 * Icons for each notification type
 */
const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />,
  error: <XCircle className="h-5 w-5 text-error" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-info" aria-hidden="true" />,
  progress: <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />,
};

/**
 * Expandable error details component
 * Accessibility: Uses aria-expanded and aria-controls for screen readers
 */
function ExpandableDetails({ details, id }: { details: string; id: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const detailsId = `toast-details-${id}`;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
            Show details
          </>
        )}
      </button>
      {isExpanded && (
        <pre
          id={detailsId}
          className="mt-2 text-xs bg-muted/50 p-2 rounded-md overflow-x-auto max-h-24 font-mono"
          tabIndex={0}
        >
          {details}
        </pre>
      )}
    </div>
  );
}

/**
 * Progress bar component for progress toasts
 */
function ProgressBar({ progress }: { progress: number }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="mt-2 w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{Math.round(clampedProgress)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/**
 * Custom toast content renderer
 */
function ToastContent({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const { type, title, message, progress, action } = notification;
  const showProgress = type === 'progress' && typeof progress === 'number';

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0" role={type === 'error' ? 'alert' : 'status'}>
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 mt-0.5">{TYPE_ICONS[type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          {message && <p className="text-sm opacity-90 mt-0.5">{message}</p>}
        </div>
      </div>

      {showProgress && <ProgressBar progress={progress} />}

      {/* Expandable details for errors */}
      {type === 'error' && notification.message && notification.message.length > 100 && (
        <ExpandableDetails details={notification.message} id={notification.id} />
      )}

      {/* Action buttons */}
      {action && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * NotificationManager Component
 *
 * Invisible component that syncs notification store state to Sonner toasts.
 * Should be included once in the app, typically alongside the Toaster.
 *
 * @internal Used by ToastProvider
 */
export function NotificationManager() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  // Track which notification IDs we've already displayed
  const displayedIdsRef = React.useRef<Set<string>>(new Set());
  // Track previous progress values for updates
  const progressValuesRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));

    // Process new notifications
    for (const notification of notifications) {
      const { id, type, title, message, duration, action, progress } = notification;

      // Skip if already displayed (unless it's a progress update)
      if (displayedIdsRef.current.has(id)) {
        // Handle progress updates
        if (type === 'progress' && typeof progress === 'number') {
          const prevProgress = progressValuesRef.current.get(id);
          if (prevProgress !== progress) {
            progressValuesRef.current.set(id, progress);
            // Update existing toast with new progress
            toast.custom(
              (t) => (
                <ToastContent
                  notification={notification}
                  onDismiss={() => {
                    toast.dismiss(t);
                    removeNotification(id);
                  }}
                />
              ),
              {
                id,
                duration: Infinity, // Progress toasts don't auto-dismiss
              }
            );
          }
        }
        continue;
      }

      // Mark as displayed
      displayedIdsRef.current.add(id);
      if (type === 'progress' && typeof progress === 'number') {
        progressValuesRef.current.set(id, progress);
      }

      // Build toast options
      const toastOptions: ExternalToast = {
        id,
        duration: duration ?? undefined,
        onDismiss: () => removeNotification(id),
        onAutoClose: () => removeNotification(id),
      };

      // Add action if provided (for simple toasts)
      if (action && type !== 'progress') {
        toastOptions.action = {
          label: action.label,
          onClick: () => {
            action.onClick();
            removeNotification(id);
          },
        };
      }

      // Use custom content for progress toasts or toasts with complex content
      if (type === 'progress' || action) {
        toast.custom(
          (t) => (
            <ToastContent
              notification={notification}
              onDismiss={() => {
                toast.dismiss(t);
                removeNotification(id);
              }}
            />
          ),
          {
            ...toastOptions,
            duration: type === 'progress' ? Infinity : duration ?? undefined,
          }
        );
      } else {
        // Use standard Sonner toasts for simple notifications
        const sonnerType = TYPE_MAP[type];

        switch (sonnerType) {
          case 'success':
            toast.success(title, {
              ...toastOptions,
              description: message,
              icon: TYPE_ICONS.success,
            });
            break;
          case 'error':
            toast.error(title, {
              ...toastOptions,
              description: message,
              icon: TYPE_ICONS.error,
              duration: Infinity, // Errors don't auto-dismiss
            });
            break;
          case 'warning':
            toast.warning(title, {
              ...toastOptions,
              description: message,
              icon: TYPE_ICONS.warning,
            });
            break;
          case 'info':
            toast.info(title, {
              ...toastOptions,
              description: message,
              icon: TYPE_ICONS.info,
            });
            break;
          case 'loading':
            toast.loading(title, {
              ...toastOptions,
              description: message,
              icon: TYPE_ICONS.progress,
              duration: Infinity,
            });
            break;
          default:
            toast(title, {
              ...toastOptions,
              description: message,
            });
        }
      }
    }

    // Clean up dismissed notifications from tracking
    for (const id of displayedIdsRef.current) {
      if (!currentIds.has(id)) {
        displayedIdsRef.current.delete(id);
        progressValuesRef.current.delete(id);
        // Dismiss the toast if it's still showing
        toast.dismiss(id);
      }
    }
  }, [notifications, removeNotification]);

  // This component renders nothing - it only manages side effects
  return null;
}

export default NotificationManager;
