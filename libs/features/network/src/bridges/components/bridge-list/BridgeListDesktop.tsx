import { memo, useMemo, useState } from 'react';
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
import { Plus, Search, Filter } from 'lucide-react';
import type { UseBridgeListReturn } from '../../hooks/use-bridge-list';
import type { Bridge } from '@nasnet/api-client/generated';
import { SafetyConfirmation } from '@nasnet/ui/patterns';

export interface BridgeListDesktopProps extends UseBridgeListReturn {
  routerId: string;
}

export const BridgeListDesktop = memo(function BridgeListDesktop({
  bridges,
  loading,
  error,
  selectedIds,
  toggleSelection,
  selectAll,
  clearSelection,
  searchQuery,
  setSearchQuery,
  protocolFilter,
  setProtocolFilter,
  vlanFilteringFilter,
  setVlanFilteringFilter,
  setSelectedBridgeId,
  handleDelete,
  refetch,
}: BridgeListDesktopProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bridgeToDelete, setBridgeToDelete] = useState<Bridge | null>(null);

  // Define columns for DataTable
  const columns = useMemo<DataTableColumn<Bridge>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        cell: (bridge) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{bridge.name}</span>
            {bridge.comment && (
              <span className="text-sm text-muted-foreground">
                {bridge.comment}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'ports',
        header: 'Ports',
        cell: (bridge) => {
          const portCount = bridge.ports?.length || 0;
          const portNames = bridge.ports?.slice(0, 3).map((p) => p.interface.name).join(', ');
          const remaining = portCount - 3;

          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{portCount} ports</span>
              {portNames && (
                <span className="text-xs text-muted-foreground">
                  {portNames}
                  {remaining > 0 && ` +${remaining} more`}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'protocol',
        header: 'STP Protocol',
        cell: (bridge) => {
          const protocol = bridge.protocol;
          const variant =
            protocol === 'NONE'
              ? 'secondary'
              : protocol === 'RSTP'
              ? 'success'
              : 'info';

          return (
            <Badge variant={variant}>
              {protocol}
            </Badge>
          );
        },
      },
      {
        key: 'vlan-filtering',
        header: 'VLAN Filtering',
        cell: (bridge) => (
          <Badge variant={bridge.vlanFiltering ? 'info' : 'secondary'}>
            {bridge.vlanFiltering ? 'Enabled' : 'Disabled'}
          </Badge>
        ),
      },
      {
        key: 'mac-address',
        header: 'MAC Address',
        cell: (bridge) => (
          <code className="text-xs font-mono">{bridge.macAddress}</code>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (bridge) => {
          if (bridge.disabled) {
            return <Badge variant="secondary">Disabled</Badge>;
          }
          return bridge.running ? (
            <Badge variant="success">Running</Badge>
          ) : (
            <Badge variant="warning">Stopped</Badge>
          );
        },
      },
    ],
    []
  );

  // Handle delete with confirmation
  const handleDeleteClick = (bridge: Bridge) => {
    setBridgeToDelete(bridge);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (bridgeToDelete) {
      await handleDelete(bridgeToDelete.id);
      setDeleteConfirmOpen(false);
      setBridgeToDelete(null);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <DataTableToolbar>
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bridges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              aria-label="Search bridges"
            />
          </div>

          {/* Protocol Filter */}
          <Select
            value={protocolFilter || 'all'}
            onValueChange={(value) =>
              setProtocolFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-40" aria-label="Filter by STP protocol">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Protocols</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="stp">STP</SelectItem>
              <SelectItem value="rstp">RSTP</SelectItem>
              <SelectItem value="mstp">MSTP</SelectItem>
            </SelectContent>
          </Select>

          {/* VLAN Filtering Filter */}
          <Select
            value={
              vlanFilteringFilter === null
                ? 'all'
                : vlanFilteringFilter
                ? 'enabled'
                : 'disabled'
            }
            onValueChange={(value) =>
              setVlanFilteringFilter(
                value === 'all' ? null : value === 'enabled'
              )
            }
          >
            <SelectTrigger className="w-48" aria-label="Filter by VLAN filtering status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="VLAN Filtering" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="enabled">VLAN Filtering Enabled</SelectItem>
              <SelectItem value="disabled">VLAN Filtering Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={() => setSelectedBridgeId('new')} size="sm" aria-label="Add new bridge">
            <Plus className="h-4 w-4 mr-2" />
            Add Bridge
          </Button>
        </div>
      </DataTableToolbar>

      {/* Table */}
      <DataTable<Bridge & Record<string, unknown>>
        columns={columns as DataTableColumn<Bridge & Record<string, unknown>>[]}
        data={bridges as (Bridge & Record<string, unknown>)[]}
        isLoading={loading}
        emptyMessage="No bridges configured"
        onRowClick={(row) => setSelectedBridgeId(row.id)}
      />

      {/* Delete Confirmation */}
      {bridgeToDelete && (
        <SafetyConfirmation
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={`Delete Bridge "${bridgeToDelete.name}"?`}
          description="Deleting this bridge will disconnect all ports and may disrupt network connectivity."
          consequences={[
            `${bridgeToDelete.ports?.length || 0} ports will be released`,
            bridgeToDelete.ipAddresses?.length
              ? `${bridgeToDelete.ipAddresses.length} IP addresses will be removed`
              : undefined,
          ].filter(Boolean) as string[]}
          confirmText="DELETE"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setBridgeToDelete(null);
          }}
        />
      )}
    </div>
  );
});
