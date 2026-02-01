/**
 * DHCP Lease Table Component
 * Displays DHCP leases with sorting, filtering, and status badges
 *
 * Epic 0.5: DHCP Management - Story 0.5.2
 */

import * as React from 'react';

import type { DHCPLease, LeaseStatus } from '@nasnet/core/types';
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
 cn } from '@nasnet/ui/primitives';

import { StatusBadge } from '../status-badge';

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Sortable column keys
type SortableColumn = 'ipAddress' | 'hostname' | 'expiration' | 'macAddress';

// Sort configuration
interface SortConfig {
  column: SortableColumn | null;
  direction: SortDirection;
}

export interface LeaseTableProps {
  /** Array of DHCP leases to display */
  leases: DHCPLease[];

  /** Loading state */
  isLoading?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * LeaseTable Component
 * Displays DHCP leases with sorting and filtering capabilities
 *
 * Features:
 * - Sortable columns (IP, Hostname, Expiration)
 * - Search filter (IP, MAC, Hostname)
 * - Status badges for lease state
 * - Static lease indicator
 * - Blocked lease styling (gray/strikethrough)
 * - Dark/light theme support
 */
export const LeaseTable = React.forwardRef<HTMLDivElement, LeaseTableProps>(
  ({ leases, isLoading = false, className }, ref) => {
    // Search filter state
    const [searchTerm, setSearchTerm] = React.useState('');

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
            // Sort IP addresses numerically
            comparison = compareIPAddresses(a.address, b.address);
            break;
          case 'hostname':
            comparison = (a.hostname || 'Unknown').localeCompare(
              b.hostname || 'Unknown'
            );
            break;
          case 'expiration':
            // Static leases (no expiration) sort last
            if (!a.expiresAfter && !b.expiresAfter) return 0;
            if (!a.expiresAfter) return 1;
            if (!b.expiresAfter) return -1;
            comparison = parseExpirationToSeconds(a.expiresAfter) -
              parseExpirationToSeconds(b.expiresAfter);
            break;
          case 'macAddress':
            comparison = a.macAddress.localeCompare(b.macAddress);
            break;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }, [filteredLeases, sortConfig]);

    // Loading skeleton
    if (isLoading) {
      return (
        <div ref={ref} className={cn('space-y-4', className)}>
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
        <div ref={ref} className={cn('space-y-4', className)}>
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No DHCP leases found
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Search input */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by IP, MAC, or hostname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground">
            {sortedLeases.length} of {leases.length} leases
          </span>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('ipAddress')}
                >
                  IP Address{getSortIndicator('ipAddress')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('macAddress')}
                >
                  MAC Address{getSortIndicator('macAddress')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('hostname')}
                >
                  Hostname{getSortIndicator('hostname')}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('expiration')}
                >
                  Expires{getSortIndicator('expiration')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No leases match your search
                  </TableCell>
                </TableRow>
              ) : (
                sortedLeases.map((lease) => (
                  <TableRow
                    key={lease.id}
                    className={cn(
                      lease.blocked && 'bg-muted/30 text-muted-foreground'
                    )}
                  >
                    <TableCell
                      className={cn(
                        'font-mono',
                        lease.blocked && 'line-through'
                      )}
                    >
                      {lease.address}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'font-mono text-xs',
                        lease.blocked && 'line-through'
                      )}
                    >
                      {formatMACAddress(lease.macAddress)}
                    </TableCell>
                    <TableCell className={cn(lease.blocked && 'line-through')}>
                      {lease.hostname || (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={lease.status} />
                        {!lease.dynamic && (
                          <StatusBadge status="static" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatExpirationTime(lease.expiresAfter)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
);

LeaseTable.displayName = 'LeaseTable';

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
