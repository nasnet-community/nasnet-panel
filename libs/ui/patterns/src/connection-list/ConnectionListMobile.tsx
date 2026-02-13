/**
 * ConnectionListMobile Component
 *
 * Mobile presenter for connection tracking list.
 * Uses VirtualizedList with card layout for touch-friendly interface.
 */

import * as React from 'react';

import { Button, Card, cn } from '@nasnet/ui/primitives';
import { EmptyState } from '../empty-state';
import { VirtualizedList } from '../virtualization';

import { ConnectionStateBadge } from './ConnectionStateBadge';
import { ConnectionFilterBar } from './ConnectionFilterBar';
import type { ConnectionEntry } from './types';
import type { UseConnectionListReturn } from './use-connection-list';

export interface ConnectionListMobileProps {
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
 * Connection card for mobile view
 */
interface ConnectionCardProps {
  connection: ConnectionEntry;
  onKill?: () => void;
  isKilling?: boolean;
}

function ConnectionCard({ connection, onKill, isKilling }: ConnectionCardProps) {
  return (
    <Card className="p-4 space-y-3">
      {/* Header with protocol and state */}
      <div className="flex items-center justify-between">
        <span className="uppercase text-xs font-mono font-semibold text-muted-foreground">
          {connection.protocol}
        </span>
        <ConnectionStateBadge state={connection.state} />
      </div>

      {/* Connection details */}
      <div className="space-y-2">
        {/* Source */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Source:</span>
          <span className="font-mono">
            {connection.srcAddress}
            {connection.srcPort !== undefined && `:${connection.srcPort}`}
          </span>
        </div>

        {/* Destination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Destination:</span>
          <span className="font-mono">
            {connection.dstAddress}
            {connection.dstPort !== undefined && `:${connection.dstPort}`}
          </span>
        </div>

        {/* Timeout */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Timeout:</span>
          <span className="font-mono">{connection.timeout}</span>
        </div>

        {/* Traffic stats */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Bytes</span>
            <span className="font-mono text-xs">
              {formatBytes(connection.bytes)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Packets</span>
            <span className="font-mono text-xs">
              {connection.packets.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Kill button (44px min height for touch target) */}
      {onKill && (
        <Button
          variant="outline"
          className="w-full min-h-[44px] text-error border-error/30 hover:bg-error/10"
          onClick={onKill}
          disabled={isKilling}
          aria-label={`Kill connection from ${connection.srcAddress} to ${connection.dstAddress}`}
        >
          Kill Connection
        </Button>
      )}
    </Card>
  );
}

/**
 * Mobile presenter for ConnectionList
 *
 * Features:
 * - Virtualized card list for performance
 * - Touch-friendly 44px minimum touch targets
 * - Full-width cards with connection details
 * - Filter controls in collapsible panel
 * - Pull to refresh support
 */
export function ConnectionListMobile({
  connectionList,
  onKillConnection,
  isKillingConnection = false,
  loading = false,
  className,
}: ConnectionListMobileProps) {
  const {
    filteredConnections,
    totalCount,
    filteredCount,
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,
    isPaused,
    togglePause,
    refresh,
  } = connectionList;

  const [showFilters, setShowFilters] = React.useState(false);

  // Empty state
  const emptyContent = React.useMemo(() => {
    if (hasActiveFilter) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <EmptyState
            icon="filter"
            title="No matching connections"
            description="Try adjusting your filters"
            action={
              <Button
                variant="outline"
                onClick={clearFilter}
                className="min-h-[44px]"
              >
                Clear Filters
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <EmptyState
          icon="network"
          title="No active connections"
          description="There are currently no tracked connections on this router"
        />
      </div>
    );
  }, [hasActiveFilter, clearFilter]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header with stats and controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilter ? (
              <>
                {filteredCount} of {totalCount} connections
              </>
            ) : (
              <>{totalCount} active connections</>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="min-h-[44px]"
              aria-label={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="min-h-[44px]"
              aria-label="Refresh connection list"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter toggle button */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full min-h-[44px]"
          aria-expanded={showFilters}
          aria-controls="mobile-filters"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
          {hasActiveFilter && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Collapsible Filter Bar */}
      {showFilters && (
        <div id="mobile-filters" className="pb-2">
          <ConnectionFilterBar
            filter={filter}
            onFilterChange={setFilter}
            onClearFilter={clearFilter}
            hasActiveFilter={hasActiveFilter}
          />
        </div>
      )}

      {/* Connection List */}
      <VirtualizedList
        items={filteredConnections}
        estimateSize={220}
        height="calc(100vh - 300px)"
        loading={loading}
        emptyContent={emptyContent}
        gap={12}
        className="overflow-auto"
        aria-label="Connection tracking list"
        renderItem={({ item: connection }) => (
          <ConnectionCard
            connection={connection}
            onKill={
              onKillConnection
                ? () => onKillConnection(connection)
                : undefined
            }
            isKilling={isKillingConnection}
          />
        )}
      />
    </div>
  );
}

ConnectionListMobile.displayName = 'ConnectionListMobile';
