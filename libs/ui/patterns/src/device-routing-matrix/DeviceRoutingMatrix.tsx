/**
 * DeviceRoutingMatrix Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <DeviceRoutingMatrix
 *   routerId="router-1"
 *   matrix={{
 *     devices: [...],
 *     interfaces: [...],
 *     routings: [...],
 *     summary: {...}
 *   }}
 *   actions={{
 *     onAssign: async (deviceID, interfaceID) => {},
 *     onRemove: async (routingID) => {},
 *     onBulkAssign: async (deviceIDs, interfaceID) => {},
 *   }}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { DeviceRoutingMatrixDesktop } from './DeviceRoutingMatrixDesktop';
import { DeviceRoutingMatrixMobile } from './DeviceRoutingMatrixMobile';

import type { DeviceRoutingMatrixProps } from './types';

/**
 * DeviceRoutingMatrix - Device-to-Service routing assignment UI
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized cards with 44px targets and bottom sheet
 * - Tablet/Desktop (≥640px): Virtualized table with keyboard navigation
 *
 * Features:
 * - Multi-select with checkboxes
 * - Bulk assignment to services
 * - Real-time status updates
 * - Search and filtering
 * - Optimistic UI updates
 */
function DeviceRoutingMatrixComponent(props: DeviceRoutingMatrixProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <DeviceRoutingMatrixMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <DeviceRoutingMatrixDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const DeviceRoutingMatrix = memo(DeviceRoutingMatrixComponent);

// Set display name for React DevTools
DeviceRoutingMatrix.displayName = 'DeviceRoutingMatrix';
