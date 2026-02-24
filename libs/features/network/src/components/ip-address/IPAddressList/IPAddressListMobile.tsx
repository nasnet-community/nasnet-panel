/**
 * IPAddressListMobile - Mobile Presenter
 * NAS-6.2: IP Address Management
 *
 * Card-based layout optimized for touch interaction.
 * 44px minimum touch targets, simplified UI.
 *
 * @description Mobile presenter for IP address list with card-based layout,
 * full-width touch targets (44px minimum), and streamlined action buttons.
 */

import { memo, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '@nasnet/ui/primitives';
import { AlertCircle, Edit, RefreshCw, Trash } from 'lucide-react';

import type { IPAddressData, IPAddressListProps } from './types';

function IPAddressListMobileComponent({
  ipAddresses,
  loading = false,
  error,
  filters,
  onFiltersChange,
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

    return filtered;
  }, [ipAddresses, filters]);

  return (
    <div className="space-y-component-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold">IP Addresses</h2>
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

      {/* Search Filter */}
      <Input
        placeholder="Search address or comment..."
        value={filters.searchText || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, searchText: e.target.value })
        }
        className="min-h-[44px]"
      />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-component-sm rounded-md border border-destructive/50 bg-error/10 p-component-sm text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-component-lg text-muted-foreground">
          Loading IP addresses...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredIpAddresses.length === 0 && (
        <Card>
          <CardContent className="py-component-lg text-center text-muted-foreground">
            No IP addresses found. Add an IP address to get started.
          </CardContent>
        </Card>
      )}

      {/* IP Address Cards */}
      {!loading && filteredIpAddresses.length > 0 && (
        <div className="space-y-component-sm">
          {filteredIpAddresses.map((ip) => (
            <IPAddressCard
              key={ip.id}
              ipAddress={ip}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleDisabled={onToggleDisabled}
            />
          ))}
        </div>
      )}

      {/* Footer info */}
      {!loading && filteredIpAddresses.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pb-4">
          Showing {filteredIpAddresses.length} of {ipAddresses.length} IP
          address{ipAddresses.length !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  );
}

/**
 * Individual IP Address Card for Mobile
 * 44px minimum touch targets
 */
interface IPAddressCardProps {
  ipAddress: IPAddressData;
  onEdit?: (ipAddress: IPAddressData) => void;
  onDelete?: (ipAddress: IPAddressData) => void;
  onToggleDisabled?: (ipAddress: IPAddressData) => void;
}

function IPAddressCardComponent({
  ipAddress,
  onEdit,
  onDelete,
  onToggleDisabled,
}: IPAddressCardProps) {
  const isDynamic = ipAddress.dynamic;

  return (
    <Card>
      <CardHeader className="pb-component-sm">
        <div className="flex items-start justify-between gap-component-sm">
          <div className="flex-1">
            <code className="text-base font-mono font-semibold block">
              {ipAddress.address}
            </code>
            <div className="mt-1 flex flex-wrap gap-component-sm">
              {isDynamic && (
                <Badge variant="secondary" className="text-xs">
                  Dynamic
                </Badge>
              )}
              {ipAddress.invalid && (
                <Badge variant="error" className="text-xs">
                  Invalid
                </Badge>
              )}
              {ipAddress.disabled && (
                <Badge variant="outline" className="text-xs">
                  Disabled
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-component-sm">
        {/* Interface */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Interface:</span>
          <span className="font-medium">{ipAddress.interface.name}</span>
        </div>

        {/* Network */}
        {ipAddress.network && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network:</span>
            <code className="text-sm font-mono">{ipAddress.network}</code>
          </div>
        )}

        {/* Broadcast */}
        {ipAddress.broadcast && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Broadcast:</span>
            <code className="text-sm font-mono">{ipAddress.broadcast}</code>
          </div>
        )}

        {/* Comment */}
        {ipAddress.comment && (
          <div className="text-sm">
            <span className="text-muted-foreground">Comment: </span>
            <span>{ipAddress.comment}</span>
          </div>
        )}

        {/* Actions - Full width buttons with 44px height */}
        <div className="pt-component-sm space-y-component-sm">
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => onEdit?.(ipAddress)}
            disabled={isDynamic}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <div className="flex gap-component-sm">
            <Button
              variant="outline"
              className="flex-1 min-h-[44px]"
              onClick={() => onToggleDisabled?.(ipAddress)}
              disabled={isDynamic}
            >
              {ipAddress.disabled ? 'Enable' : 'Disable'}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 min-h-[44px]"
              onClick={() => onDelete?.(ipAddress)}
              disabled={isDynamic}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const IPAddressCard = memo(IPAddressCardComponent);
IPAddressCard.displayName = 'IPAddressCard';

export const IPAddressListMobile = memo(IPAddressListMobileComponent);
IPAddressListMobile.displayName = 'IPAddressListMobile';
