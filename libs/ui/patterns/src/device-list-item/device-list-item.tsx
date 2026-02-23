/**
 * DeviceListItem Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */

import * as React from 'react';
import { useCallback } from 'react';

import { cn } from '@nasnet/ui/primitives';

import { DeviceListItemDesktop } from './device-list-item-desktop';
import { DeviceListItemMobile } from './device-list-item-mobile';
import { DeviceListItemTablet } from './device-list-item-tablet';
import { useDeviceListItem } from './use-device-list-item';

import type { DeviceListItemProps } from './device-list-item.types';

/**
 * DeviceListItem Component
 *
 * Displays connected devices from DHCP leases with enriched information.
 * Auto-detects platform (mobile/tablet/desktop) and renders the appropriate presenter.
 * Uses CSS media queries for SSR compatibility.
 *
 * Features:
 * - Device type detection with icons
 * - "New" device badge with pulse animation (30 seconds)
 * - Connection duration display
 * - Platform-responsive presenters
 * - Privacy mode for hostname masking
 * - Expandable details (mobile/tablet)
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DeviceListItem device={connectedDevice} />
 *
 * // With click handler
 * <DeviceListItem
 *   device={device}
 *   onClick={(d) => showDeviceDetails(d)}
 * />
 *
 * // Privacy mode
 * <DeviceListItem
 *   device={device}
 *   showHostname={false}
 * />
 * ```
 */
/**
 * Internal component function
 */
function DeviceListItemComponent({
  device,
  showHostname = true,
  onClick,
  className,
  id,
}: DeviceListItemProps) {
  // Compute state using the headless hook
  const state = useDeviceListItem({
    device,
    showHostname,
  });

  // Handle click
  const handleClick = useCallback(() => {
    onClick?.(device);
  }, [onClick, device]);

  // Props for presenters
  const presenterProps = {
    state,
    device,
    onClick: onClick ? handleClick : undefined,
    className: '',
    id,
  };

  // Auto-detect platform using CSS media queries for SSR compatibility
  // This avoids hydration mismatches and works on first render
  return (
    <div className={cn('contents', className)} role="presentation">
      {/* Mobile: shown on small screens (<640px) */}
      <div className="sm:hidden">
        <DeviceListItemMobile {...presenterProps} />
      </div>

      {/* Tablet: shown on medium screens (640px-1024px) */}
      <div className="hidden sm:block lg:hidden">
        <DeviceListItemTablet {...presenterProps} />
      </div>

      {/* Desktop: shown on large screens (>=1024px) */}
      <div className="hidden lg:block">
        <DeviceListItemDesktop {...presenterProps} />
      </div>
    </div>
  );
}

/**
 * Memoized DeviceListItem component
 */
export const DeviceListItem = React.memo(DeviceListItemComponent);
DeviceListItem.displayName = 'DeviceListItem';
