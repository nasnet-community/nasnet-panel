/**
 * Connection History Table Component
 *
 * Display connection events with filtering and pagination.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */

import { useState, useMemo } from 'react';
import { EmptyState } from '@nasnet/ui/patterns';
import { Button } from '@nasnet/ui/primitives';
import { Input } from '@nasnet/ui/primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import {
  History,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { usePlatform } from '@nasnet/ui/layouts';
import {
  ConnectionEventCard,
  ConnectionEventCardCompact,
} from './ConnectionEventCard';
import type { ConnectionEventData } from '../../types/wan.types';

export interface ConnectionHistoryTableProps {
  events: ConnectionEventData[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  pageSize?: number;
}

/**
 * Connection History Table - Filterable, paginated event timeline
 */
export function ConnectionHistoryTable({
  events,
  loading = false,
  error = null,
  onRefresh,
  pageSize = 20,
}: ConnectionHistoryTableProps) {
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter events by type and search query
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
        const matchesInterface = event.wanInterfaceId
          ?.toLowerCase()
          .includes(query);
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
   * Reset page when filters change
   */
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  /**
   * Get unique event types for filter dropdown
   */
  const eventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.eventType));
    return Array.from(types).sort();
  }, [events]);

  /**
   * Loading state
   */
  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading connection history...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error && events.length === 0) {
    return (
      <div className="rounded-lg border border-error/20 bg-error/5 p-6">
        <div className="flex items-start gap-3">
          <History className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-error">
              Failed to load connection history
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
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
   */
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No Connection History"
        description="Connection events will appear here as WAN interfaces connect, disconnect, or change status."
      />
    );
  }

  /**
   * Empty filter results
   */
  if (filteredEvents.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by IP, interface, or reason..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
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
            onClick: () => {
              setFilterType('all');
              setSearchQuery('');
            },
            variant: 'outline',
          }}
        />
      </div>
    );
  }

  /**
   * History timeline
   */
  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by IP, interface, or reason..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
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
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedEvents.length} of {filteredEvents.length} events
        {filteredEvents.length !== events.length &&
          ` (${events.length} total)`}
      </div>

      {/* Event timeline */}
      <div className={isMobile ? 'space-y-3' : ''}>
        {paginatedEvents.map((event) =>
          isMobile ? (
            <ConnectionEventCardCompact key={event.id} event={event} />
          ) : (
            <ConnectionEventCard key={event.id} event={event} />
          )
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="mr-1 hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
