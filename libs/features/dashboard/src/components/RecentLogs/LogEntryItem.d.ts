/**
 * LogEntryItem component for displaying individual log entries
 * Supports compact mode for mobile and highlight animation for new entries
 * Story NAS-5.6: Recent Logs with Filtering
 */
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
export declare const LogEntryItem: import("react").NamedExoticComponent<LogEntryItemProps>;
//# sourceMappingURL=LogEntryItem.d.ts.map