/**
 * RouteListMobile - Mobile Presenter
 * NAS-6.5: Static Route Management
 *
 * Card-based layout optimized for touch interaction.
 * 44px minimum touch targets, simplified UI.
 */

import { memo, useMemo } from 'react';
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
} from '@nasnet/ui/primitives';
import { StatusDot } from '@nasnet/ui/patterns';
import { AlertCircle, Edit, RefreshCw, Trash } from 'lucide-react';
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

function RouteListMobileComponent({
  routes,
  loading = false,
  error,
  filters,
  availableTables,
  onFiltersChange,
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

    return filtered;
  }, [routes, filters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Routes</h2>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-[44px]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Filters - Vertical Stack */}
      <div className="space-y-3">
        <Input
          placeholder="Search destination, gateway..."
          value={filters.searchText || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, searchText: e.target.value })
          }
          className="min-h-[44px]"
          aria-label="Search routes"
        />

        <Select
          value={filters.table || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, table: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="min-h-[44px]" aria-label="Filter by routing table">
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
          <SelectTrigger className="min-h-[44px]" aria-label="Filter by route type">
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

        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={filters.activeOnly || false}
            onChange={(e) =>
              onFiltersChange({ ...filters, activeOnly: e.target.checked })
            }
            className="h-5 w-5 rounded border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Show active routes only"
          />
          <span className="text-sm">Active only</span>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading routes...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredRoutes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No routes found. Add a route to get started.
          </CardContent>
        </Card>
      )}

      {/* Route Cards */}
      {!loading && filteredRoutes.length > 0 && (
        <div className="space-y-3">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleDisabled={onToggleDisabled}
            />
          ))}
        </div>
      )}

      {/* Footer info */}
      {!loading && filteredRoutes.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pb-4">
          Showing {filteredRoutes.length} of {routes.length} route
          {routes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Route Card for Mobile
 * 44px minimum touch targets
 */
interface RouteCardProps {
  route: Route;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
  onToggleDisabled?: (route: Route) => void;
}

function RouteCard({
  route,
  onEdit,
  onDelete,
  onToggleDisabled,
}: RouteCardProps) {
  const isStatic = route.type === 'STATIC';
  const { variant, text } = getRouteTypeBadge(route.type);
  const isDefaultRoute = route.destination === '0.0.0.0/0';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <code className="text-base font-mono font-semibold">
              {route.destination}
            </code>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant={variant} className="text-xs">
                {text}
              </Badge>
              {isDefaultRoute && (
                <Badge variant="default" className="text-xs">
                  Default
                </Badge>
              )}
              {route.disabled && (
                <Badge variant="outline" className="text-xs">
                  Disabled
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot className={route.active ? 'bg-success' : 'bg-muted'} />
            <span className="text-xs text-muted-foreground">
              {route.disabled ? 'Disabled' : route.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Gateway */}
        {route.gateway && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gateway:</span>
            <code className="text-sm">{route.gateway}</code>
          </div>
        )}

        {/* Interface */}
        {route.interface && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interface:</span>
            <span className="font-medium">{route.interface}</span>
          </div>
        )}

        {/* Distance */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Distance:</span>
          <span className="tabular-nums">{route.distance}</span>
        </div>

        {/* Routing Table */}
        {route.routingTable && route.routingTable !== 'main' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Table:</span>
            <span>{route.routingTable}</span>
          </div>
        )}

        {/* Routing Mark */}
        {route.routingMark && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mark:</span>
            <span>{route.routingMark}</span>
          </div>
        )}

        {/* Comment */}
        {route.comment && (
          <div className="text-sm">
            <span className="text-muted-foreground">Comment: </span>
            <span>{route.comment}</span>
          </div>
        )}

        {/* Actions - Full width buttons with 44px height */}
        <div className="pt-2 space-y-2">
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => onEdit?.(route)}
            disabled={!isStatic}
            aria-label={`Edit route ${route.destination}`}
          >
            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 min-h-[44px]"
              onClick={() => onToggleDisabled?.(route)}
              disabled={!isStatic}
              aria-label={`${route.disabled ? 'Enable' : 'Disable'} route ${route.destination}`}
            >
              {route.disabled ? 'Enable' : 'Disable'}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 min-h-[44px]"
              onClick={() => onDelete?.(route)}
              disabled={!isStatic}
              aria-label={`Delete route ${route.destination}`}
            >
              <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const RouteListMobile = memo(RouteListMobileComponent);
