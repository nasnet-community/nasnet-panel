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

import React, { useMemo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { InterfaceStatusCardDesktop } from './InterfaceStatusCard.Desktop';
import { InterfaceStatusCardMobile } from './InterfaceStatusCard.Mobile';
import type { InterfaceStatusCardProps } from './types';

/**
 * Interface status card with platform-specific presentation.
 * Auto-detects platform and renders appropriate presenter.
 *
 * Displays real-time interface status with traffic rates, link speed, and IP address.
 * Supports keyboard navigation and screen reader access.
 *
 * @description
 * Uses Headless + Platform Presenters pattern for adaptive rendering.
 * Mobile presenter optimized for 44px touch targets.
 * Desktop presenter shows full details in grid layout.
 *
 * @example
 * <InterfaceStatusCard
 *   interface={interfaceData}
 *   onSelect={(iface) => setSelectedInterface(iface)}
 * />
 */
const InterfaceStatusCardComponent = React.memo(function InterfaceStatusCard(
  props: InterfaceStatusCardProps
) {
  const platform = usePlatform();

  // Mobile and tablet use the compact mobile presenter
  // Desktop uses the full desktop presenter
  const presenter = useMemo(
    () =>
      platform === 'desktop' ?
        <InterfaceStatusCardDesktop {...props} />
      : <InterfaceStatusCardMobile {...props} />,
    [platform, props]
  );

  return presenter;
});

InterfaceStatusCardComponent.displayName = 'InterfaceStatusCard';

export const InterfaceStatusCard = InterfaceStatusCardComponent;
export default InterfaceStatusCard;
