/**
 * LogEntryItem component for displaying individual log entries
 * Supports compact mode for mobile and highlight animation for new entries
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { memo, useMemo } from 'react';
import { Badge, cn } from '@nasnet/ui/primitives';

import { SEVERITY_CONFIG, TOPIC_LABELS } from './constants';
import { formatLogTimestamp } from './utils';

import type { LogEntryItemProps } from './types';

/**
 * Displays a single log entry with severity icon, topic badge, and message
 *
 * @description
 * Renders a log entry with semantic styling based on severity level.
 * Uses monospace font for technical data (timestamp, message).
 * Supports compact mode for mobile devices (single-line text truncation).
 * New entries trigger a brief highlight animation for visual feedback.
 *
 * @example
 * ```tsx
 * <LogEntryItem
 *   entry={{ severity: 'warning', topic: 'firewall', message: 'Rule blocked', timestamp: new Date() }}
 *   isNew={true}
 *   compact={false}
 * />
 * ```
 *
 * @param entry - Log entry data containing severity, topic, message, and timestamp
 * @param isNew - Whether this is a newly arrived entry (triggers highlight animation)
 * @param compact - Whether to use compact mode (mobile): limits text to single line
 */
export const LogEntryItem = memo(function LogEntryItem({ entry, isNew, compact }: LogEntryItemProps) {
  const severityConfig = useMemo(() => SEVERITY_CONFIG[entry.severity], [entry.severity]);
  const SeverityIcon = severityConfig.icon;

  const formattedTimestamp = useMemo(() => formatLogTimestamp(entry.timestamp), [entry.timestamp]);

  return (
    <div
      role="listitem"
      aria-label={`${severityConfig.label} log: ${entry.message}`}
      className={cn(
        'flex items-start gap-component-md p-component-md rounded-lg transition-colors',
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
        <div className="flex items-center gap-component-sm flex-wrap">
          {/* Topic Badge */}
          <Badge variant="secondary" className="text-xs">
            {TOPIC_LABELS[entry.topic] || entry.topic}
          </Badge>

          {/* Timestamp (monospace font for technical data) */}
          <span className="text-xs text-muted-foreground font-mono">
            {formattedTimestamp}
          </span>
        </div>

        {/* Message (monospace font for log data) */}
        <p
          className={cn(
            'text-sm text-foreground font-mono',
            compact ? 'line-clamp-1' : 'line-clamp-2'
          )}
          title={entry.message}
        >
          {entry.message}
        </p>
      </div>
    </div>
  );
});

LogEntryItem.displayName = 'LogEntryItem';
