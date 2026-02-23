import { useMemo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useVlanTopology } from '../../hooks/use-vlan-topology';
import { VlanTopologyDesktop } from './VlanTopologyDesktop';
import { VlanTopologyMobile } from './VlanTopologyMobile';

/**
 * VLAN Topology Component - Main wrapper
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Visualizes VLAN hierarchy: Parent Interfaces → VLANs
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: Hierarchical tree visualization with collapsible nodes
 * - Mobile: Vertical card layout with touch-friendly interactions
 *
 * @example
 * ```tsx
 * <VlanTopology routerId={routerId} onVlanSelect={handleSelect} />
 * ```
 */
export interface VlanTopologyProps {
  /** Router ID to fetch VLANs for */
  routerId: string;
  /** Optional callback when VLAN is selected */
  onVlanSelect?: (vlanId: string) => void;
}

/**
 * VLAN Topology - Main wrapper with platform detection
 */
export function VlanTopology({ routerId, onVlanSelect }: VlanTopologyProps) {
  const platform = usePlatform();
  const topologyData = useVlanTopology(routerId);

  // Memoized shared props for both presenters
  const sharedProps = useMemo(
    () => ({
      ...topologyData,
      routerId,
      onVlanSelect,
    }),
    [topologyData, routerId, onVlanSelect]
  );

  return platform === 'mobile' ? (
    <VlanTopologyMobile {...sharedProps} />
  ) : (
    <VlanTopologyDesktop {...sharedProps} />
  );
}
