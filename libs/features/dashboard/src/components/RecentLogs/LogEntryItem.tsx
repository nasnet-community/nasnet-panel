/**
 * LogEntryItem component for displaying individual log entries
 * Supports compact mode for mobile and highlight animation for new entries
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { Badge, cn } from '@nasnet/ui/primitives';

import { SEVERITY_CONFIG, TOPIC_LABELS } from './constants';
import { formatLogTimestamp } from './utils';

import type { LogEntryItemProps } from './types';

/**
 * Displays a single log entry with severity icon, topic badge, and message
 *
 * @param entry - Log entry data
 * @param isNew - Whether this is a newly arrived entry (triggers highlight animation)
 * @param compact - Whether to use compact mode (mobile)
 */
export function LogEntryItem({ entry, isNew, compact }: LogEntryItemProps) {
  const severityConfig = SEVERITY_CONFIG[entry.severity];
  const SeverityIcon = severityConfig.icon;

  return (
    <div
      role="listitem"
      aria-label={`${severityConfig.label} log: ${entry.message}`}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        'hover:bg-muted/50',
        isNew && 'animate-highlight bg-primary/5'
      )}
    >
      {/* Severity Icon */}
      <div className={cn('mt-0.5 shrink-0', severityConfig.colorClass)}>
        <SeverityIcon size={18} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Topic Badge */}
          <Badge variant="secondary" className="text-xs">
            {TOPIC_LABELS[entry.topic] || entry.topic}
          </Badge>

          {/* Timestamp */}
          <span className="text-xs text-muted-foreground">
            {formatLogTimestamp(entry.timestamp)}
          </span>
        </div>

        {/* Message */}
        <p
          className={cn(
            'text-sm text-foreground',
            compact ? 'line-clamp-1' : 'line-clamp-2'
          )}
          title={entry.message}
        >
          {entry.message}
        </p>
      </div>
    </div>
  );
}
