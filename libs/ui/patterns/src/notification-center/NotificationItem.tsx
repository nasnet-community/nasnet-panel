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
function NotificationItemComponent({ notification, onClick, className }: NotificationItemProps) {
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
        'border-border relative flex w-full gap-3 border-b px-4 py-3 text-left transition-colors',
        'hover:bg-muted focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
        !notification.read && 'bg-primary/5',
        notification.read && 'bg-popover',
        'cursor-pointer',
        className
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          className="bg-error absolute left-2 top-3 h-2 w-2 flex-shrink-0 rounded-full"
          aria-label="Unread"
        />
      )}

      {/* Item icon */}
      <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
        <Icon
          className={cn('h-4 w-4', iconClass)}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title */}
        <h4 className="text-foreground truncate text-sm font-medium">{notification.title}</h4>

        {/* Message */}
        <p className="text-muted-foreground line-clamp-2 text-xs">{notification.message}</p>

        {/* Timestamp */}
        <time
          className="text-muted-foreground block text-xs"
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
