/**
 * Traffic Chart Component
 *
 * Line chart component for visualizing network bandwidth (download/upload) over time.
 * Built with SVG for performance and to stay within bundle size constraints.
 *
 * Features:
 * - Responsive SVG rendering with auto-scaling Y-axis
 * - Dual-line display: cyan (download), purple (upload)
 * - Area fill gradients for visual clarity
 * - Current speed summary display
 * - Dashed grid lines
 * - "Sample data" indicator for placeholder mode
 * - Fully responsive viewport
 *
 * @module @nasnet/ui/patterns/traffic-chart
 */
import * as React from 'react';
/**
 * Single data point for traffic chart
 *
 * Represents bandwidth at a single point in time
 */
export interface TrafficDataPoint {
    /** Timestamp or time label (e.g., "-1h", "-50m", "now") */
    time: string;
    /** Download speed in Mb/s */
    download: number;
    /** Upload speed in Mb/s */
    upload: number;
}
/**
 * Props for TrafficChart component
 */
export interface TrafficChartProps {
    /** Array of traffic data points to visualize */
    data?: TrafficDataPoint[];
    /** Chart title displayed in card header */
    title?: string;
    /** Whether to display loading skeleton (reserved for future use) */
    isLoading?: boolean;
    /** Show placeholder data and "Sample data" badge when no real data is available */
    showPlaceholder?: boolean;
    /** Height of the chart SVG area in pixels */
    height?: number;
    /** Additional CSS classes for the card wrapper */
    className?: string;
}
/**
 * TrafficChart - Network traffic visualization component
 */
declare const TrafficChart: React.MemoExoticComponent<React.ForwardRefExoticComponent<TrafficChartProps & React.RefAttributes<HTMLDivElement>>>;
export { TrafficChart };
//# sourceMappingURL=TrafficChart.d.ts.map