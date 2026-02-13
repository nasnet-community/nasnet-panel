/**
 * InstanceManager Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <InstanceManager
 *   instances={instances}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   onBulkOperation={(operation, ids) => {
 *     console.log(`Performing ${operation} on`, ids);
 *   }}
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   showMetrics={true}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { InstanceManagerDesktop } from './InstanceManagerDesktop';
import { InstanceManagerMobile } from './InstanceManagerMobile';

import type { InstanceManagerProps } from './types';

/**
 * InstanceManager - Manages service instances with filtering, sorting, and bulk operations
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Single column list with simplified filters
 * - Tablet/Desktop (≥640px): Data table with advanced filtering and sorting
 */
function InstanceManagerComponent(props: InstanceManagerProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <InstanceManagerMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <InstanceManagerDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const InstanceManager = memo(InstanceManagerComponent);

// Set display name for React DevTools
InstanceManager.displayName = 'InstanceManager';
