/**
 * Network Topology Visualization
 *
 * A Layer 2 pattern component for visualizing network configurations.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * import { NetworkTopology } from '@nasnet/ui/patterns';
 *
 * <NetworkTopology
 *   router={{ id: '1', name: 'Main Router', status: 'online' }}
 *   wanInterfaces={[
 *     { id: 'wan1', name: 'WAN', status: 'connected', ip: '203.0.113.1' }
 *   ]}
 *   lanNetworks={[
 *     { id: 'lan1', name: 'LAN', cidr: '192.168.1.0/24', gateway: '192.168.1.1' }
 *   ]}
 * />
 * ```
 *
 * @see ADR-017: Three-Layer Component Architecture
 * @see ADR-018: Headless + Platform Presenters
 * @see NAS-4A.19: Build Network Topology Visualization
 */

// Main component (auto-detecting wrapper)
export { NetworkTopology } from './NetworkTopology';
export type { ExtendedNetworkTopologyProps } from './NetworkTopology';

// Platform-specific presenters (for direct use if needed)
export { NetworkTopologyDesktop } from './NetworkTopology.Desktop';
export type { NetworkTopologyDesktopProps } from './NetworkTopology.Desktop';

export { NetworkTopologyMobile } from './NetworkTopology.Mobile';
export type { NetworkTopologyMobileProps } from './NetworkTopology.Mobile';

// Headless hook
export { useNetworkTopology } from './useNetworkTopology';
export type {
  UseNetworkTopologyResult,
  UseNetworkTopologyOptions,
} from './useNetworkTopology';

// Sub-components
export { ConnectionPath, ConnectionPathStatic } from './ConnectionPath';
export type { ConnectionPathProps } from './ConnectionPath';

export { TopologyTooltip, TopologyTooltipContent } from './TopologyTooltip';
export type { TopologyTooltipProps } from './TopologyTooltip';

// Icons
export {
  RouterIcon,
  WanIcon,
  LanIcon,
  DeviceIcon,
} from './icons';
export type {
  RouterIconProps,
  WanIconProps,
  LanIconProps,
  DeviceIconProps,
  DeviceType,
} from './icons';

// Types
export type {
  NetworkTopologyProps,
  RouterInfo,
  WanInterface,
  LanNetwork,
  Device,
  TopologyNode,
  TopologyConnection,
  ConnectionPathData,
  TooltipContent,
  LayoutConfig,
  NodePosition,
  ContainerDimensions,
} from './types';
