/**
 * Connection History Table Component
 *
 * Display WAN connection events with filtering, pagination, and platform-responsive layout.
 * Supports searching by IP/interface/reason and filtering by event type.
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */

import { useState, useMemo, useCallback } from 'react';
import { EmptyState } from '@nasnet/ui/patterns';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { History, Filter, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { usePlatform } from '@nasnet/ui/layouts';
import { cn } from '@nasnet/ui/utils';
import { ConnectionEventCard, ConnectionEventCardCompact } from './ConnectionEventCard';
import type { ConnectionEventData } from '../../types/wan.types';

export interface ConnectionHistoryTableProps {
  /** Array of connection events to display */
  events: ConnectionEventData[];
  /** Loading state indicator */
  loading?: boolean;
  /** Error state with message */
  error?: Error | null;
  /** Callback when refresh button is clicked */
  onRefresh?: () => void;
  /** Number of events per page (default: 20) */
  pageSize?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Connection History Table - Filterable, paginated event timeline
 */
function ConnectionHistoryTableComponent({
  events,
  loading = false,
  error = null,
  onRefresh,
  pageSize = 20,
  className,
}: ConnectionHistoryTableProps) {
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter events by type and search query
   * Filters by event type and searches across IP, interface, and reason fields
   */
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Filter by type
      if (filterType !== 'all' && event.eventType !== filterType) {
        return false;
      }

      // Filter by search query (IP, interface, reason)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesIP = event.publicIP?.toLowerCase().includes(query);
        const matchesInterface = event.wanInterfaceId?.toLowerCase().includes(query);
        const matchesReason = event.reason?.toLowerCase().includes(query);

        if (!matchesIP && !matchesInterface && !matchesReason) {
          return false;
        }
      }

      return true;
    });
  }, [events, filterType, searchQuery]);

  /**
   * Paginate filtered events
   */
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredEvents.slice(start, end);
  }, [filteredEvents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize);

  /**
   * Reset page when filter type changes
   */
  const handleFilterChange = useCallback((value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  }, []);

  /**
   * Reset page when search query changes
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  /**
   * Get unique event types for filter dropdown
   */
  const eventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.eventType));
    return Array.from(types).sort();
  }, [events]);

  /**
   * Handle clearing filters
   */
  const handleClearFilters = useCallback(() => {
    setFilterType('all');
    setSearchQuery('');
  }, []);

  /**
   * Handle pagination
   */
  const handlePreviousPage = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);

  const handleNextPage = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );

  /**
   * Loading state
   * Shows spinner and message while fetching initial data
   */
  if (loading && events.length === 0) {
    return (
      <div className={cn('py-component-lg flex items-center justify-center', className)}>
        <div className="gap-component-md flex flex-col items-center">
          <RefreshCw
            className="text-muted-foreground h-8 w-8 animate-spin"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-sm">Loading connection history...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   * Professional error message with retry option
   */
  if (error && events.length === 0) {
    return (
      <div
        className={cn(
          'border-error/20 bg-error/5 px-component-lg py-component-lg rounded-[var(--semantic-radius-card)] border',
          className
        )}
      >
        <div className="gap-component-md flex items-start">
          <History
            className="text-error mt-0.5 h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <h3 className="text-error font-semibold">Failed to load connection history</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-component-md"
                aria-label="Retry loading connection history"
              >
                <RefreshCw
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   * Helpful guidance when no events exist yet
   */
  if (events.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={History}
          title="No Connection History"
          description="Connection events will appear here as WAN interfaces connect, disconnect, or change status."
        />
      </div>
    );
  }

  /**
   * Empty filter results
   * Shows filters and helpful guidance to adjust criteria
   */
  if (filteredEvents.length === 0) {
    return (
      <div className={cn('space-y-component-md', className)}>
        {/* Filters */}
        <div className="gap-component-md flex flex-col sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by IP, interface, or reason..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search connection events"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger
              className="w-full sm:w-[200px]"
              aria-label="Filter by event type"
            >
              <Filter
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty results */}
        <EmptyState
          icon={Search}
          title="No matching events"
          description="Try adjusting your filters or search query."
          action={{
            label: 'Clear Filters',
            onClick: handleClearFilters,
            variant: 'outline',
          }}
        />
      </div>
    );
  }

  /**
   * History timeline
   * Full results with filters, pagination, and platform-responsive layout
   */
  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Header with filters */}
      <div className="gap-component-md flex flex-col sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by IP, interface, or reason..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search connection events"
          />
        </div>
        <div className="gap-component-sm flex">
          <Select
            value={filterType}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger
              className="w-full sm:w-[180px]"
              aria-label="Filter by event type"
            >
              <Filter
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh connection history"
            >
              <RefreshCw
                className={cn('h-4 w-4', loading && 'animate-spin')}
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-muted-foreground text-sm">
        Showing {paginatedEvents.length} of {filteredEvents.length} events
        {filteredEvents.length !== events.length && ` (${events.length} total)`}
      </div>

      {/* Event timeline */}
      <div
        className={isMobile ? 'space-y-component-sm' : ''}
        role="list"
      >
        {paginatedEvents.map((event) =>
          isMobile ?
            <div
              key={event.id}
              role="listitem"
            >
              <ConnectionEventCardCompact event={event} />
            </div>
          : <div
              key={event.id}
              role="listitem"
            >
              <ConnectionEventCard event={event} />
            </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-component-md border-border flex items-center justify-between border-t">
          <div className="text-muted-foreground text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <div className="gap-component-sm flex">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="ml-1 hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <span className="mr-1 hidden sm:inline">Next</span>
              <ChevronRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ConnectionHistoryTable = Object.assign(ConnectionHistoryTableComponent, {
  displayName: 'ConnectionHistoryTable',
}) as typeof ConnectionHistoryTableComponent & { displayName: string };
