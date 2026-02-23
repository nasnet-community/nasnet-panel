import { useMemo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useInterfaceDetail } from '@nasnet/api-client/queries';
import { InterfaceDetailDesktop } from './InterfaceDetailDesktop';
import { InterfaceDetailMobile } from './InterfaceDetailMobile';

/**
 * Interface Detail Component - Main wrapper with platform detection.
 *
 * Follows Headless + Platform Presenters pattern. Displays detailed information
 * about a single network interface with platform-specific rendering:
 * - Desktop: Right-side Sheet panel with tabs
 * - Mobile: Full-screen dialog with progressive disclosure
 *
 * @description Renders platform-specific detail panel for interface configuration, status, and traffic
 */
export interface InterfaceDetailProps {
  /** Router ID for API requests */
  routerId: string;
  /** Interface ID to display, or null to hide panel */
  interfaceId: string | null;
  /** Whether the detail panel is open */
  open: boolean;
  /** Callback fired when user closes the panel */
  onClose: () => void;
}

export function InterfaceDetail({
  routerId,
  interfaceId,
  open,
  onClose,
}: InterfaceDetailProps) {
  const platform = usePlatform();

  // Fetch interface details
  const { interface: interfaceData, loading, error } = useInterfaceDetail(
    routerId,
    interfaceId || ''
  );

  // Memoize shared props to prevent unnecessary re-renders
  const sharedProps = useMemo(
    () => ({
      interface: interfaceData,
      loading,
      error,
      open,
      onClose,
      routerId,
    }),
    [interfaceData, loading, error, open, onClose, routerId]
  );

  return platform === 'mobile' ? (
    <InterfaceDetailMobile {...sharedProps} />
  ) : (
    <InterfaceDetailDesktop {...sharedProps} />
  );
}

InterfaceDetail.displayName = 'InterfaceDetail';
