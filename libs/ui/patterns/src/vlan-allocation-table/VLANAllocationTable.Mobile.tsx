import { useState } from 'react';

import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  cn,
} from '@nasnet/ui/primitives';

import type {
  VLANAllocationTableProps,
  VLANAllocation,
  VLANAllocationSort,
} from './VLANAllocationTable';

/**
 * Mobile presenter for VLANAllocationTable
 * Card-based list with expandable details, touch-friendly
 */
export function VLANAllocationTableMobile({
  allocations,
  loading,
  onRefresh,
  className,
}: VLANAllocationTableProps) {
  const [search, setSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<VLANAllocationSort>('vlanID');

  // Extract unique service types
  const serviceTypes = Array.from(new Set(allocations.map((a) => a.serviceType)));

  // Filter and sort
  const filtered = allocations
    .filter((alloc) => {
      const matchesSearch =
        search === '' || alloc.instanceName.toLowerCase().includes(search.toLowerCase());
      const matchesService = serviceTypeFilter === 'all' || alloc.serviceType === serviceTypeFilter;
      const matchesStatus = statusFilter === 'all' || alloc.status === statusFilter;
      return matchesSearch && matchesService && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'vlanID':
          return a.vlanID - b.vlanID;
        case 'allocatedAt':
          return new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime();
        case 'serviceType':
          return a.serviceType.localeCompare(b.serviceType);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: VLANAllocation['status']) => {
    switch (status) {
      case 'ALLOCATED':
        return 'bg-success/10 text-success border-success';
      case 'RELEASING':
        return 'bg-warning/10 text-warning border-warning';
      case 'RELEASED':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className={cn('space-y-component-sm', className)}>
      {/* Filters */}
      <Card className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
        <div className="space-y-component-md">
          {/* Search */}
          <Input
            placeholder="Search by instance name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />

          {/* Service Type Filter */}
          <Select
            value={serviceTypeFilter}
            onValueChange={setServiceTypeFilter}
          >
            <SelectTrigger className="min-h-[44px] w-full">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="min-h-[44px] w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ALLOCATED">Allocated</SelectItem>
              <SelectItem value="RELEASING">Releasing</SelectItem>
              <SelectItem value="RELEASED">Released</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as VLANAllocationSort)}
          >
            <SelectTrigger className="min-h-[44px] w-full">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vlanID">VLAN ID</SelectItem>
              <SelectItem value="allocatedAt">Allocated Date</SelectItem>
              <SelectItem value="serviceType">Service Type</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="min-h-[44px] w-full"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </Card>

      {/* Results count */}
      <div className="px-page-mobile text-muted-foreground text-sm">
        {filtered.length} allocation{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Allocation cards */}
      {loading && filtered.length === 0 ?
        <Card className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
          <p className="text-muted-foreground text-center text-sm">Loading...</p>
        </Card>
      : filtered.length === 0 ?
        <Card className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
          <p className="text-muted-foreground text-center text-sm">No allocations found</p>
        </Card>
      : <div className="space-y-component-sm">
          {filtered.map((alloc) => (
            <Card
              key={alloc.id}
              className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border"
            >
              <CardContent className="space-y-component-sm p-0">
                {/* Header */}
                <div className="gap-component-sm flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold">VLAN {alloc.vlanID}</div>
                    <div className="text-muted-foreground text-sm">{alloc.instanceName}</div>
                  </div>
                  <div
                    className={cn(
                      'rounded-[var(--semantic-radius-badge)] border px-2 py-1 text-xs font-medium',
                      getStatusColor(alloc.status)
                    )}
                  >
                    {alloc.status}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-component-sm text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{alloc.serviceType}</span>
                  </div>
                  {alloc.bindIP && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bind IP:</span>
                      <code className="bg-muted rounded-[var(--semantic-radius-input)] px-2 py-1 font-mono text-xs">
                        {alloc.bindIP}
                      </code>
                    </div>
                  )}
                  {alloc.interfaceName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interface:</span>
                      <code className="bg-muted rounded-[var(--semantic-radius-input)] px-2 py-1 font-mono text-xs">
                        {alloc.interfaceName}
                      </code>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated:</span>
                    <span className="text-xs">{new Date(alloc.allocatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

VLANAllocationTableMobile.displayName = 'VLANAllocationTable.Mobile';
