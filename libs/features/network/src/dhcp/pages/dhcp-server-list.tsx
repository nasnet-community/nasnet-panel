/**
 * DHCP Server List Page
 * Displays all DHCP servers with mobile/desktop responsive views
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDHCPServers } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/core/utils';
import {
  DataTable,
  EmptyState,
  DHCPServerCard,
  StatusBadge,
} from '@nasnet/ui/patterns';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  toast,
} from '@nasnet/ui/primitives';
import { Plus, MoreVertical, Eye, Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { useEnableDHCPServer, useDisableDHCPServer, useDeleteDHCPServer } from '@nasnet/api-client/queries';
import type { DHCPServer } from '@nasnet/core/types';
import type { ColumnDef } from '@tanstack/react-table';

export function DHCPServerList() {
  const navigate = useNavigate();
  const platform = usePlatform();
  const routerIp = useConnectionStore((state) => state.currentRouterIp);
  const { data: servers, isLoading } = useDHCPServers(routerIp || '');

  const enableMutation = useEnableDHCPServer(routerIp || '');
  const disableMutation = useDisableDHCPServer(routerIp || '');
  const deleteMutation = useDeleteDHCPServer(routerIp || '');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Handle server actions
  const handleView = (serverId: string) => {
    navigate({ to: '/network/dhcp/$serverId', params: { serverId } });
  };

  const handleEdit = (serverId: string) => {
    navigate({ to: '/network/dhcp/$serverId/edit', params: { serverId } });
  };

  const handleEnable = async (serverId: string) => {
    await enableMutation.mutateAsync({ serverId });
  };

  const handleDisable = async (serverId: string) => {
    await disableMutation.mutateAsync({ serverId });
  };

  const handleDelete = async (serverId: string) => {
    setDeletingId(serverId);
    try {
      await deleteMutation.mutateAsync({ serverId });
      toast({
        title: 'DHCP server deleted',
        description: 'The DHCP server has been deleted successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete DHCP server',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateNew = () => {
    navigate({ to: '/network/dhcp/new' });
  };

  // Desktop table columns
  const columns: ColumnDef<DHCPServer>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'interface',
      header: 'Interface',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.interface}</span>
      ),
    },
    {
      accessorKey: 'addressPool',
      header: 'Pool',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.addressPool}</span>
      ),
    },
    {
      id: 'network',
      header: 'Network',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">GW:</span>{' '}
            <span className="font-mono">{row.original.gateway || 'N/A'}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">DNS:</span>{' '}
            <span className="font-mono">{row.original.dnsServers?.join(', ') || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'leaseTime',
      header: 'Lease Time',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.leaseTime}</span>
      ),
    },
    {
      id: 'leases',
      header: 'Active Leases',
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.activeLeases || 0}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.disabled ? 'disabled' : 'enabled'} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(row.original.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row.original.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.disabled ? (
              <DropdownMenuItem onClick={() => handleEnable(row.original.id)}>
                <Power className="h-4 w-4 mr-2" />
                Enable
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleDisable(row.original.id)}>
                <PowerOff className="h-4 w-4 mr-2" />
                Disable
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive"
              disabled={deletingId === row.original.id}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deletingId === row.original.id ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Mobile card grid
  const renderMobileCards = () => {
    if (!servers || servers.length === 0) {
      return (
        <EmptyState
          title="No DHCP servers"
          description="Create your first DHCP server to automatically assign IP addresses to devices."
          action={
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create DHCP Server
            </Button>
          }
        />
      );
    }

    return (
      <div className="grid gap-4">
        {servers.map((server) => (
          <DHCPServerCard
            key={server.id}
            server={server}
            onView={() => handleView(server.id)}
            onEdit={() => handleEdit(server.id)}
            onEnable={() => handleEnable(server.id)}
            onDisable={() => handleDisable(server.id)}
            onDelete={() => handleDelete(server.id)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading DHCP servers...</div>
      </div>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">DHCP Servers</h1>
            <p className="text-muted-foreground mt-2">
              Manage DHCP servers for automatic IP address assignment.
            </p>
          </div>
        </div>
        <EmptyState
          title="No DHCP servers configured"
          description="Create your first DHCP server to automatically assign IP addresses to devices on your network."
          action={
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create DHCP Server
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">DHCP Servers</h1>
          <p className="text-muted-foreground mt-2">
            Manage DHCP servers for automatic IP address assignment.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create DHCP Server
        </Button>
      </div>

      {platform === 'mobile' ? (
        renderMobileCards()
      ) : (
        <DataTable
          columns={columns}
          data={servers}
          searchKey="name"
          searchPlaceholder="Search DHCP servers..."
        />
      )}
    </div>
  );
}
