/**
 * Headless hook for Interface Statistics Panel
 * Manages statistics state, rate calculations, and error detection
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * @see interface-stats-panel.types.ts for type definitions
 */
import type { InterfaceStatsState } from './interface-stats-panel.types';
/**
 * Options for useInterfaceStatsPanel hook
 */
export interface UseInterfaceStatsPanelOptions {
    /** Router ID */
    routerId: string;
    /** Interface ID */
    interfaceId: string;
    /** Polling interval for subscription (e.g., '1s', '5s', '10s', '30s') */
    pollingInterval?: string;
}
/**
 * Headless hook for interface statistics panel
 *
 * Manages:
 * - Real-time statistics via GraphQL subscription
 * - Rate calculations using BigInt arithmetic
 * - Error rate percentage calculation
 * - Counter reset detection
 *
 * @example
 * ```tsx
 * const statsState = useInterfaceStatsPanel({
 *   routerId: 'router-1',
 *   interfaceId: 'ether1',
 *   pollingInterval: '5s',
 * });
 *
 * if (statsState.stats) {
 *   console.log('TX Rate:', formatBitsPerSec(statsState.rates?.txRate || 0n));
 *   console.log('Error Rate:', statsState.errorRate.toFixed(3), '%');
 * }
 * ```
 */
export declare function useInterfaceStatsPanel({ routerId, interfaceId, pollingInterval, }: UseInterfaceStatsPanelOptions): InterfaceStatsState;
//# sourceMappingURL=use-interface-stats-panel.d.ts.map