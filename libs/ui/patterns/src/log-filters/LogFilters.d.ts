/**
 * LogFilters Component
 * Multi-select filters for log topics and severities
 * Epic 0.8: System Logs - Stories 0.8.2 & 0.8.3
 */
import * as React from 'react';
import type { LogTopic, LogSeverity } from '@nasnet/core/types';
export interface LogFiltersProps {
    /**
     * Currently selected topics
     */
    topics: LogTopic[];
    /**
     * Callback when topics change
     */
    onTopicsChange: (topics: LogTopic[]) => void;
    /**
     * Currently selected severities
     */
    severities: LogSeverity[];
    /**
     * Callback when severities change
     */
    onSeveritiesChange: (severities: LogSeverity[]) => void;
    /**
     * Additional CSS class names
     */
    className?: string;
}
/**
 * LogFilters Component
 *
 * Provides multi-select filtering for log topics and severities with:
 * - Dropdown to select multiple topics
 * - Dropdown to select multiple severities
 * - Dismissible badges for selected items
 * - Clear all filters button
 * - Keyboard accessible
 * - AND logic between topics and severities
 *
 * @example
 * ```tsx
 * <LogFilters
 *   topics={['firewall', 'wireless']}
 *   onTopicsChange={(topics) => setTopics(topics)}
 *   severities={['error', 'critical']}
 *   onSeveritiesChange={(severities) => setSeverities(severities)}
 * />
 * ```
 */
declare function LogFiltersComponent({ topics, onTopicsChange, severities, onSeveritiesChange, className, }: LogFiltersProps): import("react/jsx-runtime").JSX.Element;
export declare const LogFilters: React.MemoExoticComponent<typeof LogFiltersComponent>;
export {};
//# sourceMappingURL=LogFilters.d.ts.map