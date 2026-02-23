/**
 * Log Stats Component
 * Displays statistics and severity distribution for logs
 * Epic 0.8: System Logs - Statistics Summary
 */
import type { LogEntry } from '@nasnet/core/types';
export interface LogStatsProps {
    /**
     * Log entries to compute stats from
     */
    logs: LogEntry[];
    /**
     * Last update timestamp
     */
    lastUpdated?: Date;
    /**
     * Whether data is currently loading
     */
    isLoading?: boolean;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * LogStats Component
 */
export declare function LogStats({ logs, lastUpdated, isLoading, className, }: LogStatsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LogStats.d.ts.map