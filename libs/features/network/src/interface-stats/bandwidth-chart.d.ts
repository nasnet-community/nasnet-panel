/**
 * BandwidthChart Component
 * Historical bandwidth visualization with recharts
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 5)
 */
import React from 'react';
import type { StatsTimeRangeInput } from '@nasnet/api-client/generated';
/**
 * Props for BandwidthChart component
 */
export interface BandwidthChartProps {
    /** Router ID */
    routerId: string;
    /** Interface ID */
    interfaceId: string;
    /** Interface display name */
    interfaceName: string;
    /** Time range for historical data */
    timeRange: StatsTimeRangeInput;
    /** Aggregation interval (e.g., '5m', '1h') */
    interval?: string;
    /** Show legend */
    showLegend?: boolean;
    /** Additional CSS classes */
    className?: string;
}
export declare const BandwidthChart: React.MemoExoticComponent<React.ForwardRefExoticComponent<BandwidthChartProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=bandwidth-chart.d.ts.map