/**
 * Headless hook for Service Traffic Statistics Panel
 * Manages traffic state, rate calculations, and quota monitoring
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * @description
 * Provides business logic for service traffic monitoring without JSX.
 * Handles real-time subscription updates, rate calculations with BigInt precision,
 * and quota threshold detection.
 *
 * @see service-traffic-panel.types.ts for type definitions
 */
import type { ServiceTrafficState } from './service-traffic-panel.types';
/**
 * Options for useServiceTrafficPanel hook
 */
export interface UseServiceTrafficPanelOptions {
    /** Router ID */
    routerID: string;
    /** Service instance ID */
    instanceID: string;
    /** Number of hours of historical data to fetch (default: 24) */
    historyHours?: number;
}
/**
 * Headless hook for service traffic statistics panel
 *
 * Manages:
 * - Real-time traffic statistics via GraphQL subscription
 * - Rate calculations using BigInt arithmetic
 * - Quota monitoring with warning/limit detection
 * - Counter reset detection
 *
 * @example
 * ```tsx
 * const trafficState = useServiceTrafficPanel({
 *   routerID: 'router-1',
 *   instanceID: 'xray-instance-1',
 *   historyHours: 24,
 * });
 *
 * if (trafficState.stats) {
 *   console.log('Upload Rate:', formatBitsPerSec(trafficState.uploadRate || 0n));
 *   console.log('Download Rate:', formatBitsPerSec(trafficState.downloadRate || 0n));
 *   console.log('Quota Usage:', trafficState.quotaUsagePercent, '%');
 * }
 * ```
 */
export declare function useServiceTrafficPanel({ routerID, instanceID, historyHours, }: UseServiceTrafficPanelOptions): ServiceTrafficState;
//# sourceMappingURL=use-service-traffic-panel.d.ts.map