/**
 * Connection Event Card Component
 *
 * Display individual WAN connection events in a timeline format with visual
 * status indicators, timestamps, and event-specific details (IP, gateway, reason).
 *
 * Includes both full and compact presentations for different viewport contexts.
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */

import { formatDistanceToNow, format } from 'date-fns';
import { useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  Clock,
} from 'lucide-react';
import { Badge } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { ConnectionEventData } from '../../types/wan.types';

export interface ConnectionEventCardProps {
  /** Connection event data to display */
  event: ConnectionEventData;
  /** Show WAN interface ID in the header (default: true) */
  showInterface?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get visual display properties for event type
 * @description Returns icon, colors, and label based on connection event type
 * Uses semantic color tokens (success, warning, destructive, muted)
 */
const getEventDisplay = (eventType: string) => {
  switch (eventType) {
    case 'CONNECTED':
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'text-success',
        bgColor: 'bg-success/10',
        label: 'Connected',
      };
    case 'DISCONNECTED':
      return {
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-error',
        bgColor: 'bg-error/10',
        label: 'Disconnected',
      };
    case 'AUTH_FAILED':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-error',
        bgColor: 'bg-error/10',
        label: 'Auth Failed',
      };
    case 'IP_CHANGED':
      return {
        icon: <ArrowRightLeft className="h-4 w-4" />,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        label: 'IP Changed',
      };
    case 'RECONNECTING':
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        label: 'Reconnecting',
      };
    default:
      return {
        icon: <Clock className="h-4 w-4" />,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: eventType,
      };
  }
};

/**
 * Connection Event Card - Timeline item for connection events
 *
 * Displays a single connection event with visual timeline indicator, timestamp,
 * and event-specific details. Uses semantic color tokens based on event type.
 */
function ConnectionEventCardComponent({
  event,
  showInterface = true,
  className,
}: ConnectionEventCardProps) {
  const display = useMemo(() => getEventDisplay(event.eventType), [event.eventType]);
  const timestamp = useMemo(() => new Date(event.timestamp), [event.timestamp]);
  const relativeTime = useMemo(
    () => formatDistanceToNow(timestamp, { addSuffix: true }),
    [timestamp]
  );
  const absoluteTime = useMemo(
    () => format(timestamp, 'PPpp'),
    [timestamp]
  );

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={cn('flex gap-component-md group', className)}>
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={cn('rounded-full px-component-sm py-component-sm', display.bgColor, display.color)}
          aria-hidden="true"
        >
          {display.icon}
        </div>
        <div className="w-px flex-1 bg-border group-last:bg-transparent mt-2" />
      </div>

      {/* Event content */}
      <div className="flex-1 pb-component-lg">
        <div className="flex items-start justify-between gap-component-md mb-2">
          <div className="flex items-center gap-component-sm">
            <Badge variant="outline" className={display.color}>
              {display.label}
            </Badge>
            {showInterface && event.wanInterfaceId && (
              <span className="text-xs text-muted-foreground font-mono">
                {event.wanInterfaceId}
              </span>
            )}
          </div>
          <time
            className="text-xs text-muted-foreground whitespace-nowrap"
            dateTime={event.timestamp}
            title={absoluteTime}
          >
            {relativeTime}
          </time>
        </div>

        {/* Event details */}
        <div className="space-y-component-xs">
          {/* IP Information */}
          {event.publicIP && (
            <div className="flex items-center gap-component-sm text-sm">
              <span className="text-muted-foreground">IP:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded-[var(--semantic-radius-button)] text-foreground">
                {event.publicIP}
              </code>
            </div>
          )}

          {/* Gateway Information */}
          {event.gateway && (
            <div className="flex items-center gap-component-sm text-sm">
              <span className="text-muted-foreground">Gateway:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded-[var(--semantic-radius-button)] text-foreground">
                {event.gateway}
              </code>
            </div>
          )}

          {/* Duration (for disconnection events) */}
          {event.duration && event.duration > 0 && (
            <div className="flex items-center gap-component-sm text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">
                Duration: {formatDuration(event.duration)}
              </span>
            </div>
          )}

          {/* Reason/Error message */}
          {event.reason && (
            <p className="text-sm text-muted-foreground mt-2">{event.reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const ConnectionEventCard = Object.assign(
  ConnectionEventCardComponent,
  { displayName: 'ConnectionEventCard' }
) as typeof ConnectionEventCardComponent & { displayName: string };

/**
 * Compact version for mobile/narrow views
 *
 * Condensed layout optimized for small viewports, omitting timeline connector
 * and reducing detail visibility while maintaining essential information.
 */
function ConnectionEventCardCompactComponent({
  event,
  showInterface = true,
  className,
}: ConnectionEventCardProps) {
  const display = useMemo(() => getEventDisplay(event.eventType), [event.eventType]);
  const timestamp = useMemo(() => new Date(event.timestamp), [event.timestamp]);
  const relativeTime = useMemo(
    () => formatDistanceToNow(timestamp, { addSuffix: true }),
    [timestamp]
  );

  return (
    <div className={cn('flex items-start gap-component-md px-component-sm py-component-sm rounded-[var(--semantic-radius-card)] border border-border', className)}>
      <div
        className={cn('rounded-full px-component-sm py-component-sm', display.bgColor, display.color)}
        aria-hidden="true"
      >
        {display.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-component-sm mb-1">
          <Badge variant="outline" className={cn(display.color, 'text-xs')}>
            {display.label}
          </Badge>
          <time className="text-xs text-muted-foreground">{relativeTime}</time>
        </div>

        {event.publicIP && (
          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded-[var(--semantic-radius-button)] text-foreground">
            {event.publicIP}
          </code>
        )}

        {event.reason && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {event.reason}
          </p>
        )}
      </div>
    </div>
  );
}

export const ConnectionEventCardCompact = Object.assign(
  ConnectionEventCardCompactComponent,
  { displayName: 'ConnectionEventCardCompact' }
) as typeof ConnectionEventCardCompactComponent & { displayName: string };
