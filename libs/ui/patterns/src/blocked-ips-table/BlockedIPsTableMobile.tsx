/**
 * BlockedIPsTableMobile Component
 *
 * Mobile presenter for blocked IPs table.
 * Uses VirtualizedList with card layout for touch-friendly interface.
 */

import * as React from 'react';

import { Filter, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Icon,
  Button,
  Card,
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
import { VirtualizedList } from '../virtualization';
import { WHITELIST_TIMEOUT_PRESETS } from './types';

import type { BlockedIP } from './types';
import type { UseBlockedIPsTableReturn } from './use-blocked-ips-table';

export interface BlockedIPsTableMobileProps {
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
 * Blocked IP card for mobile view
 */
interface BlockedIPCardProps {
  entry: BlockedIP;
  isSelected: boolean;
  onToggleSelection: () => void;
  onWhitelist: () => void;
  onRemove: () => void;
  isWhitelisting?: boolean;
  isRemoving?: boolean;
}

function BlockedIPCard({
  entry,
  isSelected,
  onToggleSelection,
  onWhitelist,
  onRemove,
  isWhitelisting,
  isRemoving,
}: BlockedIPCardProps) {
  return (
    <Card className="p-component-md space-y-component-md border-border rounded-[var(--semantic-radius-card)] border">
      {/* Header with checkbox and IP address */}
      <div className="flex items-start justify-between">
        <div className="gap-component-md flex items-start">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            aria-label={`Select ${entry.address}`}
            className="mt-1"
          />
          <div className="space-y-1">
            <span className="text-foreground font-mono text-sm font-semibold">{entry.address}</span>
            <div className="text-muted-foreground text-xs">{entry.list}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-foreground text-xs font-semibold">
            {entry.blockCount.toLocaleString()}
          </div>
          <div className="text-muted-foreground text-xs">blocks</div>
        </div>
      </div>

      {/* Entry details */}
      <div className="space-y-component-sm">
        {/* First Blocked */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">First Blocked:</span>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(entry.firstBlocked)}
          </span>
        </div>

        {/* Last Blocked */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Last Blocked:</span>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(entry.lastBlocked)}
          </span>
        </div>

        {/* Timeout */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Timeout:</span>
          <span className="text-muted-foreground font-mono text-xs">
            {entry.timeout || 'permanent'}
          </span>
        </div>
      </div>

      {/* Action buttons (44px min height for touch target) */}
      <div className="gap-component-md pt-component-md border-border flex border-t">
        <Button
          variant="outline"
          className="min-h-[44px] flex-1 text-sm"
          onClick={onWhitelist}
          disabled={isWhitelisting}
          aria-label={`Whitelist ${entry.address}`}
        >
          Whitelist
        </Button>
        <Button
          variant="outline"
          className="text-error border-error/30 hover:bg-error-light/30 hover:text-error min-h-[44px] flex-1 text-sm"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${entry.address}`}
        >
          Remove
        </Button>
      </div>
    </Card>
  );
}

/**
 * Mobile presenter for BlockedIPsTable
 *
 * Features:
 * - Virtualized card list for performance
 * - Touch-friendly 44px minimum touch targets
 * - Full-width cards with blocked IP details
 * - Filter controls in collapsible panel
 * - Selection mode with bulk actions
 */
export function BlockedIPsTableMobile({
  blockedIPsTable,
  onWhitelist,
  onRemove,
  isWhitelisting = false,
  isRemoving = false,
  loading = false,
  className,
}: BlockedIPsTableMobileProps) {
  const {
    filteredBlockedIPs,
    totalCount,
    filteredCount,
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,
    selectedIPs,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection,
    refresh,
  } = blockedIPsTable;

  const [showFilters, setShowFilters] = React.useState(false);

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

    await Promise.all(selectedIPs.map((address) => onWhitelist(address, bulkWhitelistTimeout)));
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

  // Empty state
  const emptyContent = React.useMemo(() => {
    if (hasActiveFilter) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-6">
          <EmptyState
            icon={Filter}
            title="No matching blocked IPs"
            description="Try adjusting your filters"
            action={{ label: 'Clear Filters', onClick: clearFilter, variant: 'outline' }}
          />
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <EmptyState
          icon={Shield}
          title="No blocked IPs"
          description="There are currently no blocked IP addresses from rate limiting"
        />
      </div>
    );
  }, [hasActiveFilter, clearFilter]);

  return (
    <div className={cn('gap-component-md flex flex-col', className)}>
      {/* Header with stats and controls */}
      <div className="gap-component-md flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs font-medium">
            {hasActiveFilter ?
              <>
                {filteredCount} of {totalCount} blocked IPs
              </>
            : <>{totalCount} blocked IPs</>}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="min-h-[44px]"
            aria-label="Refresh blocked IPs list"
          >
            Refresh
          </Button>
        </div>

        {/* Selection mode controls */}
        {hasSelection && (
          <div className="gap-component-sm flex items-center">
            <span className="text-muted-foreground flex-1 text-xs font-medium">
              {selectedIPs.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkWhitelistClick}
              disabled={isWhitelisting}
              className="min-h-[44px] text-sm"
              aria-label="Whitelist selected IPs"
            >
              Whitelist
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRemoveClick}
              disabled={isRemoving}
              className="text-error hover:text-error hover:bg-error-light/30 min-h-[44px] text-sm"
              aria-label="Remove selected IPs"
            >
              Remove
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="min-h-[44px] text-sm"
              aria-label="Clear selection"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Filter toggle button */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="min-h-[44px] w-full text-sm"
          aria-expanded={showFilters}
          aria-controls="mobile-filters"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
          {hasActiveFilter && (
            <span className="bg-primary text-primary-foreground ml-2 rounded-[var(--semantic-radius-badge)] px-2 py-0.5 text-xs font-medium">
              Active
            </span>
          )}
        </Button>

        {/* Select All button */}
        {!hasSelection && filteredBlockedIPs.length > 0 && (
          <Button
            variant="outline"
            onClick={selectAll}
            className="min-h-[44px] w-full text-sm"
            aria-label="Select all blocked IPs"
          >
            Select All
          </Button>
        )}
      </div>

      {/* Collapsible Filter Controls */}
      {showFilters && (
        <div
          id="mobile-filters"
          className="space-y-component-md pb-component-sm"
        >
          <Input
            placeholder="Filter by IP address (192.168.1.*)"
            value={filter.ipAddress || ''}
            onChange={(e) => setFilter({ ipAddress: e.target.value })}
            className="h-10 w-full rounded-[var(--semantic-radius-input)] text-sm"
            aria-label="Filter by IP address"
          />
          {hasActiveFilter && (
            <Button
              variant="outline"
              onClick={clearFilter}
              className="min-h-[44px] w-full text-sm"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Blocked IPs List */}
      <VirtualizedList
        items={filteredBlockedIPs}
        estimateSize={240}
        height="calc(100vh - 400px)"
        loading={loading}
        emptyContent={emptyContent}
        gap={12}
        className="overflow-auto"
        aria-label="Blocked IPs list"
        renderItem={({ item: entry }) => (
          <BlockedIPCard
            entry={entry}
            isSelected={isSelected(entry.address)}
            onToggleSelection={() => toggleSelection(entry.address)}
            onWhitelist={() => handleWhitelistClick(entry.address)}
            onRemove={() => handleRemoveClick(entry.address)}
            isWhitelisting={isWhitelisting}
            isRemoving={isRemoving}
          />
        )}
      />

      {/* Whitelist Dialog */}
      <Dialog
        open={whitelistDialogOpen}
        onOpenChange={setWhitelistDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Whitelist IP Address</DialogTitle>
            <DialogDescription>
              Add {whitelistIP} to the whitelist. Choose a timeout or make it permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="timeout-select"
                className="text-sm font-medium"
              >
                Timeout
              </label>
              <Select
                value={whitelistTimeout}
                onValueChange={setWhitelistTimeout}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHITELIST_TIMEOUT_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset.value}
                      value={preset.value}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="whitelist-comment"
                className="text-sm font-medium"
              >
                Comment (optional)
              </label>
              <Input
                id="whitelist-comment"
                value={whitelistComment}
                onChange={(e) => setWhitelistComment(e.target.value)}
                placeholder="Reason for whitelisting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWhitelistDialogOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWhitelistSubmit}
              disabled={isWhitelisting}
              className="min-h-[44px]"
            >
              Whitelist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Blocked IP</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removeIP} from the blocked list? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveSubmit}
              disabled={isRemoving}
              className="min-h-[44px]"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Whitelist Dialog */}
      <Dialog
        open={bulkWhitelistDialogOpen}
        onOpenChange={setBulkWhitelistDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Whitelist Selected IPs</DialogTitle>
            <DialogDescription>
              Add {selectedIPs.length} selected IP{selectedIPs.length !== 1 ? 's' : ''} to the
              whitelist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="bulk-timeout-select"
                className="text-sm font-medium"
              >
                Timeout
              </label>
              <Select
                value={bulkWhitelistTimeout}
                onValueChange={setBulkWhitelistTimeout}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHITELIST_TIMEOUT_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset.value}
                      value={preset.value}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkWhitelistDialogOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkWhitelistSubmit}
              disabled={isWhitelisting}
              className="min-h-[44px]"
            >
              Whitelist All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Confirmation Dialog */}
      <Dialog
        open={bulkRemoveDialogOpen}
        onOpenChange={setBulkRemoveDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Selected Blocked IPs</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedIPs.length} blocked IP
              {selectedIPs.length !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRemoveDialogOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRemoveSubmit}
              disabled={isRemoving}
              className="min-h-[44px]"
            >
              Remove All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

BlockedIPsTableMobile.displayName = 'BlockedIPsTableMobile';
