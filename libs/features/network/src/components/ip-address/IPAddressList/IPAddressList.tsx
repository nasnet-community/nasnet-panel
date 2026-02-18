/**
 * IPAddressList Pattern Component
 * NAS-6.2: IP Address Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <IPAddressList
 *   ipAddresses={ipAddresses}
 *   loading={loading}
 *   filters={filters}
 *   sortOptions={sortOptions}
 *   onFiltersChange={setFilters}
 *   onSortChange={setSortOptions}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { IPAddressListDesktop } from './IPAddressListDesktop';
import { IPAddressListMobile } from './IPAddressListMobile';

import type { IPAddressListProps } from './types';

/**
 * IPAddressList - Display and manage IP addresses on interfaces
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Tablet/Desktop (>=640px): DataTable with filtering and sorting
 */
function IPAddressListComponent(props: IPAddressListProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <IPAddressListMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <IPAddressListDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const IPAddressList = memo(IPAddressListComponent);

// Set display name for React DevTools
(IPAddressList as { displayName?: string }).displayName = 'IPAddressList';
