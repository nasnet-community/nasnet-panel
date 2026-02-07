/**
 * Connection Event Card Component
 *
 * Display individual connection events in timeline format.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */

import { formatDistanceToNow, format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  Clock,
} from 'lucide-react';
import { Badge } from '@nasnet/ui/primitives';
import type { ConnectionEventData } from '../../types/wan.types';

export interface ConnectionEventCardProps {
  event: ConnectionEventData;
  showInterface?: boolean;
}

/**
 * Get icon and color for event type
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
 */
export function ConnectionEventCard({
  event,
  showInterface = true,
}: ConnectionEventCardProps) {
  const display = getEventDisplay(event.eventType);
  const timestamp = new Date(event.timestamp);
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });
  const absoluteTime = format(timestamp, 'PPpp'); // e.g., "Apr 29, 2023, 9:30:00 AM"

  return (
    <div className="flex gap-3 group">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={`rounded-full p-2 ${display.bgColor} ${display.color}`}
        >
          {display.icon}
        </div>
        <div className="w-px flex-1 bg-border group-last:bg-transparent mt-2" />
      </div>

      {/* Event content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={display.color}>
              {display.label}
            </Badge>
            {showInterface && event.wanInterfaceId && (
              <span className="text-xs text-muted-foreground">
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
        <div className="space-y-1">
          {/* IP Information */}
          {event.publicIP && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">IP:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {event.publicIP}
              </code>
            </div>
          )}

          {/* Gateway Information */}
          {event.gateway && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Gateway:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {event.gateway}
              </code>
            </div>
          )}

          {/* Duration (for disconnection events) */}
          {event.duration && event.duration > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Duration:{' '}
                {event.duration < 60
                  ? `${event.duration}s`
                  : event.duration < 3600
                  ? `${Math.floor(event.duration / 60)}m ${event.duration % 60}s`
                  : `${Math.floor(event.duration / 3600)}h ${Math.floor((event.duration % 3600) / 60)}m`}
              </span>
            </div>
          )}

          {/* Reason/Error message */}
          {event.reason && (
            <p className="text-sm text-muted-foreground mt-1">{event.reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for mobile/narrow views
 */
export function ConnectionEventCardCompact({
  event,
  showInterface = true,
}: ConnectionEventCardProps) {
  const display = getEventDisplay(event.eventType);
  const timestamp = new Date(event.timestamp);
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className={`rounded-full p-2 ${display.bgColor} ${display.color}`}>
        {display.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`${display.color} text-xs`}>
            {display.label}
          </Badge>
          <time className="text-xs text-muted-foreground">{relativeTime}</time>
        </div>

        {event.publicIP && (
          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
            {event.publicIP}
          </code>
        )}

        {event.reason && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.reason}
          </p>
        )}
      </div>
    </div>
  );
}
