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
export function InterfaceListDesktop({
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
  const selectedInterfaces = allInterfaces.filter((iface) =>
    selectedIds.has(iface.id)
  );

  // Column definitions
  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: (row: any) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: (row: any) => (
        <Badge variant="outline">{row.type}</Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        const variant =
          row.status === 'UP'
            ? 'success'
            : row.status === 'DOWN'
            ? 'destructive'
            : 'secondary';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      id: 'enabled',
      header: 'Enabled',
      accessorKey: 'enabled',
      cell: (row: any) => (
        <Badge variant={row.enabled ? 'default' : 'outline'}>
          {row.enabled ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'ip',
      header: 'IP Address',
      accessorKey: 'ip',
      cell: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {row.ip?.join(', ') || '-'}
        </span>
      ),
    },
    {
      id: 'mtu',
      header: 'MTU',
      accessorKey: 'mtu',
      cell: (row: any) => (
        <span className="text-sm">{row.mtu || '-'}</span>
      ),
    },
    {
      id: 'comment',
      header: 'Comment',
      accessorKey: 'comment',
      cell: (row: any) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs">
          {row.comment || '-'}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <InterfaceListFilters filters={filters} onChange={onFilterChange} />
        </div>
        <div className="p-8 text-center border rounded-lg border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">Failed to load interfaces</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || 'Unknown error'}
          </p>
          <Button onClick={onRefresh} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <InterfaceListFilters filters={filters} onChange={onFilterChange} />
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
        loading={loading}
        selectable
        selectedRows={selectedIds}
        onSelectRows={onSelect}
        onRowClick={(row) => onOpenDetail(row.id)}
        emptyState={
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {filters.type || filters.status || filters.search
                ? 'No interfaces match the current filters'
                : 'No interfaces found'}
            </p>
          </div>
        }
      />
    </div>
  );
}
