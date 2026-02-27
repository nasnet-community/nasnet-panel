/**
 * LeaseTableWithSelection Component
 *
 * Extends the base LeaseTable pattern with:
 * - Checkbox column for bulk selection
 * - "Select All" functionality
 * - Row expansion for lease details
 * - Pulse animation for new leases
 * - "New" badge indicator
 *
 * Integrates with bulk operations for batch actions.
 *
 * @module features/network/dhcp/components/lease-table
 */

import * as React from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

import type { DHCPLease } from '@nasnet/core/types';
import { formatMACAddress, formatExpirationTime } from '@nasnet/core/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Skeleton,
  Checkbox,
  cn,
  Icon,
} from '@nasnet/ui/primitives';
import { StatusBadge } from '@nasnet/ui/patterns';

import { LeaseDetailPanel } from './LeaseDetailPanel';

/** Sort direction type */
type SortDirection = 'asc' | 'desc' | null;

/** Sortable column keys */
type SortableColumn = 'ipAddress' | 'hostname' | 'expiration' | 'macAddress';

/** Sort configuration */
interface SortConfig {
  column: SortableColumn | null;
  direction: SortDirection;
}

/** Maximum number of rows to display before requiring virtualization */
const MAX_ROWS_BEFORE_VIRTUALIZATION = 20;

export interface LeaseTableWithSelectionProps {
  /** Array of DHCP leases to display */
  leases: DHCPLease[];

  /** Loading state */
  isLoading?: boolean;

  /** Set of selected lease IDs for bulk operations */
  selectedIds: Set<string>;

  /** Callback when selection changes */
  onSelectionChange: (ids: Set<string>) => void;

  /** Set of new lease IDs to highlight with animation */
  newLeaseIds?: Set<string>;

  /** Additional CSS classes */
  className?: string;
}

/**
 * LeaseTableWithSelection Component
 *
 * Desktop table with bulk selection and expandable row details.
 * Highlights new leases with pulse animation and "New" badge.
 *
 * @example
 * ```tsx
 * <LeaseTableWithSelection
 *   leases={leases}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   newLeaseIds={newLeaseIds}
 * />
 * ```
 */
export const LeaseTableWithSelection = React.forwardRef<
  HTMLDivElement,
  LeaseTableWithSelectionProps
