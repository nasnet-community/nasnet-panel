/**
 * BlockedIPsTableDesktop Component
 *
 * Desktop presenter for blocked IPs table.
 * Uses VirtualizedTable for high-performance rendering of large blocked IP lists.
 */

import * as React from 'react';

import { memo } from 'react';

import { Filter, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Icon,
  Button,
  cn,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@nasnet/ui/primitives';

import { EmptyState } from '../empty-state';
import { VirtualizedTable, createTextColumn } from '../virtualization';
import { WHITELIST_TIMEOUT_PRESETS } from './types';

import type { BlockedIP, WhitelistTimeout } from './types';
import type { UseBlockedIPsTableReturn } from './use-blocked-ips-table';
import type { ColumnDef } from '@tanstack/react-table';

export interface BlockedIPsTableDesktopProps {
  /** Blocked IPs table hook return value */
  blockedIPsTable: UseBlockedIPsTableReturn;

  /** Callback when whitelist is clicked */
  onWhitelist?: (address: string, timeout: string, comment?: string) => Promise<void>;

  /** Callback when remove is clicked */
  onRemove?: (address: string) => Promise<void>;

  /** Whether whitelist action is loading */
  isWhitelisting?: boolean;

  /** Whether remove action is loading */
  isRemoving?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Format date to relative time
 */
function formatRelativeTime(date?: Date): string {
  if (!date) return '-';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

/**
 * Desktop presenter for BlockedIPsTable
 *
 * Features:
 * - Virtualized table for performance with 10,000+ entries
 * - Sortable columns
 * - Row selection with checkboxes
 * - Per-row actions: Whitelist, Remove
 * - Bulk actions: Whitelist Selected, Remove Selected
 * - Compact, data-dense layout for desktop
 */
export const BlockedIPsTableDesktop = memo(function BlockedIPsTableDesktop({
  blockedIPsTable,
  onWhitelist,
  onRemove,
  isWhitelisting = false,
  isRemoving = false,
  loading = false,
  className,
}: BlockedIPsTableDesktopProps) {
  const {
    filteredBlockedIPs,
    totalCount,
    filteredCount,
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,
    sort,
    setSort,
    selectedIPs,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection,
    refresh,
  } = blockedIPsTable;

  // Whitelist dialog state
  const [whitelistDialogOpen, setWhitelistDialogOpen] = React.useState(false);
  const [whitelistIP, setWhitelistIP] = React.useState<string | null>(null);
  const [whitelistTimeout, setWhitelistTimeout] = React.useState<string>('1h');
  const [whitelistComment, setWhitelistComment] = React.useState('');

  // Remove confirmation dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [removeIP, setRemoveIP] = React.useState<string | null>(null);

  // Bulk whitelist dialog
  const [bulkWhitelistDialogOpen, setBulkWhitelistDialogOpen] = React.useState(false);
  const [bulkWhitelistTimeout, setBulkWhitelistTimeout] = React.useState<string>('1h');

  // Bulk remove confirmation
  const [bulkRemoveDialogOpen, setBulkRemoveDialogOpen] = React.useState(false);

  // Handle whitelist click
  const handleWhitelistClick = (address: string) => {
    setWhitelistIP(address);
    setWhitelistTimeout('1h');
    setWhitelistComment('');
    setWhitelistDialogOpen(true);
  };

  // Handle whitelist submit
  const handleWhitelistSubmit = async () => {
    if (!whitelistIP || !onWhitelist) return;

    await onWhitelist(whitelistIP, whitelistTimeout, whitelistComment || undefined);
    setWhitelistDialogOpen(false);
    setWhitelistIP(null);
  };

  // Handle remove click
  const handleRemoveClick = (address: string) => {
    setRemoveIP(address);
    setRemoveDialogOpen(true);
  };

  // Handle remove submit
  const handleRemoveSubmit = async () => {
    if (!removeIP || !onRemove) return;

    await onRemove(removeIP);
    setRemoveDialogOpen(false);
    setRemoveIP(null);
  };

  // Handle bulk whitelist
  const handleBulkWhitelistClick = () => {
    setBulkWhitelistTimeout('1h');
    setBulkWhitelistDialogOpen(true);
  };

  // Handle bulk whitelist submit
  const handleBulkWhitelistSubmit = async () => {
    if (!onWhitelist) return;

    await Promise.all(
      selectedIPs.map((address) => onWhitelist(address, bulkWhitelistTimeout))
    );
    setBulkWhitelistDialogOpen(false);
    clearSelection();
  };

  // Handle bulk remove
  const handleBulkRemoveClick = () => {
    setBulkRemoveDialogOpen(true);
  };

  // Handle bulk remove submit
  const handleBulkRemoveSubmit = async () => {
    if (!onRemove) return;

    await Promise.all(selectedIPs.map((address) => onRemove(address)));
    setBulkRemoveDialogOpen(false);
    clearSelection();
  };

  // Create columns for the table
  const columns = React.useMemo<ColumnDef<BlockedIP, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              filteredBlockedIPs.length > 0 &&
              filteredBlockedIPs.every((entry) => isSelected(entry.address))
            }
            onCheckedChange={(checked) => {
              if (checked) {
                selectAll();
              } else {
                clearSelection();
              }
            }}
            aria-label="Select all blocked IPs"
          />
        ),
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <Checkbox
              checked={isSelected(entry.address)}
              onCheckedChange={() => toggleSelection(entry.address)}
              aria-label={`Select ${entry.address}`}
            />
          );
        },
        size: 40,
        enableSorting: false,
      },
      createTextColumn('address', 'IP Address', {
        size: 140,
        cell: (info) => (
          <span className="font-mono text-sm text-foreground">{String(info.getValue())}</span>
        ),
      }),
      createTextColumn('list', 'List', {
        size: 120,
        cell: (info) => (
          <span className="text-sm text-muted-foreground">{String(info.getValue())}</span>
        ),
      }),
      {
        id: 'blockCount',
        accessorKey: 'blockCount',
        header: 'Block Count',
        size: 100,
        cell: (info) => {
          const count = info.getValue() as number;
          return (
            <span className="font-mono text-sm text-muted-foreground">{count.toLocaleString()}</span>
          );
        },
      },
      {
        id: 'firstBlocked',
        accessorKey: 'firstBlocked',
        header: 'First Blocked',
        size: 120,
        cell: (info) => {
          const date = info.getValue() as Date | undefined;
          return (
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(date)}
            </span>
          );
        },
      },
      {
        id: 'lastBlocked',
        accessorKey: 'lastBlocked',
        header: 'Last Blocked',
        size: 120,
        cell: (info) => {
          const date = info.getValue() as Date | undefined;
          return (
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(date)}
            </span>
          );
        },
      },
      {
        id: 'timeout',
        accessorKey: 'timeout',
        header: 'Timeout',
        size: 100,
        cell: (info) => {
          const timeout = info.getValue() as string | undefined;
          return (
            <span className="font-mono text-sm text-muted-foreground">{timeout || 'permanent'}</span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        enableSorting: false,
        cell: (info) => {
          const entry = info.row.original;
          return (
            <div className="flex items-center gap-component-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhitelistClick(entry.address);
                }}
                disabled={isWhitelisting}
                className="text-sm text-foreground hover:bg-muted"
                aria-label={`Whitelist ${entry.address}`}
              >
                Whitelist
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveClick(entry.address);
                }}
                disabled={isRemoving}
                className="text-sm text-error hover:text-error hover:bg-error-light/30"
                aria-label={`Remove ${entry.address}`}
              >
                Remove
              </Button>
            </div>
          );
        },
      },
    ],
    [
      filteredBlockedIPs,
      isSelected,
      selectAll,
      clearSelection,
      toggleSelection,
      isWhitelisting,
      isRemoving,
    ]
  );

  // Empty state
  const emptyContent = React.useMemo(() => {
    if (hasActiveFilter) {
      return (
        <EmptyState
          icon={Filter}
          title="No matching blocked IPs"
          description="Try adjusting your filters"
          action={{ label: 'Clear Filters', onClick: clearFilter, variant: 'outline' }}
        />
      );
    }

    return (
      <EmptyState
        icon={Shield}
        title="No blocked IPs"
        description="There are currently no blocked IP addresses from rate limiting"
      />
    );
  }, [hasActiveFilter, clearFilter]);

  return (
    <div className={cn('flex flex-col gap-component-md', className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-medium">
          {hasActiveFilter ? (
            <>
              Showing {filteredCount.toLocaleString()} of{' '}
              {totalCount.toLocaleString()} blocked IPs
            </>
          ) : (
            <>{totalCount.toLocaleString()} blocked IPs</>
          )}
        </div>

        <div className="flex items-center gap-component-md">
          {hasSelection && (
            <>
              <span className="text-xs text-muted-foreground font-medium">
                {selectedIPs.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkWhitelistClick}
                disabled={isWhitelisting}
                aria-label="Whitelist selected IPs"
              >
                Whitelist Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRemoveClick}
                disabled={isRemoving}
                className="text-error hover:text-error/90"
                aria-label="Remove selected IPs"
              >
                Remove Selected
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            aria-label="Refresh blocked IPs list"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-component-md">
        <Input
          placeholder="Filter by IP address (supports wildcards: 192.168.1.*)"
          value={filter.ipAddress || ''}
          onChange={(e) => setFilter({ ipAddress: e.target.value })}
          className="flex-1 h-10 text-sm rounded-[var(--semantic-radius-input)]"
          aria-label="Filter by IP address"
        />
        {hasActiveFilter && (
          <Button variant="outline" size="sm" onClick={clearFilter} className="text-xs">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Blocked IPs Table */}
      <div className="bg-card border border-border rounded-[var(--semantic-radius-card)] overflow-hidden">
        <VirtualizedTable
          data={filteredBlockedIPs}
          columns={columns}
          enableSorting
          height="600px"
          estimateRowHeight={40}
          loading={loading}
          emptyContent={emptyContent}
          className="border-none"
          aria-label="Blocked IPs table"
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

      {/* Whitelist Dialog */}
      <Dialog open={whitelistDialogOpen} onOpenChange={setWhitelistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Whitelist IP Address</DialogTitle>
            <DialogDescription>
              Add {whitelistIP} to the whitelist. Choose a timeout or make it permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="timeout-select" className="text-sm font-medium">Timeout</label>
              <Select value={whitelistTimeout} onValueChange={setWhitelistTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHITELIST_TIMEOUT_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="whitelist-comment" className="text-sm font-medium">Comment (optional)</label>
              <Input
                id="whitelist-comment"
                value={whitelistComment}
                onChange={(e) => setWhitelistComment(e.target.value)}
                placeholder="Reason for whitelisting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhitelistDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWhitelistSubmit} disabled={isWhitelisting}>
              Whitelist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Blocked IP</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removeIP} from the blocked list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRemoveSubmit} disabled={isRemoving}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Whitelist Dialog */}
      <Dialog open={bulkWhitelistDialogOpen} onOpenChange={setBulkWhitelistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Whitelist Selected IPs</DialogTitle>
            <DialogDescription>
              Add {selectedIPs.length} selected IP{selectedIPs.length !== 1 ? 's' : ''} to the whitelist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="bulk-timeout-select" className="text-sm font-medium">Timeout</label>
              <Select value={bulkWhitelistTimeout} onValueChange={setBulkWhitelistTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHITELIST_TIMEOUT_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkWhitelistDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkWhitelistSubmit} disabled={isWhitelisting}>
              Whitelist All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Confirmation Dialog */}
      <Dialog open={bulkRemoveDialogOpen} onOpenChange={setBulkRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Selected Blocked IPs</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedIPs.length} blocked IP{selectedIPs.length !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkRemoveSubmit} disabled={isRemoving}>
              Remove All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

BlockedIPsTableDesktop.displayName = 'BlockedIPsTableDesktop';
