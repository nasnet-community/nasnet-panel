/**
 * Device Card Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import * as React from 'react';
import { useCallback } from 'react';

import { cn } from '@nasnet/ui/primitives';

import { DeviceCardCompact } from './device-card-compact';
import { DeviceCardDesktop } from './device-card-desktop';
import { DeviceCardMobile } from './device-card-mobile';
import { useDeviceCard } from './use-device-card';

import type { DeviceCardProps } from './device-card.types';

/**
 * Device Card Component
 *
 * Displays discovered network devices with type detection, online status,
 * vendor lookup, and interactive actions.
 *
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 * Uses CSS media queries for SSR compatibility.
 *
 * Features:
 * - Device type inference from MAC vendor lookup
 * - Online/offline status with visual indicators
 * - Interactive actions (rename, static IP, block)
 * - Platform-responsive (mobile = bottom sheet, desktop = dropdown)
 * - Compact mode for sidebar/widget contexts
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DeviceCard device={discoveredDevice} />
 *
 * // With actions
 * <DeviceCard
 *   device={device}
 *   onConfigure={(d) => openConfig(d)}
 *   onBlock={(d) => blockDevice(d)}
 *   onRename={(d, name) => renameDevice(d, name)}
 * />
 *
 * // Compact mode for sidebar
 * <DeviceCard
 *   device={device}
 *   compact
 *   onClick={(d) => setSelectedDevice(d)}
 * />
 * ```
 */
/**
 * Internal component function
 */
function DeviceCardComponent({
  device,
  onConfigure,
  onBlock,
  onRename,
  onAssignStaticIp,
  compact = false,
  showActions = true,
  className,
  id,
  isSelected = false,
  onClick,
}: DeviceCardProps) {
  // Compute state using the headless hook
  const state = useDeviceCard({
    device,
    onConfigure,
    onBlock,
    onRename,
    onAssignStaticIp,
  });

  // Handle card click
  const handleClick = useCallback(() => {
    onClick?.(device);
  }, [onClick, device]);

  // Handle rename action
  const handleRename = useCallback(
    (newName: string) => {
      onRename?.(device, newName);
    },
    [onRename, device]
  );

  // Handle static IP assignment
  const handleAssignStaticIp = useCallback(
    (ip: string) => {
      onAssignStaticIp?.(device, ip);
    },
    [onAssignStaticIp, device]
  );

  // Props for presenters
  const presenterProps = {
    state,
    device,
    compact,
    showActions,
    className: '',
    id,
    isSelected,
    onClick: onClick ? handleClick : undefined,
    onRename: handleRename,
    onAssignStaticIp: handleAssignStaticIp,
  };

  // Compact mode - use compact presenter regardless of platform
  if (compact) {
    return <DeviceCardCompact {...presenterProps} className={className} />;
  }

  // Auto-detect platform using CSS media queries for SSR compatibility
  // This avoids hydration mismatches and works on first render
  return (
    <div
      className={cn('contents', className)}
      role="presentation"
    >
      {/* Mobile: shown on small screens (<640px) */}
      <div className="sm:hidden">
        <DeviceCardMobile {...presenterProps} />
      </div>

      {/* Desktop: shown on larger screens (>=640px) */}
      <div className="hidden sm:block">
        <DeviceCardDesktop {...presenterProps} />
      </div>
    </div>
  );
}

/**
 * Memoized DeviceCard component
 */
export const DeviceCard = React.memo(DeviceCardComponent);
DeviceCard.displayName = 'DeviceCard';
