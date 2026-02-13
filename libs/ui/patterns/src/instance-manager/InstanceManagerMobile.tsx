/**
 * InstanceManager Mobile Presenter
 *
 * Mobile-optimized presenter for InstanceManager pattern.
 * Optimized for touch interaction with simplified filtering.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@nasnet/ui/primitives';

import { ServiceCard } from '../service-card';

import { useInstanceManager } from './useInstanceManager';

import type { InstanceManagerProps } from './types';

/**
 * Mobile presenter for InstanceManager
 *
 * Features:
 * - Single column list layout
 * - Bottom sheet for filters
 * - Simplified bulk actions
 * - Pull-to-refresh ready
 */
export function InstanceManagerMobile(props: InstanceManagerProps) {
  const { loading, error, showMetrics, emptyState, className } = props;

  const {
    filteredInstances,
    filteredCount,
    selectedCount,
    activeFilters,
    availableBulkActions,
    canPerformBulkOperation,
    handleInstanceClick,
    handleBulkOperation,
    handleFilterChange,
    handleClearFilters,
  } = useInstanceManager(props);

  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className={`space-y-4 ${className || ''}`.trim()}>
      {/* Header with search and filter toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-3">
            {/* Search input */}
            <Input
              type="search"
              placeholder="Search instances..."
              value={activeFilters.search}
              onChange={(e) =>
                handleFilterChange({ search: e.target.value })
              }
              className="min-h-[44px]"
            />

            {/* Filter toggle button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full min-h-[44px]"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mr-2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
              {(activeFilters.category !== 'all' ||
                activeFilters.status !== 'all') && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>

            {/* Expandable filters */}
            {showFilters && (
              <div className="space-y-2 pt-2 border-t">
                <Select
                  value={activeFilters.category}
                  onValueChange={(value) =>
                    handleFilterChange({
                      category: value as typeof activeFilters.category,
                    })
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="proxy">Proxy</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={activeFilters.status}
                  onValueChange={(value) =>
                    handleFilterChange({
                      status: value as typeof activeFilters.status,
                    })
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="installed">Installed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Results count and bulk actions */}
        <CardContent className="pb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredCount} {filteredCount === 1 ? 'instance' : 'instances'}
              {selectedCount > 0 && ` • ${selectedCount} selected`}
            </span>
          </div>

          {/* Bulk actions */}
          {canPerformBulkOperation && (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableBulkActions.map((action) => (
                <Button
                  key={action.operation}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() => handleBulkOperation(action.operation)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredCount === 0 && (
        <Card>
          <CardContent className="p-8">
            {emptyState || (
              <div className="text-center text-sm text-muted-foreground">
                No instances found
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instance list */}
      {!loading && !error && filteredCount > 0 && (
        <div className="space-y-3">
          {filteredInstances.map((instance) => (
            <ServiceCard
              key={instance.id}
              service={instance}
              showMetrics={showMetrics}
              onClick={() => handleInstanceClick(instance)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
