import { useMemo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useVlanList } from '../../hooks/use-vlan-list';
import { VlanListDesktop } from './VlanListDesktop';
import { VlanListMobile } from './VlanListMobile';

/**
 * VLAN List Component - Main wrapper with headless logic.
 * Follows Headless + Platform Presenters pattern.
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Desktop (≥640px): DataTable with dense presentation
 *
 * @param routerId - Router ID to fetch VLANs for
 */
export interface VlanListProps {
  routerId: string;
  className?: string;
}

export function VlanList({ routerId, className }: VlanListProps) {
  const platform = usePlatform();
  const vlanListState = useVlanList(routerId);

  // Shared props memoized for stability
  const sharedProps = useMemo(
    () => ({
      ...vlanListState,
      routerId,
    }),
    [vlanListState, routerId]
  );

  return (
    <div className={className}>
      {platform === 'mobile' ? (
        <VlanListMobile {...sharedProps} />
      ) : (
        <VlanListDesktop {...sharedProps} />
      )}
    </div>
  );
}

VlanList.displayName = 'VlanList';
