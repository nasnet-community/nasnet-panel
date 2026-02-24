/**
 * PortRegistryViewDesktop Component
 *
 * Desktop presenter for port registry (≥640px viewports).
 * Implements dense data table layout with sorting, filtering, and hover states.
 *
 * Features:
 * - DataTable with 6 sortable columns
 * - Protocol filter (All/TCP/UDP)
 * - Service type filter
 * - Empty state with icon
 * - Dense layout optimized for power users
 * - Hover states with tooltips
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import React, { useCallback, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Network, RefreshCw } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@nasnet/ui/primitives';
import { DataTable } from '@nasnet/ui/patterns';
import type { DataTableColumn } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';

import { usePortAllocations } from '@nasnet/api-client/queries';
import type { PortAllocation } from '@nasnet/api-client/generated';

/**
 * PortRegistryViewDesktop props
 */
export interface PortRegistryViewDesktopProps {
  /** Router ID to display allocations for */
  routerId: string;

  /** Optional className for styling */
  className?: string;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param timestamp ISO 8601 timestamp string
 * @returns Human-readable relative time string
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * PortRegistryViewDesktop component
 *
 * Desktop-optimized presenter with DataTable, sorting, and filtering.
 */
export const PortRegistryViewDesktop = React.memo(function PortRegistryViewDesktop({
  routerId,
  className,
}: PortRegistryViewDesktopProps) {
  const {
    sortedAllocations,
    filters,
    setFilters,
    sort,
    setSort,
    loading,
    error,
    refetch,
  } = usePortAllocations(routerId);

  // Extract unique service types for filter
  const serviceTypes = useMemo(() => {
    const types = new Set(sortedAllocations.map((a) => a.serviceType));
    return Array.from(types).sort();
  }, [sortedAllocations]);

  /**
   * Toggle sort direction or change field
   * Stable reference via useCallback to prevent unnecessary column re-renders
   */
  const handleSort = useCallback(
    (field: 'port' | 'serviceType' | 'allocatedAt') => {
      if (sort.field === field) {
        // Toggle direction if same field
        setSort({
          field,
          direction: sort.direction === 'asc' ? 'desc' : 'asc',
        });
      } else {
        // Change field, default to ascending
        setSort({ field, direction: 'asc' });
      }
    },
    [sort.field, sort.direction, setSort]
  );

  /**
   * Render sort icon based on current sort state
   * Indicates sort direction: none/neutral, ascending, descending
   */
  const renderSortIcon = useCallback(
    (field: 'port' | 'serviceType' | 'allocatedAt') => {
      if (sort.field !== field) {
        return (
          <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" aria-hidden="true" />
        );
      }
      return sort.direction === 'asc' ? (
        <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
      );
    },
    [sort.field, sort.direction]
  );

  // Define DataTable columns
  const columns: DataTableColumn<PortAllocation>[] = useMemo(
    () => [
      {
        key: 'port',
        header: (
          <button
            onClick={() => handleSort('port')}
            className="flex items-center hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label={`Sort by port ${sort.field === 'port' ? (sort.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
          >
            Port
            {renderSortIcon('port')}
          </button>
        ),
        cell: (item) => (
          <Badge variant="outline" className="font-mono font-semibold text-sm">
            {item.port}
          </Badge>
        ),
        className: 'font-medium',
      },
      {
        key: 'protocol',
        header: 'Protocol',
        cell: (item) => (
          <Badge
            variant={item.protocol === 'TCP' ? 'secondary' : 'default'}
            className="uppercase"
          >
            {item.protocol}
          </Badge>
        ),
      },
      {
        key: 'serviceType',
        header: (
          <button
            onClick={() => handleSort('serviceType')}
            className="flex items-center hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label={`Sort by service type ${sort.field === 'serviceType' ? (sort.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
          >
            Service Type
            {renderSortIcon('serviceType')}
          </button>
        ),
        cell: (item) => (
          <span className="text-muted-foreground">{item.serviceType}</span>
        ),
      },
      {
        key: 'instanceID',
        header: 'Instance',
        cell: (item) => (
          <div>
            <div className="font-medium text-sm">Instance {item.instanceID.slice(-6)}</div>
            <div className="text-xs text-muted-foreground font-mono break-all">
              {item.instanceID}
            </div>
          </div>
        ),
      },
      {
        key: 'notes',
        header: 'Purpose',
        cell: (item) => (
          <span className="text-sm text-muted-foreground max-w-xs truncate block">
            {item.notes || '-'}
          </span>
        ),
      },
      {
        key: 'allocatedAt',
        header: (
          <button
            onClick={() => handleSort('allocatedAt')}
            className="flex items-center hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label={`Sort by allocation date ${sort.field === 'allocatedAt' ? (sort.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
          >
            Allocated
            {renderSortIcon('allocatedAt')}
          </button>
        ),
        cell: (item) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(item.allocatedAt)}
          </span>
        ),
      },
    ],
    [sort, handleSort]
  );

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" aria-hidden="true" />
                Port Registry
              </CardTitle>
              <CardDescription>
                Centralized port allocation tracking for service instances
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base px-3 py-1">
                {sortedAllocations.length} {sortedAllocations.length === 1 ? 'port' : 'ports'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
                aria-label="Refresh port allocations"
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-1', loading && 'animate-spin')}
                  aria-hidden="true"
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <CardContent className="border-t pt-component-sm">
          <div className="flex items-center gap-component-md">
            {/* Protocol Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Protocol:</span>
              <Select
                value={filters.protocol || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, protocol: value as any })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="UDP">UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Service:</span>
              <Select
                value={filters.serviceType || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, serviceType: value })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(filters.protocol !== 'all' || filters.serviceType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ protocol: 'all', serviceType: 'all' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading && sortedAllocations.length === 0 ? (
            <div className="p-component-lg space-y-component-sm">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-component-lg text-center">
              <div className="text-error font-medium mb-2">
                Failed to load port allocations
              </div>
              <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                aria-label="Retry loading port allocations"
              >
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={sortedAllocations}
              emptyMessage="No port allocations found"
              isLoading={loading}
              keyExtractor={(item) => item.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && sortedAllocations.length === 0 && !error && (
        <div className="text-center py-component-lg">
          <div className="text-muted-foreground mx-auto mb-4 flex justify-center">
            <svg
              className="h-16 w-16 stroke-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.007H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.007H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.007H3.75v-.007zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Port Allocations</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No ports have been allocated for this router yet. Ports will appear here
            when service instances are created.
          </p>
        </div>
      )}
    </div>
  );
});

PortRegistryViewDesktop.displayName = 'PortRegistryViewDesktop';
