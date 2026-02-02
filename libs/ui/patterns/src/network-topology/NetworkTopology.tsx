/**
 * NetworkTopology
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
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
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { NetworkTopologyDesktop } from './NetworkTopology.Desktop';
import { NetworkTopologyMobile } from './NetworkTopology.Mobile';

import type { NetworkTopologyProps } from './types';

export interface ExtendedNetworkTopologyProps extends NetworkTopologyProps {
  /** Show devices in the topology */
  showDevices?: boolean;
  /** Override for mobile: initially expand sections */
  defaultExpanded?: boolean;
}

/**
 * NetworkTopology - Network visualization component
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based list view with collapsible sections
 * - Tablet/Desktop (>=640px): Full SVG diagram visualization
 *
 * Features:
 * - WAN interfaces on the left (connected to Internet)
 * - Router at center
 * - LAN networks on the right
 * - Optional device nodes
 * - Interactive tooltips with details
 * - Full keyboard navigation
 * - WCAG AAA accessibility
 *
 * @see ADR-018: Headless + Platform Presenters
 * @see NAS-4A.19: Build Network Topology Visualization
 */
function NetworkTopologyComponent(props: ExtendedNetworkTopologyProps) {
  const { presenter, ...rest } = props;

  // Use platform detection unless presenter is explicitly overridden
  const detectedPlatform = usePlatform();
  const activePlatform = presenter || detectedPlatform;

  switch (activePlatform) {
    case 'mobile':
      return <NetworkTopologyMobile {...rest} />;
    case 'tablet':
    case 'desktop':
    default:
      return <NetworkTopologyDesktop {...rest} />;
  }
}

// Wrap with memo for performance optimization
export const NetworkTopology = memo(NetworkTopologyComponent);

// Set display name for React DevTools
NetworkTopology.displayName = 'NetworkTopology';

// Re-export types for convenience
export type { NetworkTopologyProps } from './types';
