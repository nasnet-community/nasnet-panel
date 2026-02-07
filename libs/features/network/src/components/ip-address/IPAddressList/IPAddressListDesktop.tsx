/**
 * IPAddressListDesktop - Desktop/Tablet Presenter
 * NAS-6.2: IP Address Management
 *
 * Dense table layout optimized for mouse/keyboard interaction.
 * Uses DataTable with sorting, filtering, and row actions.
 */

import { useMemo } from 'react';
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
} from '@nasnet/ui/primitives';
import { DataTable } from '@nasnet/ui/patterns';
import type { DataTableColumn } from '@nasnet/ui/patterns';
import { AlertCircle, Edit, MoreVertical, RefreshCw, Trash } from 'lucide-react';

import type { IPAddressData, IPAddressListProps } from './types';

export function IPAddressListDesktop({
  ipAddresses,
  loading = false,
  error,
  filters,
  sortOptions,
  onFiltersChange,
  onSortChange,
  onEdit,
  onDelete,
  onToggleDisabled,
  onRefresh,
}: IPAddressListProps) {
  // Filter IP addresses based on current filters
  const filteredIpAddresses = useMemo(() => {
    let filtered = [...ipAddresses];

    // Filter by interface
    if (filters.interfaceName) {
      filtered = filtered.filter((ip) =>
        ip.interface.name.toLowerCase().includes(filters.interfaceName!.toLowerCase())
      );
    }

    // Filter by source (static/dynamic)
    if (filters.source && filters.source !== 'all') {
      const isDynamic = filters.source === 'dynamic';
      filtered = filtered.filter((ip) => ip.dynamic === isDynamic);
    }

    // Filter by status (enabled/disabled)
    if (filters.status && filters.status !== 'all') {
      const isDisabled = filters.status === 'disabled';
      filtered = filtered.filter((ip) => ip.disabled === isDisabled);
    }

    // Filter by search text (address or comment)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (ip) =>
          ip.address.toLowerCase().includes(searchLower) ||
          ip.comment?.toLowerCase().includes(searchLower)
      );
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      const direction = sortOptions.direction === 'asc' ? 1 : -1;
      switch (sortOptions.field) {
        case 'address':
          return direction * a.address.localeCompare(b.address);
        case 'interface':
          return direction * a.interface.name.localeCompare(b.interface.name);
        case 'network':
          return direction * (a.network || '').localeCompare(b.network || '');
        case 'comment':
          return direction * (a.comment || '').localeCompare(b.comment || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [ipAddresses, filters, sortOptions]);

  // Define table columns
  const columns = useMemo<DataTableColumn<IPAddressData>[]>(
    () => [
      {
        key: 'address',
        header: 'Address',
        cell: (ip) => (
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{ip.address}</code>
            {ip.dynamic && (
              <Badge variant="secondary" className="text-xs">
                Dynamic
              </Badge>
            )}
            {ip.invalid && (
              <Badge variant="destructive" className="text-xs">
                Invalid
              </Badge>
            )}
            {ip.disabled && (
              <Badge variant="outline" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'interface',
        header: 'Interface',
        cell: (ip) => (
          <span className="text-sm font-medium">{ip.interface.name}</span>
        ),
      },
      {
        key: 'network',
        header: 'Network',
        cell: (ip) => (
          <code className="text-sm text-muted-foreground">
            {ip.network || '-'}
          </code>
        ),
      },
      {
        key: 'broadcast',
        header: 'Broadcast',
        cell: (ip) => (
          <code className="text-sm text-muted-foreground">
            {ip.broadcast || '-'}
          </code>
        ),
      },
      {
        key: 'comment',
        header: 'Comment',
        cell: (ip) => (
          <span className="text-sm text-muted-foreground">
            {ip.comment || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: (ip) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={ip.dynamic} // Disable actions for dynamic IPs
                aria-label={`Actions for ${ip.address}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit?.(ip)}
                disabled={ip.dynamic}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleDisabled?.(ip)}
                disabled={ip.dynamic}
              >
                {ip.disabled ? 'Enable' : 'Disable'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(ip)}
                disabled={ip.dynamic}
                className="text-destructive"
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
          <CardTitle>IP Addresses</CardTitle>
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
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Search address or comment..."
            value={filters.searchText || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchText: e.target.value })
            }
            className="max-w-sm"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredIpAddresses}
          isLoading={loading}
          emptyMessage="No IP addresses found. Add an IP address to get started."
          keyExtractor={(ip) => ip.id}
        />

        {/* Footer info */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredIpAddresses.length} of {ipAddresses.length} IP
          address{ipAddresses.length !== 1 ? 'es' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
