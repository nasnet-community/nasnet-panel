/**
 * RouteListDesktop - Desktop/Tablet Presenter
 * NAS-6.5: Static Route Management
 *
 * Dense table layout optimized for mouse/keyboard interaction.
 * Uses DataTable with sorting, filtering, and row actions.
 */

import { memo, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { DataTable, StatusDot } from '@nasnet/ui/patterns';
import type { DataTableColumn } from '@nasnet/ui/patterns';
import { AlertCircle, Edit, MoreVertical, RefreshCw, Trash } from 'lucide-react';
import type { Route, RouteType } from '@nasnet/api-client/generated';

import type { RouteListProps } from './types';

/**
 * Get badge variant and text for route type
 */
function getRouteTypeBadge(type: RouteType) {
  switch (type) {
    case 'STATIC':
      return { variant: 'default' as const, text: 'Static' };
    case 'CONNECTED':
      return { variant: 'secondary' as const, text: 'Connected' };
    case 'DYNAMIC':
      return { variant: 'outline' as const, text: 'Dynamic' };
    case 'BGP':
      return { variant: 'default' as const, text: 'BGP' };
    case 'OSPF':
      return { variant: 'default' as const, text: 'OSPF' };
    default:
      return { variant: 'outline' as const, text: type };
  }
}

function RouteListDesktopComponent({
  routes,
  loading = false,
  error,
  filters,
  sortOptions,
  availableTables,
  onFiltersChange,
  onSortChange,
  onEdit,
  onDelete,
  onToggleDisabled,
  onRefresh,
}: RouteListProps) {
  // Filter routes based on current filters
  const filteredRoutes = useMemo(() => {
    let filtered = [...routes];

    // Filter by routing table
    if (filters.table && filters.table !== 'all') {
      filtered = filtered.filter((route) => route.routingTable === filters.table);
    }

    // Filter by route type
    if (filters.type) {
      filtered = filtered.filter((route) => route.type === filters.type);
    }

    // Filter by active status
    if (filters.activeOnly) {
      filtered = filtered.filter((route) => route.active);
    }

    // Filter by search text (destination, gateway, or comment)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (route) =>
          route.destination.toLowerCase().includes(searchLower) ||
          route.gateway?.toLowerCase().includes(searchLower) ||
          route.interface?.toLowerCase().includes(searchLower) ||
          route.comment?.toLowerCase().includes(searchLower)
      );
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      const direction = sortOptions.direction === 'asc' ? 1 : -1;
      switch (sortOptions.field) {
        case 'destination':
          return direction * a.destination.localeCompare(b.destination);
        case 'gateway':
          return direction * (a.gateway || '').localeCompare(b.gateway || '');
        case 'interface':
          return direction * (a.interface || '').localeCompare(b.interface || '');
        case 'distance':
          return direction * (a.distance - b.distance);
        case 'type':
          return direction * a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [routes, filters, sortOptions]);

  // Define table columns
  const columns = useMemo<DataTableColumn<Route>[]>(
    () => [
      {
        key: 'destination',
        header: 'Destination',
        cell: (route) => (
          <div className="flex items-center gap-component-sm">
            <code className="text-sm font-mono text-foreground">{route.destination}</code>
            {route.destination === '0.0.0.0/0' && (
              <Badge variant="default" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'gateway',
        header: 'Gateway',
        cell: (route) => (
          <code className="text-sm font-mono text-foreground">
            {route.gateway || '-'}
          </code>
        ),
      },
      {
        key: 'interface',
        header: 'Interface',
        cell: (route) => (
          <span className="text-sm font-medium">{route.interface || '-'}</span>
        ),
      },
      {
        key: 'distance',
        header: 'Distance',
        cell: (route) => (
          <span className="text-sm tabular-nums">{route.distance}</span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        cell: (route) => {
          const { variant, text } = getRouteTypeBadge(route.type);
          return <Badge variant={variant}>{text}</Badge>;
        },
      },
      {
        key: 'status',
        header: 'Status',
        cell: (route) => (
          <div className="flex items-center gap-component-sm">
            <StatusDot className={route.active ? 'bg-success' : 'bg-muted'} />
            <span className="text-sm">
              {route.disabled ? 'Disabled' : route.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: (route) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={route.type !== 'STATIC'} // Only allow actions on static routes
                aria-label={`Actions for ${route.destination}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit?.(route)}
                disabled={route.type !== 'STATIC'}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleDisabled?.(route)}
                disabled={route.type !== 'STATIC'}
              >
                {route.disabled ? 'Enable' : 'Disable'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(route)}
                disabled={route.type !== 'STATIC'}
                className="text-error"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onEdit, onDelete, onToggleDisabled]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Routes</CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-component-md flex flex-wrap gap-component-md">
          <Input
            placeholder="Search destination, gateway, or comment..."
            value={filters.searchText || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchText: e.target.value })
            }
            className="max-w-sm"
            aria-label="Search routes"
          />

          <Select
            value={filters.table || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, table: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className="w-48" aria-label="Filter by routing table">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {availableTables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                type: value === 'all' ? undefined : (value as RouteType),
              })
            }
          >
            <SelectTrigger className="w-48" aria-label="Filter by route type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="STATIC">Static</SelectItem>
              <SelectItem value="CONNECTED">Connected</SelectItem>
              <SelectItem value="DYNAMIC">Dynamic</SelectItem>
              <SelectItem value="BGP">BGP</SelectItem>
              <SelectItem value="OSPF">OSPF</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.activeOnly || false}
              onChange={(e) =>
                onFiltersChange({ ...filters, activeOnly: e.target.checked })
              }
              className="h-4 w-4 rounded border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Show active routes only"
            />
            <span className="text-sm">Active only</span>
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" className="mb-component-md flex items-center gap-component-sm rounded-lg border border-error bg-error/10 p-component-sm text-sm text-error">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredRoutes}
          isLoading={loading}
          emptyMessage="No routes found. Add a route to get started."
          keyExtractor={(route) => route.id}
        />

        {/* Footer info */}
        <div className="mt-component-md text-sm text-muted-foreground">
          Showing {filteredRoutes.length} of {routes.length} route
          {routes.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}

export const RouteListDesktop = memo(RouteListDesktopComponent);
