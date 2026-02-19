/**
 * ARP Table Component
 * Dashboard Pro style with sortable columns and improved badges
 */

import React, { useState, useMemo } from 'react';

import { ChevronUp, ChevronDown, ChevronsUpDown, Network } from 'lucide-react';

import { type ARPEntry } from '@nasnet/core/types';
import { compareIPv4, formatMACAddress } from '@nasnet/core/utils';

import { cn } from '@/lib/utils';

import { SectionHeader } from './SectionHeader';

interface ARPTableProps {
  entries: ARPEntry[];
  defaultCollapsed?: boolean;
  className?: string;
}

type SortColumn = 'ip' | 'mac' | 'interface' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export const ARPTable = React.memo(function ARPTable({ entries, defaultCollapsed = false, className }: ARPTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedEntries = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return entries;
    }

    const sorted = [...entries];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'ip':
          comparison = compareIPv4(a.ipAddress, b.ipAddress);
          break;
        case 'mac':
          comparison = a.macAddress.localeCompare(b.macAddress);
          break;
        case 'interface':
          comparison = a.interface.localeCompare(b.interface);
          break;
        case 'status': {
          const statusOrder: Record<ARPEntry['status'], number> = { complete: 0, incomplete: 1, failed: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [entries, sortColumn, sortDirection]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground" aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3 text-primary" aria-hidden="true" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-primary" aria-hidden="true" />
    );
  };

  const getStatusBadge = (status: ARPEntry['status']) => {
    const config: Record<ARPEntry['status'], { label: string; className: string }> = {
      complete: {
        label: 'Complete',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      },
      incomplete: {
        label: 'Incomplete',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      },
      failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      },
    };

    const { label, className: badgeClass } = config[status];

    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', badgeClass)}>
        {label}
      </span>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="ARP Table"
          count={0}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        {!isCollapsed && (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Network className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground text-sm">
              No ARP entries found
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <SectionHeader
        title="ARP Table"
        count={entries.length}
        subtitle="IP to MAC mappings"
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="ARP table entries">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('ip')}
                      className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      aria-label={`Sort by IP Address${sortColumn === 'ip' ? (sortDirection === 'asc' ? ', sorted ascending' : ', sorted descending') : ''}`}
                    >
                      IP Address
                      <SortIcon column="ip" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('mac')}
                      className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      aria-label={`Sort by MAC Address${sortColumn === 'mac' ? (sortDirection === 'asc' ? ', sorted ascending' : ', sorted descending') : ''}`}
                    >
                      MAC Address
                      <SortIcon column="mac" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('interface')}
                      className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      aria-label={`Sort by Interface${sortColumn === 'interface' ? (sortDirection === 'asc' ? ', sorted ascending' : ', sorted descending') : ''}`}
                    >
                      Interface
                      <SortIcon column="interface" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      aria-label={`Sort by Status${sortColumn === 'status' ? (sortDirection === 'asc' ? ', sorted ascending' : ', sorted descending') : ''}`}
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-foreground">
                      {entry.ipAddress}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {formatMACAddress(entry.macAddress)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {entry.interface}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(entry.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

ARPTable.displayName = 'ARPTable';
