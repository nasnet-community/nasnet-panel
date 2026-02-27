/**
 * DHCP Server List Page
 * Displays all DHCP servers with mobile/desktop responsive views
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 *
 * @description Responsive page for listing and managing DHCP servers across devices.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useDHCPServers,
  useEnableDHCPServer,
  useDisableDHCPServer,
  useDeleteDHCPServer,
} from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/ui/layouts';
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
import { Plus, MoreVertical, Eye, Edit, Power, PowerOff, Trash2, Server } from 'lucide-react';
import type { DHCPServer } from '@nasnet/core/types';

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
  const handleView = useCallback(
    (serverId: string) => {
      navigate({ to: '/network/dhcp/$serverId', params: { serverId } });
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (serverId: string) => {
      navigate({ to: '/network/dhcp/$serverId', params: { serverId } });
    },
    [navigate]
  );

  const handleEnable = useCallback(
    async (serverId: string) => {
      await enableMutation.mutateAsync(serverId as any);
    },
    [enableMutation]
  );

  const handleDisable = useCallback(
    async (serverId: string) => {
      await disableMutation.mutateAsync(serverId as any);
    },
    [disableMutation]
  );

  const handleDelete = useCallback(
    async (serverId: string) => {
      setDeletingId(serverId);
      try {
        await deleteMutation.mutateAsync(serverId as any);
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
    },
    [deleteMutation]
  );

  const handleCreateNew = useCallback(() => {
    navigate({ to: '/network/dhcp/new' });
  }, [navigate]);

  // Desktop table columns
  const columns: any[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'interface',
      header: 'Interface',
      cell: ({ row }: { row: any }) => (
        <code className="font-mono text-sm">{row.original.interface}</code>
      ),
    },
    {
      accessorKey: 'addressPool',
      header: 'Pool',
      cell: ({ row }: { row: any }) => (
        <code className="font-mono text-sm">{row.original.addressPool}</code>
      ),
    },
    {
      id: 'network',
      header: 'Network',
      cell: ({ row }: { row: any }) => (
        <div className="space-y-component-sm">
          <div className="text-sm">
            <span className="text-muted-foreground">GW:</span>{' '}
            <code className="font-mono">{row.original.gateway || 'N/A'}</code>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">DNS:</span>{' '}
            <code className="font-mono">{row.original.dnsServers?.join(', ') || 'N/A'}</code>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'leaseTime',
      header: 'Lease Time',
      cell: ({ row }: { row: any }) => (
        <code className="font-mono text-sm">{row.original.leaseTime}</code>
      ),
    },
    {
      id: 'leases',
      header: 'Active Leases',
      cell: ({ row }: { row: any }) => (
        <div className="text-center font-medium">
          {row.original.activeLeases || 0}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <StatusBadge status={row.original.disabled ? 'stopped' : 'bound'} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: any }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${row.original.name} server`}
              className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(row.original.id)}>
              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row.original.id)}>
              <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.disabled ? (
              <DropdownMenuItem onClick={() => handleEnable(row.original.id)}>
                <Power className="h-4 w-4 mr-2" aria-hidden="true" />
                Enable
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleDisable(row.original.id)}>
                <PowerOff className="h-4 w-4 mr-2" aria-hidden="true" />
                Disable
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-error"
              disabled={deletingId === row.original.id}
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
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
          icon={Server}
          title="No DHCP servers"
          description="Create your first DHCP server to automatically assign IP addresses to devices."
          action={{
            label: 'Create DHCP Server',
            onClick: handleCreateNew,
          }}
        />
      );
    }

    return (
      <div className="grid gap-component-md">
        {servers.map((server) => (
          <DHCPServerCard
            key={server.id}
            server={server}
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
      <div className="container mx-auto py-component-lg category-networking">
        <div className="flex justify-between items-center mb-component-lg">
          <div>
            <h1 className="font-display text-3xl font-bold">DHCP Servers</h1>
            <p className="text-muted-foreground mt-2">
              Manage DHCP servers for automatic IP address assignment.
            </p>
          </div>
        </div>
        <EmptyState
          icon={Server}
          title="No DHCP servers configured"
          description="Create your first DHCP server to automatically assign IP addresses to devices on your network."
          action={{
            label: 'Create DHCP Server',
            onClick: handleCreateNew,
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-component-lg category-networking">
      <div className="flex justify-between items-center mb-component-lg">
        <div>
          <h1 className="font-display text-3xl font-bold">DHCP Servers</h1>
          <p className="text-muted-foreground mt-2">
            Manage DHCP servers for automatic IP address assignment.
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Create DHCP Server
        </Button>
      </div>

      {platform === 'mobile' ? (
        renderMobileCards()
      ) : (
        <DataTable
          columns={columns}
          data={servers as any[]}
        />
      )}
    </div>
  );
}
