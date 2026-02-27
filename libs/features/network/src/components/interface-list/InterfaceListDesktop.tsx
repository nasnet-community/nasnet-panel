import { memo } from 'react';
import { DataTable } from '@nasnet/ui/patterns';
import { Badge, Button } from '@nasnet/ui/primitives';
import { InterfaceListFilters } from './InterfaceListFilters';
import { BatchActionsToolbar } from './BatchActionsToolbar';
import type { InterfaceFilters } from './InterfaceList';

export interface InterfaceListDesktopProps {
  interfaces: any[];
  allInterfaces: any[];
  loading: boolean;
  error: any;
  selectedIds: Set<string>;
  onSelect: (ids: Set<string>) => void;
  filters: InterfaceFilters;
  onFilterChange: (filters: InterfaceFilters) => void;
  onRefresh: () => void;
  routerId: string;
  onOpenDetail: (interfaceId: string) => void;
}

/**
 * Interface List Desktop Presenter
 * Displays interfaces in a table format optimized for desktop
 */
export const InterfaceListDesktop = memo(function InterfaceListDesktop({
  interfaces,
  allInterfaces,
  loading,
  error,
  selectedIds,
  onSelect,
  filters,
  onFilterChange,
  onRefresh,
  routerId,
  onOpenDetail,
}: InterfaceListDesktopProps) {
  // Get selected interface objects for safety checks
  const selectedInterfaces = allInterfaces.filter((iface) => selectedIds.has(iface.id));

  // Column definitions
  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (row: any) => (
        <span className="category-networking font-mono font-medium">{row.name}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row: any) => <Badge variant="outline">{row.type}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row: any) => {
        const variant =
          row.status === 'UP' ? 'success'
          : row.status === 'DOWN' ? 'error'
          : 'secondary';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'enabled',
      header: 'Enabled',
      cell: (row: any) => (
        <Badge variant={row.enabled ? 'default' : 'outline'}>{row.enabled ? 'Yes' : 'No'}</Badge>
      ),
    },
    {
      key: 'ip',
      header: 'IP Address',
      cell: (row: any) => (
        <span className="text-muted-foreground category-networking font-mono text-sm">
          {row.ip?.join(', ') || '-'}
        </span>
      ),
    },
    {
      key: 'mtu',
      header: 'MTU',
      cell: (row: any) => <span className="text-sm">{row.mtu || '-'}</span>,
    },
    {
      key: 'comment',
      header: 'Comment',
      cell: (row: any) => (
        <span className="text-muted-foreground max-w-xs truncate text-sm">
          {row.comment || '-'}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="space-y-component-md category-networking">
        <div className="flex items-center justify-between">
          <InterfaceListFilters
            filters={filters}
            onChange={onFilterChange}
          />
        </div>
        <div
          className="p-component-lg rounded-card-sm border-error bg-error/10 border text-center"
          role="alert"
        >
          <p className="text-error font-medium">Failed to load interfaces</p>
          <p className="text-error/70 mt-component-sm text-sm">
            {error.message || 'Unknown error'}
          </p>
          <Button
            onClick={onRefresh}
            className="mt-component-md"
            aria-label="Retry loading interfaces"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-component-md category-networking">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <InterfaceListFilters
          filters={filters}
          onChange={onFilterChange}
        />
        {selectedIds.size > 0 && (
          <BatchActionsToolbar
            routerId={routerId}
            selectedIds={selectedIds}
            selectedInterfaces={selectedInterfaces}
            onClearSelection={() => onSelect(new Set())}
          />
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={interfaces}
        isLoading={loading}
        onRowClick={(row: any) => onOpenDetail(row.id)}
        emptyMessage={
          filters.type || filters.status || filters.search ?
            'No interfaces match the current filters'
          : 'No interfaces found'
        }
      />
    </div>
  );
});
