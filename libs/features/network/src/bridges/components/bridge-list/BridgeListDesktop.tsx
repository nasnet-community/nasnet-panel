import { memo, useMemo, useState } from 'react';
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
import { Plus, Search, Filter } from 'lucide-react';
import type { UseBridgeListReturn } from '../../hooks/use-bridge-list';
import type { Bridge } from '@nasnet/api-client/generated';

export interface BridgeListDesktopProps extends UseBridgeListReturn {
  routerId: string;
}

export const BridgeListDesktop = memo(function BridgeListDesktop({
  bridges,
  isLoading,
  hasError,
  selectedIds,
  handleToggleSelection,
  handleSelectAll,
  handleClearSelection,
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
          <div className="gap-component-xs flex flex-col">
            <span className="font-medium">{bridge.name}</span>
            {bridge.comment && (
              <span className="text-muted-foreground text-sm">{bridge.comment}</span>
            )}
          </div>
        ),
      },
      {
        key: 'ports',
        header: 'Ports',
        cell: (bridge) => {
          const portCount = bridge.ports?.length || 0;
          const portNames = bridge.ports
            ?.slice(0, 3)
            .map((p) => p.interface.name)
            .join(', ');
          const remaining = portCount - 3;

          return (
            <div className="gap-component-xs flex flex-col">
              <span className="text-sm font-medium">{portCount} ports</span>
              {portNames && (
                <span className="text-muted-foreground text-xs">
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
            protocol === 'NONE' ? 'secondary'
            : protocol === 'RSTP' ? 'success'
            : 'info';

          return <Badge variant={variant}>{protocol}</Badge>;
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
          <code className="font-mono text-xs font-medium">{bridge.macAddress}</code>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (bridge) => {
          if (bridge.disabled) {
            return <Badge variant="secondary">Disabled</Badge>;
          }
          return bridge.running ?
              <Badge variant="success">Running</Badge>
            : <Badge variant="warning">Stopped</Badge>;
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
    <div className="gap-component-md flex h-full flex-col">
      {/* Toolbar */}
      <DataTableToolbar>
        <div className="gap-component-sm flex flex-1 items-center">
          {/* Search */}
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
            <Input
              placeholder="Search bridges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-component-lg"
              aria-label="Search bridges"
            />
          </div>

          {/* Protocol Filter */}
          <Select
            value={protocolFilter || 'all'}
            onValueChange={(value) => setProtocolFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger
              className="w-40"
              aria-label="Filter by STP protocol"
            >
              <Filter className="mr-2 h-4 w-4" />
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
              vlanFilteringFilter === null ? 'all'
              : vlanFilteringFilter ?
                'enabled'
              : 'disabled'
            }
            onValueChange={(value) =>
              setVlanFilteringFilter(value === 'all' ? null : value === 'enabled')
            }
          >
            <SelectTrigger
              className="w-48"
              aria-label="Filter by VLAN filtering status"
            >
              <Filter className="mr-2 h-4 w-4" />
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
        <div className="gap-component-sm flex items-center">
          <Button
            onClick={() => setSelectedBridgeId('new')}
            size="sm"
            aria-label="Add new bridge"
          >
            <Plus className="mr-component-sm h-4 w-4" />
            Add Bridge
          </Button>
        </div>
      </DataTableToolbar>

      {/* Table */}
      <DataTable<Bridge & Record<string, unknown>>
        columns={columns as DataTableColumn<Bridge & Record<string, unknown>>[]}
        data={bridges as (Bridge & Record<string, unknown>)[]}
        isLoading={isLoading}
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
          consequences={
            [
              `${bridgeToDelete.ports?.length || 0} ports will be released`,
              bridgeToDelete.ipAddresses?.length ?
                `${bridgeToDelete.ipAddresses.length} IP addresses will be removed`
              : undefined,
            ].filter(Boolean) as string[]
          }
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
