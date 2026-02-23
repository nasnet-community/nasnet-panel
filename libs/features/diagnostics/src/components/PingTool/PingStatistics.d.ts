/**
 * PingStatistics Component
 *
 * Displays ping test statistics in a semantic definition list.
 * Shows:
 * - Packets sent/received/lost
 * - Packet loss percentage with color coding
 * - Min/Avg/Max RTT
 * - Standard deviation
 *
 * Uses semantic HTML (dl/dt/dd) for accessibility.
 */
import type { PingStatistics as PingStatisticsType } from './PingTool.types';
/**
 * Props for PingStatistics component
 */
export interface PingStatisticsProps {
    /** Statistics to display */
    statistics: PingStatisticsType;
    /** Optional additional CSS classes */
    className?: string;
}
/**
 * PingStatistics - Display ping test statistics
 *
 * Semantic component using dl/dt/dd for accessibility.
 * Color-codes packet loss based on severity.
 * Shows RTT values in monospace font for technical readability.
 *
 * @example
 * ```tsx
 * <PingStatistics
 *   statistics={{
 *     sent: 10,
 *     received: 9,
 *     lost: 1,
 *     lossPercent: 10,
 *     minRtt: 11.8,
 *     avgRtt: 12.9,
 *     maxRtt: 14.2,
 *     stdDev: 0.95,
 *   }}
 * />
 * ```
 */
export declare const PingStatistics: import("react").NamedExoticComponent<PingStatisticsProps>;
//# sourceMappingURL=PingStatistics.d.ts.map