/**
 * useNetworkTopology Hook
 *
 * Headless hook that provides all business logic for the Network Topology visualization.
 * Implements the WAN-Router-LAN layout algorithm and handles responsive scaling.
 *
 * @see ADR-018: Headless + Platform Presenters
 * @see NAS-4A.19: Build Network Topology Visualization
 */
import type { NetworkTopologyProps, UseNetworkTopologyResult, UseNetworkTopologyOptions } from './types';
/**
 * Hook that computes the network topology layout and provides interaction handlers
 *
 * @param props - Network topology component props
 * @param options - Optional configuration for the layout
 * @returns Computed nodes, connections, and utility functions
 *
 * @example
 * ```tsx
 * const { nodes, connections, viewBox, getTooltipContent } = useNetworkTopology({
 *   router: { id: '1', name: 'Main Router', status: 'online' },
 *   wanInterfaces: [{ id: 'wan1', name: 'WAN', status: 'connected', ip: '203.0.113.1' }],
 *   lanNetworks: [{ id: 'lan1', name: 'LAN', cidr: '192.168.1.0/24', gateway: '192.168.1.1' }],
 * });
 * ```
 */
export declare function useNetworkTopology(props: NetworkTopologyProps, options?: UseNetworkTopologyOptions): UseNetworkTopologyResult;
export type { UseNetworkTopologyResult, UseNetworkTopologyOptions };
//# sourceMappingURL=useNetworkTopology.d.ts.map