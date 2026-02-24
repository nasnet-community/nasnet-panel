import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Button } from '@nasnet/ui/primitives';
import { InterfaceType, InterfaceStatus } from '@nasnet/api-client/generated';
import type { InterfaceFilters } from './InterfaceList';

export interface InterfaceListFiltersProps {
  filters: InterfaceFilters;
  onChange: (filters: InterfaceFilters) => void;
}

/**
 * Interface List Filters Component
 * Provides filtering controls for interface type, status, and search
 */
export const InterfaceListFilters = memo(function InterfaceListFilters({ filters, onChange }: InterfaceListFiltersProps) {
  const hasActiveFilters = filters.type || filters.status || filters.search;

  const handleClearFilters = () => {
    onChange({ type: null, status: null, search: '' });
  };

  return (
    <div className="flex gap-component-sm items-center flex-wrap" role="search" aria-label="Filter interfaces">
      {/* Type filter */}
      <Select
        value={filters.type ?? 'all'}
        onValueChange={(value) =>
          onChange({
            ...filters,
            type: value === 'all' ? null : (value as InterfaceType),
          })
        }
      >
        <SelectTrigger className="w-40 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Filter by interface type">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value={InterfaceType.Ethernet}>Ethernet</SelectItem>
          <SelectItem value={InterfaceType.Bridge}>Bridge</SelectItem>
          <SelectItem value={InterfaceType.Vlan}>VLAN</SelectItem>
          <SelectItem value={InterfaceType.Wireless}>Wireless</SelectItem>
          <SelectItem value={InterfaceType.Tunnel}>Tunnel</SelectItem>
          <SelectItem value={InterfaceType.Ppp}>PPP</SelectItem>
          <SelectItem value={InterfaceType.Bonding}>Bonding</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(value) =>
          onChange({
            ...filters,
            status: value === 'all' ? null : (value as InterfaceStatus),
          })
        }
      >
        <SelectTrigger className="w-40 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Filter by interface status">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value={InterfaceStatus.Up}>Up</SelectItem>
          <SelectItem value={InterfaceStatus.Down}>Down</SelectItem>
          <SelectItem value={InterfaceStatus.Disabled}>Disabled</SelectItem>
          <SelectItem value={InterfaceStatus.Unknown}>Unknown</SelectItem>
        </SelectContent>
      </Select>

      {/* Search */}
      <Input
        placeholder="Search by name..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="w-64 min-h-[44px]"
        aria-label="Search interfaces by name"
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="min-h-[44px]" aria-label="Clear all filters">
          Clear filters
        </Button>
      )}
    </div>
  );
});
