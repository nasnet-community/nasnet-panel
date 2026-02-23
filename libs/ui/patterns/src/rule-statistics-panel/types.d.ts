/**
 * RuleStatisticsPanel Types
 *
 * Types for the firewall rule statistics panel component.
 */
import type { FilterRule } from '@nasnet/core/types';
/**
 * Counter history data point for charts
 */
export interface CounterHistoryEntry {
    timestamp: number;
    packets: number;
    bytes: number;
}
/**
 * Time range options for filtering history
 */
export type TimeRange = '1h' | '24h' | '7d';
/**
 * Props for RuleStatisticsPanel component
 */
export interface RuleStatisticsPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;
    /** The firewall rule to display statistics for */
    rule: FilterRule;
    /** Historical traffic data */
    historyData: CounterHistoryEntry[];
    /** CSV export handler */
    onExportCsv: () => void;
}
/**
 * Props for TrafficHistoryChart component
 */
export interface TrafficHistoryChartProps {
    /** Chart data */
    data: CounterHistoryEntry[];
    /** Chart height in pixels */
    height?: number;
    /** Optional class name */
    className?: string;
}
/**
 * Props for desktop presenter
 */
export interface RuleStatisticsPanelDesktopProps extends RuleStatisticsPanelProps {
}
/**
 * Props for mobile presenter
 */
export interface RuleStatisticsPanelMobileProps extends RuleStatisticsPanelProps {
}
//# sourceMappingURL=types.d.ts.map