/**
 * TracerouteHopsList - Component to display traceroute hops
 *
 * Displays a list of discovered hops with latency color-coding:
 * - Green: <50ms (excellent)
 * - Yellow: 50-150ms (acceptable)
 * - Red: >150ms (poor)
 * - Gray: timeout (no response)
 */
import type { TracerouteHop } from './TracerouteTool.types';
/**
 * Props for TracerouteHopsList component
 */
interface TracerouteHopsListProps {
    /** List of discovered hops from traceroute execution */
    hops: TracerouteHop[];
    /** Whether traceroute is currently running (shows loading state for next hop) */
    isRunning: boolean;
}
/**
 * TracerouteHopsList component
 *
 * Displays hops in a scrollable list with latency color-coding.
 * Uses semantic color tokens for latency indicators (success/warning/error).
 * IP addresses and technical data rendered in monospace font (JetBrains Mono).
 *
 * @example
 * ```tsx
 * <TracerouteHopsList hops={hops} isRunning={false} />
 * ```
 */
export declare const TracerouteHopsList: import("react").NamedExoticComponent<TracerouteHopsListProps>;
export {};
//# sourceMappingURL=TracerouteHopsList.d.ts.map