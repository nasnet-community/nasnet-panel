/**
 * InstanceManager Desktop Presenter
 *
 * Desktop-optimized presenter for InstanceManager pattern.
 * Dense table layout with advanced filtering and sorting.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { memo } from 'react';
import * as React from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';

import { useInstanceManager } from './useInstanceManager';

import type { InstanceManagerProps } from './types';
import type { BadgeVariant } from '../service-card/useServiceCard';

/**
 * Get badge variant for status
 */
function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'running':
      return 'success';
    case 'stopped':
    case 'installed':
      return 'secondary';
    case 'failed':
      return 'error';
    case 'starting':
    case 'stopping':
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Desktop presenter for InstanceManager
 *
 * Features:
 * - Data table with sorting
 * - Inline filters
 * - Bulk selection with checkboxes
 * - Hover states and actions
 */
function InstanceManagerDesktopComponent(props: InstanceManagerProps) {
  const { loading, error, showMetrics, emptyState, className, viewMode = 'list' } = props;

  const {
    filteredInstances,
    filteredCount,
    selectedCount,
    allSelected,
    someSelected,
    activeFilters,
    activeSort,
    availableBulkActions,
    canPerformBulkOperation,
    handleSelectAll,
    handleToggleSelection,
    handleInstanceClick,
    handleBulkOperation,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
  } = useInstanceManager(props);

  return (
    <div className={`space-y-4 ${className || ''}`.trim()}>
      {/* Filters and actions bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <Input
              type="search"
              placeholder="Search instances..."
              value={activeFilters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="max-w-xs"
            />

            {/* Category filter */}
            <Select
              value={activeFilters.category}
              onValueChange={(value) =>
                handleFilterChange({
                  category: value as typeof activeFilters.category,
                })
              }
            >
              <SelectTrigger className="w-40">
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

            {/* Status filter */}
            <Select
              value={activeFilters.status}
              onValueChange={(value) =>
                handleFilterChange({
                  status: value as typeof activeFilters.status,
                })
              }
            >
              <SelectTrigger className="w-40">
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

            {/* Clear filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={
                !activeFilters.search &&
                activeFilters.category === 'all' &&
                activeFilters.status === 'all'
              }
            >
              Clear
            </Button>

            <div className="flex-1" />

            {/* Results count */}
            <span className="text-muted-foreground text-sm">
              {filteredCount} {filteredCount === 1 ? 'instance' : 'instances'}
              {selectedCount > 0 && ` • ${selectedCount} selected`}
            </span>
          </div>

          {/* Bulk actions */}
          {canPerformBulkOperation && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-medium">Bulk Actions:</span>
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
        </CardHeader>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-12 w-full"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-destructive text-center text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredCount === 0 && (
        <Card>
          <CardContent className="p-12">
            {emptyState || (
              <div className="text-muted-foreground text-center text-sm">No instances found</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instance table */}
      {!loading && !error && filteredCount > 0 && viewMode === 'list' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {activeSort.field === 'name' && (
                      <span className="text-xs">{activeSort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSortChange('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {activeSort.field === 'category' && (
                      <span className="text-xs">{activeSort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSortChange('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {activeSort.field === 'status' && (
                      <span className="text-xs">{activeSort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                {showMetrics && (
                  <>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSortChange('cpu')}
                    >
                      <div className="flex items-center gap-1">
                        CPU
                        {activeSort.field === 'cpu' && (
                          <span className="text-xs">
                            {activeSort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSortChange('memory')}
                    >
                      <div className="flex items-center gap-1">
                        Memory
                        {activeSort.field === 'memory' && (
                          <span className="text-xs">
                            {activeSort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  </>
                )}
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstances.map((instance) => (
                <TableRow
                  key={instance.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleInstanceClick(instance)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={props.selectedIds?.includes(instance.id)}
                      onCheckedChange={() => handleToggleSelection(instance.id)}
                      aria-label={`Select ${instance.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{instance.name}</TableCell>
                  <TableCell className="capitalize">{instance.category}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(instance.status)}>{instance.status}</Badge>
                  </TableCell>
                  {showMetrics && (
                    <>
                      <TableCell>
                        {instance.metrics?.cpu !== undefined ?
                          `${instance.metrics.cpu.toFixed(1)}%`
                        : '-'}
                      </TableCell>
                      <TableCell>
                        {instance.metrics?.memory !== undefined ?
                          `${instance.metrics.memory} MB`
                        : '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-muted-foreground text-sm">
                    {instance.version || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// Wrap with memo for performance optimization
export const InstanceManagerDesktop = memo(InstanceManagerDesktopComponent);

// Set display name for React DevTools
InstanceManagerDesktop.displayName = 'InstanceManagerDesktop';
