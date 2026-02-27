import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
 cn } from '@nasnet/ui/primitives';

import type {
  VLANAllocationTableProps,
  VLANAllocation,
  VLANAllocationSort,
} from './VLANAllocationTable';

/**
 * Desktop presenter for VLANAllocationTable
 * Dense data table with all columns visible, hover states
 */
export function VLANAllocationTableDesktop({
  allocations,
  loading,
  onRefresh,
  className,
}: VLANAllocationTableProps) {
  const [search, setSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<VLANAllocationSort>('vlanID');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
      let comparison = 0;
      switch (sortBy) {
        case 'vlanID':
          comparison = a.vlanID - b.vlanID;
          break;
        case 'allocatedAt':
          comparison =
            new Date(a.allocatedAt).getTime() -
            new Date(b.allocatedAt).getTime();
          break;
        case 'serviceType':
          comparison = a.serviceType.localeCompare(b.serviceType);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: VLANAllocationSort) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

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

  const SortIcon = ({ column }: { column: VLANAllocationSort }) => {
    if (sortBy !== column) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <Card className={cn('bg-card border border-border rounded-[var(--semantic-radius-card)]', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>VLAN Allocations</CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-component-md mt-4">
          <Input
            placeholder="Search by instance name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-[180px]">
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ALLOCATED">Allocated</SelectItem>
              <SelectItem value="RELEASING">Releasing</SelectItem>
              <SelectItem value="RELEASED">Released</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground flex items-center">
            {filtered.length} allocation{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border border-border rounded-[var(--semantic-radius-card)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => handleSort('vlanID')}
                >
                  VLAN ID
                  <SortIcon column="vlanID" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => handleSort('serviceType')}
                >
                  Service Type
                  <SortIcon column="serviceType" />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instance Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bind IP</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interface</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  onClick={() => handleSort('allocatedAt')}
                >
                  Allocated At
                  <SortIcon column="allocatedAt" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No allocations found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((alloc) => (
                  <TableRow key={alloc.id} className="h-10 border-b border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm">{alloc.vlanID}</TableCell>
                    <TableCell className="text-sm">{alloc.serviceType}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {alloc.instanceName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {alloc.bindIP ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded-[var(--semantic-radius-input)] font-mono">
                          {alloc.bindIP}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {alloc.interfaceName ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded-[var(--semantic-radius-input)] font-mono">
                          {alloc.interfaceName}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-[var(--semantic-radius-badge)] text-xs font-medium border',
                          getStatusColor(alloc.status)
                        )}
                      >
                        {alloc.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(alloc.allocatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

VLANAllocationTableDesktop.displayName = 'VLANAllocationTable.Desktop';
