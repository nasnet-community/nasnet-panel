/**
 * LatencyGraph Component
 *
 * Visualizes ping latency over time using Recharts.
 * Features:
 * - Line chart showing RTT for each ping
 * - Reference lines for warning (100ms) and critical (200ms) thresholds
 * - Gaps in line for timeouts (connectNulls=false)
 * - Responsive container that adapts to parent width
 */
import type { PingResult } from './PingTool.types';
/**
 * Props for LatencyGraph component
 */
export interface LatencyGraphProps {
    /** Array of ping results to visualize */
    results: PingResult[];
    /** Optional additional CSS classes */
    className?: string;
}
/**
 * LatencyGraph - Visualize ping latency over time
 *
 * Shows latency trend with warning/critical thresholds.
 * Gaps in the line indicate timeouts or failed pings.
 * Uses monospace font for latency data display.
 *
 * @example
 * ```tsx
 * <LatencyGraph
 *   results={[
 *     { seq: 1, time: 12.5, ... },
 *     { seq: 2, time: null, error: 'timeout', ... },
 *     { seq: 3, time: 14.2, ... },
 *   ]}
 * />
 * ```
 */
export declare const LatencyGraph: import("react").NamedExoticComponent<LatencyGraphProps>;
//# sourceMappingURL=LatencyGraph.d.ts.map