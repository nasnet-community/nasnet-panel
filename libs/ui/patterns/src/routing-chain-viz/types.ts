/**
 * RoutingChainViz Types
 *
 * TypeScript interfaces for the RoutingChainViz pattern component.
 * Visualizes multi-hop routing chains: Device -> Service1 -> Service2 -> Internet.
 */

/** Routing mode for device identification */
export type RoutingMode = 'MAC' | 'IP';

/** Kill switch behavior when a hop fails */
export type KillSwitchMode = 'BLOCK_ALL' | 'FALLBACK_SERVICE' | 'ALLOW_DIRECT';

/** Health status for visual styling */
export type HopHealth = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/** A single hop in the routing chain */
export interface ChainHopData {
  id: string;
  order: number;
  serviceName: string;
  serviceType?: string;
  routingMark: string;
  latencyMs: number | null;
  healthy: boolean;
  killSwitchActive: boolean;
}

/** Complete routing chain data */
export interface RoutingChainData {
  id: string;
  deviceId: string;
  deviceName?: string | null;
  deviceMac?: string | null;
  deviceIp?: string | null;
  hops: ChainHopData[];
  active: boolean;
  routingMode: RoutingMode;
  killSwitchEnabled: boolean;
  killSwitchMode: KillSwitchMode;
  killSwitchActive: boolean;
  totalLatencyMs: number | null;
}

/** RoutingChainViz component props */
export interface RoutingChainVizProps {
  chain: RoutingChainData;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
  showLatency?: boolean;
  showKillSwitch?: boolean;
  onHopClick?: (hop: ChainHopData) => void;
  onKillSwitchToggle?: (enabled: boolean) => void;
  className?: string;
}

/** Computed state from the headless hook */
export interface UseRoutingChainVizReturn {
  chain: RoutingChainData | null;
  hops: ChainHopData[];
  totalHops: number;
  healthyHops: number;
  unhealthyHops: number;
  overallHealth: HopHealth;
  totalLatency: string;
  deviceLabel: string;
  killSwitchLabel: string;
  ariaLabel: string;
  isActive: boolean;
}

/** Props for platform-specific presenters */
export interface RoutingChainVizPresenterProps {
  state: UseRoutingChainVizReturn;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
  showLatency?: boolean;
  showKillSwitch?: boolean;
  onHopClick?: (hop: ChainHopData) => void;
  onKillSwitchToggle?: (enabled: boolean) => void;
  className?: string;
}