>(
  (
    {
      leases,
      isLoading = false,
      selectedIds,
      onSelectionChange,
      newLeaseIds = new Set(),
      className,
    },
    ref
  ) => {
    // Search filter state
    const [searchTerm, setSearchTerm] = React.useState('');

    // Expanded row state
    const [expandedLeaseId, setExpandedLeaseId] = React.useState<string | null>(null);

    // Sort state
    const [sortConfig, setSortConfig] = React.useState<SortConfig>({
      column: null,
      direction: null,
    });

    // Handle column header click for sorting
    const handleSort = (column: SortableColumn) => {
      setSortConfig((prev) => {
        if (prev.column === column) {
          // Cycle through: asc -> desc -> null
          if (prev.direction === 'asc') {
            return { column, direction: 'desc' };
          } else if (prev.direction === 'desc') {
            return { column: null, direction: null };
          }
        }
        // Start with ascending
        return { column, direction: 'asc' };
      });
    };

    // Get sort indicator for column
    const getSortIndicator = (column: SortableColumn) => {
      if (sortConfig.column !== column) return null;
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    // Filter leases by search term
    const filteredLeases = React.useMemo(() => {
      if (!searchTerm.trim()) return leases;

      const term = searchTerm.toLowerCase().trim();
      return leases.filter((lease) => {
        const hostname = (lease.hostname || 'Unknown').toLowerCase();
        const ip = lease.address.toLowerCase();
        const mac = lease.macAddress.toLowerCase();

        return hostname.includes(term) || ip.includes(term) || mac.includes(term);
      });
    }, [leases, searchTerm]);

    // Sort filtered leases
    const sortedLeases = React.useMemo(() => {
      if (!sortConfig.column || !sortConfig.direction) return filteredLeases;

      return [...filteredLeases].sort((a, b) => {
        let comparison = 0;

        switch (sortConfig.column) {
          case 'ipAddress':
            comparison = compareIPAddresses(a.address, b.address);
            break;
          case 'hostname':
            comparison = (a.hostname || 'Unknown').localeCompare(b.hostname || 'Unknown');
            break;
          case 'expiration':
            if (!a.expiresAfter && !b.expiresAfter) return 0;
            if (!a.expiresAfter) return 1;
            if (!b.expiresAfter) return -1;
            comparison =
              parseExpirationToSeconds(a.expiresAfter) - parseExpirationToSeconds(b.expiresAfter);
            break;
          case 'macAddress':
            comparison = a.macAddress.localeCompare(b.macAddress);
            break;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }, [filteredLeases, sortConfig]);

    // Handle "Select All" checkbox
    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        const allIds = new Set(sortedLeases.map((l) => l.id));
        onSelectionChange(allIds);
      } else {
        onSelectionChange(new Set());
      }
    };

    // Handle individual checkbox
    const handleSelectOne = (leaseId: string, checked: boolean) => {
      const newSelection = new Set(selectedIds);
      if (checked) {
        newSelection.add(leaseId);
      } else {
        newSelection.delete(leaseId);
      }
      onSelectionChange(newSelection);
    };

    // Toggle row expansion
    const handleRowClick = (leaseId: string) => {
      setExpandedLeaseId((prev) => (prev === leaseId ? null : leaseId));
    };

    // Check if all visible leases are selected
    const allSelected =
      sortedLeases.length > 0 && sortedLeases.every((lease) => selectedIds.has(lease.id));

    // Check if some (but not all) leases are selected
    const someSelected = sortedLeases.some((lease) => selectedIds.has(lease.id)) && !allSelected;

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn('space-y-component-md', className)}
        >
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="rounded-[var(--semantic-radius-card)] border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]" />
                  <TableHead className="w-[50px]" />
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    // Empty state
    if (leases.length === 0) {
      return (
        <div
          ref={ref}
          className={cn('space-y-component-md', className)}
        >
          <div className="p-component-lg text-muted-foreground rounded-[var(--semantic-radius-card)] border text-center">
            No DHCP leases found
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('space-y-component-md', className)}
      >
        {/* Search input */}
        <div className="gap-component-md flex items-center">
          <Input
            placeholder="Search by IP, MAC, or hostname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            aria-label="Search leases"
          />
          <span className="text-muted-foreground text-sm">
            {sortedLeases.length} of {leases.length} leases
          </span>
        </div>

        {/* Table */}
        <div className="rounded-[var(--semantic-radius-card)] border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Expand column */}
                <TableHead
                  className="w-[50px]"
                  aria-label="Expand row"
                />

                {/* Select All checkbox */}
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all leases"
                  />
                </TableHead>

                <TableHead
                  className="hover:bg-muted focus-visible:ring-ring cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  onClick={() => handleSort('ipAddress')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('ipAddress');
                    }
                  }}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={
                    sortConfig.column === 'ipAddress' ?
                      sortConfig.direction === 'asc' ?
                        'ascending'
                      : 'descending'
                    : 'none'
                  }
                >
                  IP Address{getSortIndicator('ipAddress')}
                </TableHead>
                <TableHead
                  className="hover:bg-muted focus-visible:ring-ring cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  onClick={() => handleSort('macAddress')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('macAddress');
                    }
                  }}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={
                    sortConfig.column === 'macAddress' ?
                      sortConfig.direction === 'asc' ?
                        'ascending'
                      : 'descending'
                    : 'none'
                  }
                >
                  MAC Address{getSortIndicator('macAddress')}
                </TableHead>
                <TableHead
                  className="hover:bg-muted focus-visible:ring-ring cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  onClick={() => handleSort('hostname')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('hostname');
                    }
                  }}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={
                    sortConfig.column === 'hostname' ?
                      sortConfig.direction === 'asc' ?
                        'ascending'
                      : 'descending'
                    : 'none'
                  }
                >
                  Hostname{getSortIndicator('hostname')}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="hover:bg-muted focus-visible:ring-ring cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  onClick={() => handleSort('expiration')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('expiration');
                    }
                  }}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={
                    sortConfig.column === 'expiration' ?
                      sortConfig.direction === 'asc' ?
                        'ascending'
                      : 'descending'
                    : 'none'
                  }
                >
                  Expires{getSortIndicator('expiration')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeases.length === 0 ?
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground text-center"
                  >
                    No leases match your search
                  </TableCell>
                </TableRow>
              : sortedLeases.map((lease) => {
                  const isExpanded = expandedLeaseId === lease.id;
                  const isSelected = selectedIds.has(lease.id);
                  const isNew = newLeaseIds.has(lease.id);

                  return (
                    <React.Fragment key={lease.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer transition-colors',
                          lease.blocked && 'bg-muted/30 text-muted-foreground',
                          isNew && 'bg-primary/10 animate-pulse',
                          isExpanded && 'bg-muted/50'
                        )}
                        onClick={() => handleRowClick(lease.id)}
                      >
                        {/* Expand button */}
                        <TableCell
                          className="w-[50px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="hover:bg-muted focus-visible:ring-ring flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            onClick={() => handleRowClick(lease.id)}
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ?
                              <Icon
                                icon={ChevronDown}
                                size="sm"
                              />
                            : <Icon
                                icon={ChevronRight}
                                size="sm"
                              />
                            }
                          </button>
                        </TableCell>

                        {/* Checkbox */}
                        <TableCell
                          className="w-[50px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectOne(lease.id, checked as boolean)
                            }
                            aria-label={`Select ${lease.address}`}
                          />
                        </TableCell>

                        <TableCell
                          className={cn(
                            'font-mono text-sm',
                            lease.blocked && 'line-through opacity-60'
                          )}
                          title={lease.address}
                        >
                          {lease.address}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'font-mono text-xs',
                            lease.blocked && 'line-through opacity-60'
                          )}
                          title={formatMACAddress(lease.macAddress)}
                        >
                          {formatMACAddress(lease.macAddress)}
                        </TableCell>
                        <TableCell className={cn(lease.blocked && 'line-through')}>
                          {lease.hostname || <span className="text-muted-foreground">Unknown</span>}
                        </TableCell>
                        <TableCell>
                          <div className="gap-component-sm flex items-center">
                            <StatusBadge status={lease.status} />
                            {!lease.dynamic && <StatusBadge status="static" />}
                            {isNew && (
                              <span className="gap-component-xs rounded-pill bg-primary/10 px-component-sm py-component-xs text-primary inline-flex items-center text-xs font-medium">
                                <Icon
                                  icon={Sparkles}
                                  size="sm"
                                />
                                New
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatExpirationTime(lease.expiresAfter)}</TableCell>
                      </TableRow>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="bg-muted/30 p-0"
                          >
                            <div className="p-component-md">
                              <LeaseDetailPanel lease={lease} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              }
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
);

LeaseTableWithSelection.displayName = 'LeaseTableWithSelection';

/**
 * Compare two IP addresses numerically
 */
function compareIPAddresses(ip1: string, ip2: string): number {
  const parts1 = ip1.split('.').map(Number);
  const parts2 = ip2.split('.').map(Number);

  for (let i = 0; i < 4; i++) {
    const diff = (parts1[i] || 0) - (parts2[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Parse RouterOS expiration string to seconds for comparison
 */
function parseExpirationToSeconds(expiration: string): number {
  if (!expiration) return Infinity;

  let seconds = 0;
  const regex = /(\d+)([wdhms])/g;
  let match;

  while ((match = regex.exec(expiration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'w':
        seconds += value * 7 * 24 * 60 * 60;
        break;
      case 'd':
        seconds += value * 24 * 60 * 60;
        break;
      case 'h':
        seconds += value * 60 * 60;
        break;
      case 'm':
        seconds += value * 60;
        break;
      case 's':
        seconds += value;
        break;
    }
  }

  return seconds;
}
