/**
 * Log Entry Component
 * Displays a single system log entry with timestamp, topic badge, severity badge, and message
 * Epic 0.8: System Logs - Stories 0.8.1 & 0.8.3 + Enhanced Features
 */
import * as React from 'react';
import type { LogEntry as LogEntryType } from '@nasnet/core/types';
/**
 * Topic badge styling variants
 * Maps LogTopic to color classes
 */
declare const topicBadgeVariants: (props?: ({
    topic?: "error" | "script" | "warning" | "info" | "vpn" | "firewall" | "system" | "dhcp" | "interface" | "critical" | "wireless" | "dns" | "ppp" | "route" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
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
export declare const LogEntry: React.MemoExoticComponent<React.ForwardRefExoticComponent<LogEntryProps & React.RefAttributes<HTMLDivElement>>>;
export { topicBadgeVariants };
//# sourceMappingURL=LogEntry.d.ts.map