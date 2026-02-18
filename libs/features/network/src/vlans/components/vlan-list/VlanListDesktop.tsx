import { useMemo, useState } from 'react';
import {
  DataTable,
  DataTableColumn,
  DataTableToolbar,
} from '@nasnet/ui/patterns';
import { Button } from '@nasnet/ui/primitives';
import { Badge } from '@nasnet/ui/primitives';
import { Input } from '@nasnet/ui/primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { Plus, Search, Filter, Trash2, Edit } from 'lucide-react';
import type { UseVlanListReturn } from '../../hooks/use-vlan-list';
import { SafetyConfirmation } from '@nasnet/ui/patterns';

// Type for VLAN from GraphQL
interface Vlan {
  id: string;
  name: string;
  vlanId: number;
  interface: {
    id: string;
    name: string;
    type: string;
  };
  mtu: number | null;
  comment: string | null;
  disabled: boolean;
  running: boolean;
}

export interface VlanListDesktopProps extends UseVlanListReturn {
  routerId: string;
}

export function VlanListDesktop({
  vlans,
  loading,
  error,
  selectedIds,
  toggleSelection,
  selectAll,
  clearSelection,
  searchQuery,
  setSearchQuery,
  parentInterfaceFilter,
  setParentInterfaceFilter,
  vlanIdRangeFilter,
  setVlanIdRangeFilter,
  clearFilters,
  setSelectedVlanId,
  handleDelete,
  refetch,
  allVlans,
}: VlanListDesktopProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vlanToDelete, setVlanToDelete] = useState<Vlan | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Get unique parent interfaces for filter dropdown
  const parentInterfaces = useMemo(() => {
    const uniqueInterfaces = new Map<string, string>();
    allVlans.forEach((vlan: any) => {
      uniqueInterfaces.set(vlan.interface.id, vlan.interface.name);
    });
    return Array.from(uniqueInterfaces.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [allVlans]);

  // Define columns for DataTable
  const columns = useMemo<DataTableColumn<Vlan>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        cell: (vlan) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{vlan.name}</span>
            {vlan.comment && (
              <span className="text-sm text-muted-foreground">
                {vlan.comment}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'vlanId',
        header: 'VLAN ID',
        cell: (vlan) => (
          <Badge variant="outline" className="font-mono">
            {vlan.vlanId}
          </Badge>
        ),
      },
      {
        key: 'interface',
        header: 'Parent Interface',
        cell: (vlan) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{vlan.interface.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {vlan.interface.type}
            </span>
          </div>
        ),
      },
      {
        key: 'mtu',
        header: 'MTU',
        cell: (vlan) => (
          <span className="font-mono text-sm">
            {vlan.mtu || <span className="text-muted-foreground">default</span>}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (vlan) => {
          if (vlan.disabled) {
            return <Badge variant="secondary">Disabled</Badge>;
          }
          return vlan.running ? (
            <Badge variant="success">Running</Badge>
          ) : (
            <Badge variant="warning">Not Running</Badge>
          );
        },
      },
      {
        key: 'actions',
        header: '',
        cell: (vlan) => (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVlanId(vlan.id)}
              aria-label={`Edit VLAN ${vlan.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVlanToDelete(vlan);
                setDeleteConfirmOpen(true);
              }}
              aria-label={`Delete VLAN ${vlan.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [setSelectedVlanId]
  );

  // Handle confirmed deletion
  const handleConfirmedDelete = async () => {
    if (vlanToDelete) {
      await handleDelete(vlanToDelete.id);
      setDeleteConfirmOpen(false);
      setVlanToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <DataTableToolbar>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search VLANs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Parent Interface Filter */}
          <Select
            value={parentInterfaceFilter || 'all'}
            onValueChange={(value) =>
              setParentInterfaceFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Interfaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interfaces</SelectItem>
              {parentInterfaces.map((iface) => (
                <SelectItem key={iface.id} value={iface.id}>
                  {iface.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(searchQuery || parentInterfaceFilter || vlanIdRangeFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create VLAN
        </Button>
      </DataTableToolbar>

      {/* Data Table */}
      <DataTable<Vlan & Record<string, unknown>>
        columns={columns as DataTableColumn<Vlan & Record<string, unknown>>[]}
        data={vlans as (Vlan & Record<string, unknown>)[]}
        isLoading={loading}
        emptyMessage="No VLANs found"
        onRowClick={(vlan) => setSelectedVlanId(vlan.id)}
      />

      {/* Delete Confirmation Dialog */}
      <SafetyConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete VLAN"
        description={
          vlanToDelete
            ? `Are you sure you want to delete VLAN "${vlanToDelete.name}" (VLAN ID: ${vlanToDelete.vlanId})? This action cannot be undone.`
            : ''
        }
        consequences={['This action cannot be undone']}
        confirmText="DELETE"
        onConfirm={handleConfirmedDelete}
      />
    </div>
  );
}
