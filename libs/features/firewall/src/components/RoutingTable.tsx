/**
 * Routing Table Component
 * Displays routing table entries in a sortable, read-only table
 * Epic 0.6, Story 0.6.3
 */

import { useMemo, useState } from 'react';
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

/**
 * Route type badge component
 */
function RouteTypeBadge({ type, dynamic }: { type: string; dynamic: boolean }) {
  const typeColors: Record<string, string> = {
    unicast: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blackhole: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    unreachable: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    prohibit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const colorClass = typeColors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <div className="flex gap-1 items-center">
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${colorClass}`}>
        {type}
      </span>
      {dynamic && (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          dynamic
        </span>
      )}
    </div>
  );
}

export interface RoutingTableProps {
  className?: string;
}

/**
 * RoutingTable Component
 *
 * Features:
 * - Displays all routing table entries
 * - Active routes highlighted (bold text)
 * - Dynamic routes marked with badge
 * - Route type badges (unicast, blackhole, unreachable, prohibit)
 * - Visual distinction for disabled routes (muted)
 * - Default route (0.0.0.0/0) prominently displayed
 * - Auto-refresh with 5-minute cache
 * - Sortable by any column
 *
 * @param props - Component props
 * @returns Routing table component
 */
export function RoutingTable({ className }: RoutingTableProps) {
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

  // Handle column header click for sorting
  const handleSort = (column: keyof RouteEntry) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        Error loading routes: {error.message}
      </div>
    );
  }

  // Empty state
  if (!routes || routes.length === 0) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        No routes found
      </div>
    );
  }

  // Check if this is the default route
  const isDefaultRoute = (destination: string) => {
    return destination === '0.0.0.0/0' || destination === '::/0';
  };

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => handleSort('destination')}
            >
              Destination {sortColumn === 'destination' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => handleSort('gateway')}
            >
              Gateway {sortColumn === 'gateway' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => handleSort('interface')}
            >
              Interface {sortColumn === 'interface' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => handleSort('distance')}
            >
              Distance {sortColumn === 'distance' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => handleSort('routeType')}
            >
              Type {sortColumn === 'routeType' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => handleSort('active')}
            >
              Active {sortColumn === 'active' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRoutes.map((route) => (
            <TableRow
              key={route.id}
              className={`
                ${route.disabled ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''}
                ${route.active ? 'bg-green-50 dark:bg-green-950' : ''}
                ${isDefaultRoute(route.destination) ? 'border-l-4 border-l-blue-500' : ''}
              `}
            >
              <TableCell className={`font-mono ${route.active ? 'font-bold' : ''}`}>
                {route.destination}
                {isDefaultRoute(route.destination) && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(default)</span>
                )}
              </TableCell>
              <TableCell className={route.disabled ? 'line-through' : ''}>
                {route.gateway || '-'}
              </TableCell>
              <TableCell className={route.disabled ? 'line-through' : ''}>
                {route.interface || '-'}
              </TableCell>
              <TableCell className="text-center">{route.distance}</TableCell>
              <TableCell>
                <RouteTypeBadge type={route.routeType} dynamic={route.dynamic} />
              </TableCell>
              <TableCell className="text-center">
                {route.active ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">●</span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">○</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
