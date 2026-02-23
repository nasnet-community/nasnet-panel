/**
 * Log Entry Component
 * Displays a single system log entry with timestamp, topic badge, severity badge, and message
 * Epic 0.8: System Logs - Stories 0.8.1 & 0.8.3 + Enhanced Features
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { Copy, Pin, Check } from 'lucide-react';

import type { LogEntry as LogEntryType, LogTopic } from '@nasnet/core/types';
import { formatTimestamp } from '@nasnet/core/utils';
import { cn } from '@nasnet/ui/primitives';

import { SeverityBadge } from '../severity-badge';



/**
 * Topic badge styling variants
 * Maps LogTopic to color classes
 */
const topicBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      topic: {
        system: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/20',
        firewall: 'bg-error/10 text-error ring-error/20 dark:bg-error/20 dark:text-red-400',
        wireless: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        dhcp: 'bg-success/10 text-success ring-success/20 dark:bg-success/20 dark:text-green-400',
        dns: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/20 dark:text-purple-400',
        ppp: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/20 dark:text-orange-400',
        vpn: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/20 dark:text-cyan-400',
        interface: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/20 dark:text-indigo-400',
        route: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/20 dark:text-teal-400',
        script: 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/20 dark:text-pink-400',
        critical: 'bg-error/20 text-error ring-error/30 dark:bg-error/30 dark:text-red-300 font-bold',
        info: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        warning: 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        error: 'bg-error/10 text-error ring-error/20 dark:bg-error/20 dark:text-red-400',
      },
    },
    defaultVariants: {
      topic: 'system',
    },
  }
);

export interface LogEntryProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Log entry data
   */
  entry: LogEntryType;

  /**
   * Whether to show full date in timestamp (default: time only)
   */
  showDate?: boolean;

  /**
   * Whether the entry is bookmarked
   */
  isBookmarked?: boolean;

  /**
   * Callback to toggle bookmark
   */
  onToggleBookmark?: (entry: LogEntryType) => void;

  /**
   * Search term to highlight in message
   */
  searchTerm?: string;

  /**
   * Whether to use compact mode (mobile)
   */
  compact?: boolean;
}

/**
 * LogEntry Component
 *
 * Displays a single log entry with:
 * - Formatted timestamp
 * - Color-coded topic badge
 * - Color-coded severity badge
 * - Log message with text wrapping
 * - Copy button (on hover)
 * - Bookmark button
 * - Search term highlighting
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <LogEntry
 *   entry={{
 *     id: '1',
 *     timestamp: new Date(),
 *     topic: 'firewall',
 *     severity: 'warning',
 *     message: 'Connection dropped from 192.168.1.100'
 *   }}
 * />
 * ```
 */
export const LogEntry = React.memo(
  React.forwardRef<HTMLDivElement, LogEntryProps>(
    (
      {
        entry,
        showDate = false,
        isBookmarked = false,
        onToggleBookmark,
        searchTerm,
        compact = false,
        className,
        ...props
      },
      ref
    ) => {
      const { timestamp, topic, severity, message } = entry;
      const [copied, setCopied] = React.useState(false);

      const handleCopy = React.useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = `[${new Date(timestamp).toISOString()}] [${topic}] [${severity}] ${message}`;
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          console.error('Failed to copy');
        }
      }, [timestamp, topic, severity, message]);

      const handleBookmark = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBookmark?.(entry);
      }, [entry, onToggleBookmark]);

      // Highlight search term in message
      const renderMessage = React.useMemo(() => {
        if (!searchTerm?.trim()) {
          return message;
        }

        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        const parts = message.split(regex);

        return parts.map((part, index) =>
          regex.test(part) ? (
            <mark
              key={index}
              className="bg-primary-200 dark:bg-primary-700 rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        );
      }, [searchTerm, message]);

      // Compact layout for mobile
      if (compact) {
        return (
          <div
            ref={ref}
            className={cn(
              'group flex flex-col gap-1.5 py-2 px-3 text-sm border-b border-slate-200 dark:border-slate-700',
              'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
              className
            )}
            {...props}
          >
            {/* Top row: time + severity */}
            <div className="flex items-center gap-2">
              <time
                className="text-slate-500 dark:text-slate-400 font-mono text-xs"
                dateTime={new Date(timestamp).toISOString()}
              >
                {formatTimestamp(timestamp, showDate)}
              </time>
              <SeverityBadge severity={severity} />
              <span className={cn(topicBadgeVariants({ topic }), 'text-[10px] px-1.5 py-0')}>
                {formatTopicLabel(topic)}
              </span>

              {/* Actions */}
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleBookmark && (
                  <button
                    onClick={handleBookmark}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Pin
                      className={cn(
                        'h-3 w-3',
                        isBookmarked ? 'fill-primary-500 text-primary-500' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label="Copy log entry"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Message */}
            <p className="text-slate-900 dark:text-slate-50 text-xs break-words line-clamp-2">
              {renderMessage}
            </p>
          </div>
        );
      }

      // Desktop layout
      return (
        <div
          ref={ref}
          className={cn(
            'group flex items-start gap-3 py-3 px-4 text-sm border-b border-slate-200 dark:border-slate-700',
            'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
            className
          )}
          {...props}
        >
          {/* Timestamp */}
          <time
            className="text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap shrink-0 w-20 md:w-28 font-medium"
            dateTime={new Date(timestamp).toISOString()}
          >
            {formatTimestamp(timestamp, showDate)}
          </time>

          {/* Topic Badge - hidden on small screens */}
          <span className={cn(topicBadgeVariants({ topic }), 'shrink-0 hidden sm:inline-flex')}>
            {formatTopicLabel(topic)}
          </span>

          {/* Severity Badge */}
          <SeverityBadge severity={severity} />

          {/* Message */}
          <p className="flex-1 text-slate-900 dark:text-slate-50 break-words leading-relaxed min-w-0">
            {renderMessage}
          </p>

          {/* Actions - shown on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onToggleBookmark && (
              <button
                onClick={handleBookmark}
                className="p-1.5 rounded-button hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              >
                <Pin
                  className={cn(
                    'h-4 w-4',
                    isBookmarked ? 'fill-primary-500 text-primary-500' : 'text-muted-foreground'
                  )}
                />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-button hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Copy log entry"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      );
    }
  )
);

LogEntry.displayName = 'LogEntry';

/**
 * Formats topic enum to human-readable label
 */
function formatTopicLabel(topic: LogTopic): string {
  const labelMap: Record<LogTopic, string> = {
    system: 'System',
    firewall: 'Firewall',
    wireless: 'Wireless',
    dhcp: 'DHCP',
    dns: 'DNS',
    ppp: 'PPP',
    vpn: 'VPN',
    interface: 'Interface',
    route: 'Route',
    script: 'Script',
    critical: 'Critical',
    info: 'Info',
    warning: 'Warning',
    error: 'Error',
  };

  return labelMap[topic] || topic;
}

export { topicBadgeVariants };
