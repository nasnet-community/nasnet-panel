/**
 * RouteList Pattern Component
 * NAS-6.5: Static Route Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <RouteList
 *   routerId={routerId}
 *   routes={routes}
 *   loading={loading}
 *   filters={filters}
 *   sortOptions={sortOptions}
 *   availableTables={availableTables}
 *   onFiltersChange={setFilters}
 *   onSortChange={setSortOptions}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { RouteListDesktop } from './RouteListDesktop';
import { RouteListMobile } from './RouteListMobile';

import type { RouteListProps } from './types';

/**
 * RouteList - Display and manage static routes
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Tablet/Desktop (>=640px): DataTable with filtering and sorting
 *
 * @description Headless + Platform Presenters pattern with adaptive layouts for routes
 */
function RouteListComponent(props: RouteListProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <RouteListMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <RouteListDesktop {...props} />;
  }
}

RouteListComponent.displayName = 'RouteListComponent';

// Wrap with memo for performance optimization
export const RouteList = memo(RouteListComponent);

// Set display name for React DevTools
RouteList.displayName = 'RouteList';
