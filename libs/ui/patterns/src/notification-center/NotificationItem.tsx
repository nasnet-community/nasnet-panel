/**
 * NotificationItem Component
 *
 * Displays a single notification with severity icon, title, message, and timestamp.
 * Shows an unread indicator dot for unread notifications.
 */

import { memo } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

import type { AlertSeverity } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/primitives';

import type { NotificationItemProps } from './types';

/**
 * Get icon component for severity level
 */
function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return AlertCircle;
    case 'WARNING':
      return AlertTriangle;
    case 'INFO':
      return Info;
    default:
      return Info;
  }
}

/**
 * Get icon color classes for severity level
 */
function getSeverityIconClass(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'text-semantic-error';
    case 'WARNING':
      return 'text-semantic-warning';
    case 'INFO':
      return 'text-semantic-info';
    default:
      return 'text-semantic-info';
  }
}

/**
 * NotificationItem - Single notification display
 *
 * Features:
 * - Severity icon with appropriate color
 * - Title and message text
 * - Relative timestamp (e.g., "5 minutes ago")
 * - Unread indicator dot
 * - Click to navigate and mark as read
 * - Hover state
 */
function NotificationItemComponent({
  notification,
  onClick,
  className,
}: NotificationItemProps) {
  const Icon = getSeverityIcon(notification.severity);
  const iconClass = getSeverityIconClass(notification.severity);

  const handleClick = () => {
    onClick?.(notification);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex gap-3 p-4 rounded-lg border transition-colors',
        'hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent-focus',
        !notification.read && 'bg-surface-brand-subtle border-primary/20',
        notification.read && 'bg-surface border-border',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          className="absolute top-4 left-2 w-2 h-2 rounded-full bg-primary"
          aria-label="Unread notification"
        />
      )}

      {/* Severity icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={cn('w-5 h-5', iconClass)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h4 className="text-sm font-medium text-content-primary truncate">
          {notification.title}
        </h4>

        {/* Message */}
        <p className="mt-1 text-sm text-content-secondary line-clamp-2">
          {notification.message}
        </p>

        {/* Timestamp */}
        <time
          className="mt-2 block text-xs text-content-tertiary"
          dateTime={notification.receivedAt}
        >
          {formatDistanceToNow(new Date(notification.receivedAt), { addSuffix: true })}
        </time>
      </div>
    </div>
  );
}

export const NotificationItem = memo(NotificationItemComponent);
NotificationItem.displayName = 'NotificationItem';
