/**
 * LeaseFilters Component
 *
 * Provides filtering controls for DHCP lease table:
 * - Status filter (All, Bound, Waiting, Busy, Offered, Static)
 * - Server filter (dropdown populated from available servers)
 * - Active filter badges with dismiss buttons
 *
 * Uses Zustand store for filter state management.
 *
 * @module features/network/dhcp/components/lease-filters
 */

import * as React from 'react';
import { X } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Icon,
} from '@nasnet/ui/primitives';
import { useDHCPUIStore } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/utils';

/**
 * DHCP lease status options for filtering
 */
const LEASE_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'bound', label: 'Bound' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'busy', label: 'Busy' },
  { value: 'offered', label: 'Offered' },
  { value: 'static', label: 'Static' },
] as const;

/**
 * Max width for filter controls
 */
const MAX_FILTER_CONTROLS_WIDTH = 160;

export interface LeaseFiltersProps {
  /**
   * Available DHCP servers for server filter dropdown
   */
  servers: Array<{ id: string; name: string }>;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Desktop filter controls for DHCP lease management
 *
 * Displays filter dropdowns and active filter badges with dismiss buttons.
 * Integrates with useDHCPUIStore for state management.
 *
 * @example
 * ```tsx
 * <LeaseFilters servers={dhcpServers} />
 * ```
 */
export const LeaseFilters = React.memo(function LeaseFilters({ servers, className }: LeaseFiltersProps) {
  const {
    leaseStatusFilter,
    leaseServerFilter,
    setLeaseStatusFilter,
    setLeaseServerFilter,
  } = useDHCPUIStore();

  // Calculate active filters count
  const activeFiltersCount = [
    leaseStatusFilter !== 'all',
    leaseServerFilter !== 'all',
  ].filter(Boolean).length;

  /**
   * Clear all active filters
   */
  const handleClearAll = () => {
    setLeaseStatusFilter('all');
    setLeaseServerFilter('all');
  };

  return (
    <div
      className={cn('flex flex-col gap-component-md', className)}
      role="search"
      aria-label="DHCP lease filters"
    >
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-component-sm">
        {/* Status Filter */}
        <div className="flex items-center gap-component-sm">
          <label
            htmlFor="lease-status-filter"
            className="text-sm font-medium text-foreground"
          >
            Status:
          </label>
          <Select
            value={leaseStatusFilter}
            onValueChange={(value) => setLeaseStatusFilter(value as typeof leaseStatusFilter)}
          >
            <SelectTrigger
              id="lease-status-filter"
              className="w-[160px]"
              aria-label="Filter by lease status"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {LEASE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Server Filter */}
        <div className="flex items-center gap-component-sm">
          <label
            htmlFor="lease-server-filter"
            className="text-sm font-medium text-foreground"
          >
            Server:
          </label>
          <Select
            value={leaseServerFilter}
            onValueChange={setLeaseServerFilter}
          >
            <SelectTrigger
              id="lease-server-filter"
              className="w-[200px]"
              aria-label="Filter by DHCP server"
            >
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Servers</SelectItem>
              {servers.map((server) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear All Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear all filters"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-component-sm" role="status" aria-live="polite">
          <span className="text-sm text-muted-foreground">
            Active filters:
          </span>

          {/* Status Filter Badge */}
          {leaseStatusFilter !== 'all' && (
            <div className="inline-flex items-center gap-component-xs rounded-pill bg-primary/10 px-component-sm py-component-xs text-sm">
              <span className="text-primary font-mono">
                Status: {LEASE_STATUS_OPTIONS.find(opt => opt.value === leaseStatusFilter)?.label}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLeaseStatusFilter('all')}
                className="h-6 w-6 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Remove status filter"
              >
                <Icon icon={X} size="sm" />
              </Button>
            </div>
          )}

          {/* Server Filter Badge */}
          {leaseServerFilter !== 'all' && (
            <div className="inline-flex items-center gap-component-xs rounded-pill bg-primary/10 px-component-sm py-component-xs text-sm">
              <span className="text-primary font-mono">
                Server: {servers.find(s => s.id === leaseServerFilter)?.name || leaseServerFilter}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLeaseServerFilter('all')}
                className="h-6 w-6 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Remove server filter"
              >
                <Icon icon={X} size="sm" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

LeaseFilters.displayName = 'LeaseFilters';
