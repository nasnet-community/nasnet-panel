import { memo, useCallback } from 'react';
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
 * @param className - Optional CSS class for styling
 * @description Platform-responsive bridge list with automatic presenter selection
 */
export interface BridgeListProps {
  routerId: string;
  className?: string;
}

export const BridgeList = memo(function BridgeList({ routerId, className }: BridgeListProps) {
  const platform = usePlatform();
  const bridgeListState = useBridgeList(routerId);

  // Memoized close handler
  const handleCloseBridgeDetail = useCallback(() => {
    bridgeListState.setSelectedBridgeId(null);
  }, [bridgeListState]);

  // Shared props for both presenters
  const sharedProps = {
    ...bridgeListState,
    routerId,
    className,
  };

  return (
    <>
      {platform === 'mobile' ?
        <BridgeListMobile {...sharedProps} />
      : <BridgeListDesktop {...sharedProps} />}

      {/* Detail panel - shown when a bridge is selected */}
      <BridgeDetail
        routerId={routerId}
        bridgeId={bridgeListState.selectedBridgeId}
        open={bridgeListState.selectedBridgeId !== null}
        onClose={handleCloseBridgeDetail}
      />
    </>
  );
});

BridgeList.displayName = 'BridgeList';
