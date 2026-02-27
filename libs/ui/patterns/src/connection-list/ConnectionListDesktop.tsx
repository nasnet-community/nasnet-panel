/**
 * ConnectionListDesktop Component
 *
 * Desktop presenter for connection tracking list.
 * Uses VirtualizedTable for high-performance rendering of large connection lists.
 */

import * as React from 'react';

import { Filter, Network } from 'lucide-react';

import { Button, cn } from '@nasnet/ui/primitives';

import { EmptyState } from '../empty-state';
import { VirtualizedTable, createTextColumn } from '../virtualization';
import { ConnectionFilterBar } from './ConnectionFilterBar';
import { ConnectionStateBadge } from './ConnectionStateBadge';

import type { ConnectionEntry } from './types';
import type { UseConnectionListReturn } from './use-connection-list';
import type { ColumnDef } from '@tanstack/react-table';

export interface ConnectionListDesktopProps {
  /** Connection list hook return value */
  connectionList: UseConnectionListReturn;

  /** Callback when kill connection is clicked */
  onKillConnection?: (connection: ConnectionEntry) => void;

  /** Whether kill action is loading */
  isKillingConnection?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Desktop presenter for ConnectionList
 *
 * Features:
 * - Virtualized table for performance with 10,000+ connections
 * - Sortable columns
 * - Kill connection action per row
 * - Compact, data-dense layout for desktop
 * - Filter bar above table
 */
export function ConnectionListDesktop({
  connectionList,
  onKillConnection,
  isKillingConnection = false,
  loading = false,
  className,
}: ConnectionListDesktopProps) {
  const {
    filteredConnections,
    totalCount,
    filteredCount,
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,
    sort,
    setSort,
    isPaused,
    togglePause,
    refresh,
  } = connectionList;

  // Create columns for the table
  const columns = React.useMemo<ColumnDef<ConnectionEntry, unknown>[]>(
    () => [
      createTextColumn('protocol', 'Protocol', {
        size: 80,
        cell: (info) => (
          <span className="font-mono text-xs uppercase">{String(info.getValue())}</span>
        ),
      }),
      createTextColumn('srcAddress', 'Source IP', {
        size: 140,
        cell: (info) => <span className="font-mono text-xs">{String(info.getValue())}</span>,
      }),
      {
        id: 'srcPort',
        accessorKey: 'srcPort',
        header: 'Src Port',
        size: 80,
        cell: (info) => {
          const port = info.getValue() as number | undefined;
          return <span className="font-mono text-xs">{port !== undefined ? port : '-'}</span>;
        },
      },
      createTextColumn('dstAddress', 'Dest IP', {
        size: 140,
        cell: (info) => <span className="font-mono text-xs">{String(info.getValue())}</span>,
      }),
      {
        id: 'dstPort',
        accessorKey: 'dstPort',
        header: 'Dst Port',
        size: 80,
        cell: (info) => {
          const port = info.getValue() as number | undefined;
          return <span className="font-mono text-xs">{port !== undefined ? port : '-'}</span>;
        },
      },
      {
        id: 'state',
        accessorKey: 'state',
        header: 'State',
        size: 120,
        cell: (info) => {
          const connection = info.row.original;
          return <ConnectionStateBadge state={connection.state} />;
        },
      },
      {
        id: 'timeout',
        accessorKey: 'timeout',
        header: 'Timeout',
        size: 80,
        cell: (info) => {
          const timeout = info.getValue() as string;
          return <span className="font-mono text-xs">{timeout}</span>;
        },
      },
      {
        id: 'bytes',
        accessorKey: 'bytes',
        header: 'Bytes',
        size: 90,
        cell: (info) => {
          const bytes = info.getValue() as number;
          return <span className="font-mono text-xs">{formatBytes(bytes)}</span>;
        },
      },
      {
        id: 'packets',
        accessorKey: 'packets',
        header: 'Packets',
        size: 80,
        cell: (info) => {
          const packets = info.getValue() as number;
          return <span className="font-mono text-xs">{packets.toLocaleString()}</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        enableSorting: false,
        cell: (info) => {
          const connection = info.row.original;
          return onKillConnection ?
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onKillConnection(connection);
                }}
                disabled={isKillingConnection}
                className="text-error hover:text-error/90 hover:bg-error/10"
                aria-label={`Kill connection from ${connection.srcAddress} to ${connection.dstAddress}`}
              >
                Kill
              </Button>
            : null;
        },
      },
    ],
    [onKillConnection, isKillingConnection]
  );

  // Empty state
  const emptyContent = React.useMemo(() => {
    if (hasActiveFilter) {
      return (
        <EmptyState
          icon={Filter}
          title="No matching connections"
          description="Try adjusting your filters"
          action={{
            label: 'Clear Filters',
            onClick: clearFilter,
            variant: 'outline',
          }}
        />
      );
    }

    return (
      <EmptyState
        icon={Network}
        title="No active connections"
        description="There are currently no tracked connections on this router"
      />
    );
  }, [hasActiveFilter, clearFilter]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {hasActiveFilter ?
            <>
              Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} connections
            </>
          : <>{totalCount.toLocaleString()} active connections</>}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            aria-label={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            aria-label="Refresh connection list"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <ConnectionFilterBar
        filter={filter}
        onFilterChange={setFilter}
        onClearFilter={clearFilter}
        hasActiveFilter={hasActiveFilter}
      />

      {/* Connection Table */}
      <VirtualizedTable
        data={filteredConnections}
        columns={columns}
        enableSorting
        height="600px"
        estimateRowHeight={40}
        loading={loading}
        emptyContent={emptyContent}
        className="rounded-lg border"
        aria-label="Connection tracking table"
        initialSorting={[{ id: sort.field, desc: sort.direction === 'desc' }]}
        onSortingChange={(sorting) => {
          if (sorting.length > 0) {
            const newSort = sorting[0];
            if (newSort) {
              setSort(newSort.id as any);
            }
          }
        }}
      />
    </div>
  );
}

ConnectionListDesktop.displayName = 'ConnectionListDesktop';
