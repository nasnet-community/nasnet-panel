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
 cn } from '@nasnet/ui/primitives';

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
  const serviceTypes = Array.from(
    new Set(allocations.map((a) => a.serviceType))
  );

  // Filter and sort
  const filtered = allocations
    .filter((alloc) => {
      const matchesSearch =
        search === '' ||
        alloc.instanceName.toLowerCase().includes(search.toLowerCase());
      const matchesService =
        serviceTypeFilter === 'all' || alloc.serviceType === serviceTypeFilter;
      const matchesStatus =
        statusFilter === 'all' || alloc.status === statusFilter;
      return matchesSearch && matchesService && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'vlanID':
          return a.vlanID - b.vlanID;
        case 'allocatedAt':
          return (
            new Date(b.allocatedAt).getTime() -
            new Date(a.allocatedAt).getTime()
          );
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
    <div className={cn('space-y-3', className)}>
      {/* Filters */}
      <Card className="p-3">
        <div className="space-y-3">
          {/* Search */}
          <Input
            placeholder="Search by instance name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />

          {/* Service Type Filter */}
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
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
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as VLANAllocationSort)}>
            <SelectTrigger className="w-full">
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
              className="w-full min-h-[44px]"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </Card>

      {/* Results count */}
      <div className="px-1 text-sm text-muted-foreground">
        {filtered.length} allocation{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Allocation cards */}
      {loading && filtered.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">Loading...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No allocations found
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((alloc) => (
            <Card key={alloc.id} className="p-3">
              <CardContent className="p-0 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-base">
                      VLAN {alloc.vlanID}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {alloc.instanceName}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border font-medium',
                      getStatusColor(alloc.status)
                    )}
                  >
                    {alloc.status}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{alloc.serviceType}</span>
                  </div>
                  {alloc.bindIP && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bind IP:</span>
                      <code className="text-xs bg-muted px-1 rounded">
                        {alloc.bindIP}
                      </code>
                    </div>
                  )}
                  {alloc.interfaceName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interface:</span>
                      <code className="text-xs bg-muted px-1 rounded">
                        {alloc.interfaceName}
                      </code>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated:</span>
                    <span className="text-xs">
                      {new Date(alloc.allocatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

VLANAllocationTableMobile.displayName = 'VLANAllocationTable.Mobile';
