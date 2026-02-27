/**
 * Routing Table Component
 * @description Displays router's routing table entries with sorting
 *
 * Features:
 * - Sortable columns (destination, gateway, interface, distance, type, active)
 * - Active routes highlighted (bold + green background)
 * - Dynamic routes marked with badge
 * - Route type badges (unicast, blackhole, unreachable, prohibit)
 * - Default route (0.0.0.0/0 or ::/0) marked with border
 * - Technical IP/gateway data in font-mono
 * - Disabled routes styling (opacity + line-through)
 */

import { useMemo, useState, useCallback } from 'react';
import { cn } from '@nasnet/ui/utils';
import { useRoutes } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';
import type { RouteEntry } from '@nasnet/core/types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ROUTE_PATTERNS = ['0.0.0.0/0', '::/0'];

/**
 * Renders a badge for route type with semantic colors
 * @description Maps route types to semantic color variants
 */
const RouteTypeBadge = ({ type, dynamic }: { type: string; dynamic: boolean }) => {
  const TYPE_VARIANT_MAP: Record<string, 'success' | 'error' | 'warning'> = {
    unicast: 'success',
    blackhole: 'error',
    unreachable: 'warning',
    prohibit: 'warning',
  };

  const variant = TYPE_VARIANT_MAP[type] || 'success';

  return (
    <div className="flex gap-component-xs items-center">
      <span className={cn(
        'inline-flex items-center px-component-sm py-component-xs text-xs font-medium rounded-md',
        variant === 'success' && 'bg-success/20 text-success',
        variant === 'error' && 'bg-error/20 text-error',
        variant === 'warning' && 'bg-warning/20 text-warning'
      )}>
        {type}
      </span>
      {dynamic && (
        <span className="inline-flex items-center px-component-sm py-component-xs text-xs font-medium rounded-md bg-info/20 text-info">
          dynamic
        </span>
      )}
    </div>
  );
};

RouteTypeBadge.displayName = 'RouteTypeBadge';

export interface RoutingTableProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * RoutingTable Component
 * @description Displays router's routing table with sortable columns
 *
 * @example
 * ```tsx
 * <RoutingTable />
 * ```
 */
export const RoutingTable = ({ className }: RoutingTableProps) => {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { routes, loading: isLoading, error } = useRoutes(routerIp);
  const [sortColumn, setSortColumn] = useState<keyof RouteEntry>('destination');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorted routes
  const sortedRoutes = useMemo(() => {
    if (!routes) return [];

    return [...routes].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDirection === 'asc'
          ? (aVal === bVal ? 0 : aVal ? -1 : 1)
          : (aVal === bVal ? 0 : aVal ? 1 : -1);
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [routes, sortColumn, sortDirection]);

  const handleSort = useCallback((column: keyof RouteEntry) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prevDir) => prevDir === 'asc' ? 'desc' : 'asc');
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  if (isLoading) {
    return (
      <div className={cn('p-component-md space-y-component-md animate-pulse', className)}>
        <div className="h-10 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-component-md text-error rounded-lg bg-error/10', className)}>
        <p className="font-medium">Error loading routes</p>
        <p className="text-sm mt-component-xs">{error.message}</p>
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className={cn('p-8 text-center space-y-2', className)}>
        <p className="font-semibold text-foreground">No routes found</p>
        <p className="text-sm text-muted-foreground">The routing table is empty</p>
      </div>
    );
  }

  const isDefaultRoute = (destination: string) => {
    return DEFAULT_ROUTE_PATTERNS.includes(destination);
  };

  return (
    <div className={cn(className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('destination')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSort('destination');
                }
              }}
            >
              Destination {sortColumn === 'destination' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('gateway')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSort('gateway');
                }
              }}
            >
              Gateway {sortColumn === 'gateway' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('interface')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSort('interface');
                }
              }}
            >
              Interface {sortColumn === 'interface' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('distance')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSort('distance');
                }
              }}
            >
              Distance {sortColumn === 'distance' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('routeType')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSort('routeType');
                }
              }}
            >
              Type {sortColumn === 'routeType' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleSort('active')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSort('active');
                }
              }}
            >
              Active {sortColumn === 'active' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRoutes.map((route) => (
            <TableRow
              key={route.id}
              className={cn(
                route.disabled && 'opacity-50',
                route.active && 'bg-success/5',
                isDefaultRoute(route.destination) && 'border-l-4 border-l-info'
              )}
            >
              <TableCell className={cn('font-mono', route.active && 'font-bold')}>
                {route.destination}
                {isDefaultRoute(route.destination) && (
                  <span className="ml-2 text-xs text-info">(default)</span>
                )}
              </TableCell>
              <TableCell className={cn('font-mono', route.disabled && 'line-through')}>
                {route.gateway || '-'}
              </TableCell>
              <TableCell className={cn(route.disabled && 'line-through')}>
                {route.interface || '-'}
              </TableCell>
              <TableCell className="text-center">{route.distance}</TableCell>
              <TableCell>
                <RouteTypeBadge type={route.routeType} dynamic={route.dynamic} />
              </TableCell>
              <TableCell className="text-center">
                {route.active ? (
                  <span className="text-success font-medium" aria-label="Route is active">●</span>
                ) : (
                  <span className="text-muted" aria-label="Route is inactive">○</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

RoutingTable.displayName = 'RoutingTable';
