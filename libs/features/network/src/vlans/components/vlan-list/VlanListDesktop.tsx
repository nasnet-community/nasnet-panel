import { useMemo, useState, useCallback } from 'react';
import { cn } from '@nasnet/ui/utils';
import {
  DataTable,
  DataTableColumn,
  DataTableToolbar,
  SafetyConfirmation,
} from '@nasnet/ui/patterns';
import {
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { Plus, Search, Filter, Trash2, Edit } from 'lucide-react';
import type { UseVlanListReturn } from '../../hooks/use-vlan-list';

/**
 * Type for VLAN from GraphQL.
 * Represents a Virtual LAN (VLAN) on a network interface.
 */
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

/**
 * VlanListDesktop - Desktop-optimized presenter for VLAN list.
 * Displays VLANs in a dense DataTable with full details visible.
 * Desktop: fixed sidebar (never horizontal scroll), all columns visible.
 *
 * @param props - Component props from useVlanList hook and parent
 */
export function VlanListDesktop({
  vlans,
  loading: isLoading,
  error: hasError,
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
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vlanToDelete, setVlanToDelete] = useState<Vlan | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

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
          <div className="gap-component-xs flex flex-col">
            <span className="font-medium">{vlan.name}</span>
            {vlan.comment && <span className="text-muted-foreground text-sm">{vlan.comment}</span>}
          </div>
        ),
      },
      {
        key: 'vlanId',
        header: 'VLAN ID',
        cell: (vlan) => (
          <Badge
            variant="outline"
            className="font-mono tabular-nums"
          >
            {vlan.vlanId}
          </Badge>
        ),
      },
      {
        key: 'interface',
        header: 'Parent Interface',
        cell: (vlan) => (
          <div className="gap-component-xs flex flex-col">
            <span className="font-mono font-medium">{vlan.interface.name}</span>
            <span className="text-muted-foreground text-xs capitalize">{vlan.interface.type}</span>
          </div>
        ),
      },
      {
        key: 'mtu',
        header: 'MTU',
        cell: (vlan) => (
          <span className="font-mono text-sm tabular-nums">
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
          return vlan.running ?
              <Badge variant="success">Running</Badge>
            : <Badge variant="warning">Not Running</Badge>;
        },
      },
      {
        key: 'actions',
        header: '',
        cell: (vlan) => (
          <div className="gap-component-sm flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVlanId(vlan.id)}
              aria-label={`Edit VLAN ${vlan.name}`}
            >
              <Edit
                className="h-4 w-4"
                aria-hidden="true"
              />
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
              <Trash2
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        ),
      },
    ],
    [setSelectedVlanId]
  );

  // Handle confirmed deletion
  const handleConfirmedDelete = useCallback(async () => {
    if (vlanToDelete) {
      await handleDelete(vlanToDelete.id);
      setDeleteConfirmOpen(false);
      setVlanToDelete(null);
    }
  }, [vlanToDelete, handleDelete]);

  return (
    <div className="gap-component-md flex flex-col">
      {/* Toolbar */}
      <DataTableToolbar>
        <div className="gap-component-sm flex flex-1 items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search VLANs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-mono"
            />
          </div>

          {/* Parent Interface Filter */}
          <Select
            value={parentInterfaceFilter || 'all'}
            onValueChange={(value) => setParentInterfaceFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[200px] font-mono">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Interfaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interfaces</SelectItem>
              {parentInterfaces.map((iface) => (
                <SelectItem
                  key={iface.id}
                  value={iface.id}
                >
                  {iface.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(searchQuery || parentInterfaceFilter || vlanIdRangeFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create VLAN
        </Button>
      </DataTableToolbar>

      {/* Data Table */}
      <DataTable<Vlan & Record<string, unknown>>
        columns={columns as DataTableColumn<Vlan & Record<string, unknown>>[]}
        data={vlans as (Vlan & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="No VLANs found"
        onRowClick={(vlan) => setSelectedVlanId(vlan.id)}
      />

      {/* Delete Confirmation Dialog */}
      <SafetyConfirmation
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete VLAN"
        description={
          vlanToDelete ?
            `Are you sure you want to delete VLAN "${vlanToDelete.name}" (VLAN ID: ${vlanToDelete.vlanId})? This action cannot be undone.`
          : ''
        }
        consequences={['This action cannot be undone']}
        confirmText="DELETE"
        onConfirm={handleConfirmedDelete}
      />
    </div>
  );
}

VlanListDesktop.displayName = 'VlanListDesktop';
