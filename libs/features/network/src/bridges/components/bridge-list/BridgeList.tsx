import { usePlatform } from '@nasnet/ui/layouts';
import { useBridgeList } from '../../hooks/use-bridge-list';
import { BridgeListDesktop } from './BridgeListDesktop';
import { BridgeListMobile } from './BridgeListMobile';
import { BridgeDetail } from '../bridge-detail';

/**
 * Bridge List Component - Main wrapper with headless logic
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: DataTable with fixed sidebar
 * - Mobile: Card-based layout with 44px touch targets
 *
 * @param routerId - Router ID to fetch bridges for
 */
export interface BridgeListProps {
  routerId: string;
}

export function BridgeList({ routerId }: BridgeListProps) {
  const platform = usePlatform();
  const bridgeListState = useBridgeList(routerId);

  // Shared props for both presenters
  const sharedProps = {
    ...bridgeListState,
    routerId,
  };

  return (
    <>
      {platform === 'mobile' ? (
        <BridgeListMobile {...sharedProps} />
      ) : (
        <BridgeListDesktop {...sharedProps} />
      )}

      {/* Detail panel - shown when a bridge is selected */}
      <BridgeDetail
        routerId={routerId}
        bridgeId={bridgeListState.selectedBridgeId}
        open={bridgeListState.selectedBridgeId !== null}
        onClose={() => bridgeListState.setSelectedBridgeId(null)}
      />
    </>
  );
}
