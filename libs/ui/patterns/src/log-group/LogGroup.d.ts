/**
 * Log Group Component
 * Displays a collapsible group of related log entries
 * Epic 0.8: System Logs - Log Correlation/Grouping
 */
import * as React from 'react';
import type { LogEntry } from '@nasnet/core/types';
export interface LogGroupData {
    id: string;
    startTime: Date;
    endTime: Date;
    entries: LogEntry[];
    primaryTopic: string;
    severityLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}
export interface LogGroupProps {
    /**
     * The group data
     */
    group: LogGroupData;
    /**
     * Search term for highlighting
     */
    searchTerm?: string;
    /**
     * Click handler for individual entries
     */
    onEntryClick?: (entry: LogEntry) => void;
    /**
     * Whether an entry is bookmarked
     */
    isBookmarked?: (entryId: string) => boolean;
    /**
     * Toggle bookmark handler
     */
    onToggleBookmark?: (entry: LogEntry) => void;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * LogGroup Component
 */
declare function LogGroupComponent({ group, searchTerm, onEntryClick, isBookmarked, onToggleBookmark, className, }: LogGroupProps): import("react/jsx-runtime").JSX.Element;
export declare const LogGroup: React.MemoExoticComponent<typeof LogGroupComponent>;
/**
 * Props for LogGroupList
 */
export interface LogGroupListProps {
    /**
     * Groups to display
     */
    groups: LogGroupData[];
    /**
     * Search term for highlighting
     */
    searchTerm?: string;
    /**
     * Entry click handler
     */
    onEntryClick?: (entry: LogEntry) => void;
    /**
     * Check if entry is bookmarked
     */
    isBookmarked?: (entryId: string) => boolean;
    /**
     * Toggle bookmark
     */
    onToggleBookmark?: (entry: LogEntry) => void;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * LogGroupList Component
 * Renders a list of log groups
 */
declare function LogGroupListComponent({ groups, searchTerm, onEntryClick, isBookmarked, onToggleBookmark, className, }: LogGroupListProps): import("react/jsx-runtime").JSX.Element;
export declare const LogGroupList: React.MemoExoticComponent<typeof LogGroupListComponent>;
export {};
//# sourceMappingURL=LogGroup.d.ts.map