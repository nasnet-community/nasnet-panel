import { usePlatform } from '@nasnet/ui/layouts';
import { useInterfaceDetail } from '@nasnet/api-client/queries';
import { InterfaceDetailDesktop } from './InterfaceDetailDesktop';
import { InterfaceDetailMobile } from './InterfaceDetailMobile';

/**
 * Interface Detail Component - Main wrapper with platform detection
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Displays detailed information about a single network interface
 * - Desktop: Right-side Sheet panel
 * - Mobile: Full-screen dialog
 */
export interface InterfaceDetailProps {
  routerId: string;
  interfaceId: string | null;
  open: boolean;
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

  // Shared props for both presenters
  const sharedProps = {
    interface: interfaceData,
    loading,
    error,
    open,
    onClose,
    routerId,
  };

  return platform === 'mobile' ? (
    <InterfaceDetailMobile {...sharedProps} />
  ) : (
    <InterfaceDetailDesktop {...sharedProps} />
  );
}
