/**
 * DNS Static Entries List Component
 *
 * Platform-adaptive component for displaying static DNS entries.
 * Desktop: DataTable, Mobile: Cards
 *
 * @description
 * Automatically renders the appropriate presenter based on platform (Mobile/Desktop).
 * Supports edit, delete, and add operations for static DNS hostname-to-IP mappings.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { DnsStaticEntriesListDesktop } from './DnsStaticEntriesListDesktop';
import { DnsStaticEntriesListMobile } from './DnsStaticEntriesListMobile';
import type { DNSStaticEntry } from '@nasnet/core/types';

/**
 * DNS Static Entries List Props
 */
export interface DnsStaticEntriesListProps {
  /** Array of static DNS entries */
  entries: DNSStaticEntry[];
  /** Callback to edit an entry */
  onEdit: (entry: DNSStaticEntry) => void;
  /** Callback to delete an entry */
  onDelete: (entryId: string) => void;
  /** Callback to add a new entry */
  onAdd: () => void;
  /** Whether operations are in progress */
  isLoading?: boolean;
  /** Whether data is loading (alias for isLoading) */
  loading?: boolean;
}

/**
 * DNS Static Entries List - Platform-adaptive wrapper
 *
 * Automatically renders the appropriate presenter based on platform:
 * - Mobile: Card layout with key information
 * - Desktop/Tablet: Data table with sortable columns
 *
 * Features:
 * - Sorted alphabetically by hostname
 * - Edit/delete actions per entry
 * - Human-readable TTL display
 * - Empty state when no entries
 *
 * @example
 * ```tsx
 * <DnsStaticEntriesList
 *   entries={staticEntries}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onAdd={handleAdd}
 * />
 * ```
 */
export const DnsStaticEntriesList = memo(function DnsStaticEntriesList(
  props: DnsStaticEntriesListProps
) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <DnsStaticEntriesListMobile {...props} />;
  }

  return <DnsStaticEntriesListDesktop {...props} />;
});

DnsStaticEntriesList.displayName = 'DnsStaticEntriesList';
