/**
 * ARP Table Component
 * Dashboard Pro style with sortable columns and improved badges
 */

import React, { useState, useMemo } from 'react';

import { ChevronUp, ChevronDown, ChevronsUpDown, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type ARPEntry } from '@nasnet/core/types';
import { compareIPv4, formatMACAddress } from '@nasnet/core/utils';

import { cn } from '@nasnet/ui/utils';

import { SectionHeader } from './SectionHeader';

interface ARPTableProps {
  entries: ARPEntry[];
  defaultCollapsed?: boolean;
  className?: string;
}

type SortColumn = 'ip' | 'mac' | 'interface' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export const ARPTable = React.memo(function ARPTable({
  entries,
  defaultCollapsed = false,
  className,
}: ARPTableProps) {
  const { t } = useTranslation('network');
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
          const statusOrder: Record<ARPEntry['status'], number> = {
            complete: 0,
            incomplete: 1,
            failed: 2,
          };
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
      return (
        <ChevronsUpDown
          className="text-muted-foreground ml-1 h-3 w-3"
          aria-hidden={true}
        />
      );
    }
    return sortDirection === 'asc' ?
        <ChevronUp
          className="text-primary ml-1 h-3 w-3"
          aria-hidden={true}
        />
      : <ChevronDown
          className="text-primary ml-1 h-3 w-3"
          aria-hidden={true}
        />;
  };

  const getStatusBadge = (status: ARPEntry['status']) => {
    const config: Record<ARPEntry['status'], { label: string; className: string }> = {
      complete: {
        label: t('arp.statusComplete'),
        className: 'bg-success/20 text-success',
      },
      incomplete: {
        label: t('arp.statusIncomplete'),
        className: 'bg-warning/20 text-warning',
      },
      failed: {
        label: t('arp.statusFailed'),
        className: 'bg-error/10 text-error',
      },
    };

    const { label, className: badgeClass } = config[status];

    return (
      <span
        className={cn(
          'rounded-pill inline-flex items-center px-2 py-0.5 text-xs font-medium',
          badgeClass
        )}
      >
        {label}
      </span>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={t('arp.title')}
          count={0}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        {!isCollapsed && (
          <div className="bg-card border-border rounded-xl border py-8 text-center shadow-sm">
            <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Network
                className="text-muted-foreground h-6 w-6"
                aria-hidden={true}
              />
            </div>
            <p className="text-muted-foreground text-sm">{t('arp.noEntries')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <SectionHeader
        title={t('arp.title')}
        count={entries.length}
        subtitle={t('arp.subtitle')}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm">
          <div className="overflow-x-auto">
            <table
              className="w-full"
              aria-label={t('arp.title')}
            >
              <thead>
                <tr className="border-border bg-muted border-b">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('ip')}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring font-display flex min-h-[44px] items-center rounded text-xs font-semibold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-offset-2"
                      aria-label={`${t('arp.ipAddress')}${
                        sortColumn === 'ip' ?
                          sortDirection === 'asc' ?
                            ', sorted ascending'
                          : ', sorted descending'
                        : ''
                      }`}
                    >
                      {t('arp.ipAddress')}
                      <SortIcon column="ip" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('mac')}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring font-display flex min-h-[44px] items-center rounded text-xs font-semibold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-offset-2"
                      aria-label={`${t('arp.macAddress')}${
                        sortColumn === 'mac' ?
                          sortDirection === 'asc' ?
                            ', sorted ascending'
                          : ', sorted descending'
                        : ''
                      }`}
                    >
                      {t('arp.macAddress')}
                      <SortIcon column="mac" />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">
                    <button
                      onClick={() => handleSort('interface')}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring font-display flex min-h-[44px] items-center rounded text-xs font-semibold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-offset-2"
                      aria-label={`${t('arp.interface')}${
                        sortColumn === 'interface' ?
                          sortDirection === 'asc' ?
                            ', sorted ascending'
                          : ', sorted descending'
                        : ''
                      }`}
                    >
                      {t('arp.interface')}
                      <SortIcon column="interface" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring font-display flex min-h-[44px] items-center rounded text-xs font-semibold uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-offset-2"
                      aria-label={`${t('arp.status')}${
                        sortColumn === 'status' ?
                          sortDirection === 'asc' ?
                            ', sorted ascending'
                          : ', sorted descending'
                        : ''
                      }`}
                    >
                      {t('arp.status')}
                      <SortIcon column="status" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {sortedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-muted transition-colors"
                  >
                    <td className="text-foreground px-4 py-3 font-mono text-sm">
                      <code>{entry.ipAddress}</code>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 font-mono text-sm">
                      <code>{formatMACAddress(entry.macAddress)}</code>
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-3 font-mono text-sm sm:table-cell">
                      <code>{entry.interface}</code>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(entry.status)}</td>
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
