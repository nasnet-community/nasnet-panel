/**
 * InterfaceStatusCard Component
 *
 * Displays interface status with platform-specific layout.
 * Uses Headless + Platform Presenters pattern (ADR-018).
 *
 * Features:
 * - Real-time status updates with pulse animation
 * - Traffic rate display (TX/RX)
 * - Link speed and IP address
 * - WCAG AAA accessible (keyboard navigation, screen reader support)
 * - Respects reduced motion preference
 */

import { usePlatform } from '@nasnet/ui/layouts';
import { InterfaceStatusCardDesktop } from './InterfaceStatusCard.Desktop';
import { InterfaceStatusCardMobile } from './InterfaceStatusCard.Mobile';
import type { InterfaceStatusCardProps } from './types';

/**
 * Interface status card with platform-specific presentation.
 * Auto-detects platform and renders appropriate presenter.
 *
 * @example
 * <InterfaceStatusCard
 *   interface={interfaceData}
 *   onSelect={(iface) => setSelectedInterface(iface)}
 * />
 */
export function InterfaceStatusCard(props: InterfaceStatusCardProps) {
  const platform = usePlatform();

  // Mobile and tablet use the compact mobile presenter
  // Desktop uses the full desktop presenter
  return platform === 'desktop' ? (
    <InterfaceStatusCardDesktop {...props} />
  ) : (
    <InterfaceStatusCardMobile {...props} />
  );
}

export default InterfaceStatusCard;
