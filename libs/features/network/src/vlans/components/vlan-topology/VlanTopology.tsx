import { usePlatform } from '@nasnet/ui/layouts';
import { useVlanTopology } from '../../hooks/use-vlan-topology';
import { VlanTopologyDesktop } from './VlanTopologyDesktop';
import { VlanTopologyMobile } from './VlanTopologyMobile';

/**
 * VLAN Topology Component - Main wrapper
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Visualizes VLAN hierarchy: Parent Interfaces → VLANs
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: Hierarchical tree visualization
 * - Mobile: Vertical card layout
 *
 * @param routerId - Router ID to fetch VLANs for
 */
export interface VlanTopologyProps {
  routerId: string;
  /** Optional callback when VLAN is selected */
  onVlanSelect?: (vlanId: string) => void;
}

export function VlanTopology({ routerId, onVlanSelect }: VlanTopologyProps) {
  const platform = usePlatform();
  const topologyData = useVlanTopology(routerId);

  // Shared props for both presenters
  const sharedProps = {
    ...topologyData,
    routerId,
    onVlanSelect,
  };

  return platform === 'mobile' ? (
    <VlanTopologyMobile {...sharedProps} />
  ) : (
    <VlanTopologyDesktop {...sharedProps} />
  );
}
