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
      return 'text-error';
    case 'WARNING':
      return 'text-warning';
    case 'INFO':
      return 'text-info';
    default:
      return 'text-info';
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
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full text-left relative flex gap-3 px-4 py-3 border-b border-border transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !notification.read && 'bg-primary/5',
        notification.read && 'bg-popover',
        'cursor-pointer',
        className
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          className="absolute top-3 left-2 h-2 w-2 rounded-full bg-error flex-shrink-0"
          aria-label="Unread"
        />
      )}

      {/* Item icon */}
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={cn('h-4 w-4', iconClass)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title */}
        <h4 className="text-sm font-medium text-foreground truncate">
          {notification.title}
        </h4>

        {/* Message */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        {/* Timestamp */}
        <time
          className="block text-xs text-muted-foreground"
          dateTime={notification.receivedAt}
        >
          {formatDistanceToNow(new Date(notification.receivedAt), { addSuffix: true })}
        </time>
      </div>
    </button>
  );
}

export const NotificationItem = memo(NotificationItemComponent);
NotificationItem.displayName = 'NotificationItem';
