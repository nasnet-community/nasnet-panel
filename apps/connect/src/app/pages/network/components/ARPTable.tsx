/**
 * ARP Table Component
 * Dashboard Pro style with sortable columns and improved badges
 */

import { useState, useMemo } from 'react';

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

export function ARPTable({ entries, defaultCollapsed = false, className }: ARPTableProps) {
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
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3 text-primary-500" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 text-primary-500" />
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
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Network className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('ip')}
                      className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white"
                    >
                      IP Address
                      <SortIcon column="ip" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('mac')}
                      className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white"
                    >
                      MAC Address
                      <SortIcon column="mac" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('interface')}
                      className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white"
                    >
                      Interface
                      <SortIcon column="interface" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-white">
                      {entry.ipAddress}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600 dark:text-slate-300">
                      {formatMACAddress(entry.macAddress)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">
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
}
