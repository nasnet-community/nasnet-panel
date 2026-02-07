import { usePlatform } from '@nasnet/ui/layouts';
import { useVlanList } from '../../hooks/use-vlan-list';
import { VlanListDesktop } from './VlanListDesktop';
import { VlanListMobile } from './VlanListMobile';

/**
 * VLAN List Component - Main wrapper with headless logic
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: DataTable with fixed sidebar
 * - Mobile: Card-based layout with 44px touch targets
 *
 * @param routerId - Router ID to fetch VLANs for
 */
export interface VlanListProps {
  routerId: string;
}

export function VlanList({ routerId }: VlanListProps) {
  const platform = usePlatform();
  const vlanListState = useVlanList(routerId);

  // Shared props for both presenters
  const sharedProps = {
    ...vlanListState,
    routerId,
  };

  return (
    <>
      {platform === 'mobile' ? (
        <VlanListMobile {...sharedProps} />
      ) : (
        <VlanListDesktop {...sharedProps} />
      )}
    </>
  );
}
