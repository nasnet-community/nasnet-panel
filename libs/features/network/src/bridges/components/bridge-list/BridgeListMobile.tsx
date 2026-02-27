import { memo, useState } from 'react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';
import { Plus, Search, MoreVertical, RefreshCw } from 'lucide-react';
import type { UseBridgeListReturn } from '../../hooks/use-bridge-list';
import type { Bridge } from '@nasnet/api-client/generated';
import { SafetyConfirmation } from '@nasnet/ui/patterns';

export interface BridgeListMobileProps extends UseBridgeListReturn {
  routerId: string;
}

export const BridgeListMobile = memo(function BridgeListMobile({
  bridges,
  isLoading,
  hasError,
  searchQuery,
  setSearchQuery,
  setSelectedBridgeId,
  handleDelete,
  refetch,
}: BridgeListMobileProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bridgeToDelete, setBridgeToDelete] = useState<Bridge | null>(null);

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
    <div className="gap-component-md p-component-md flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bridges</h2>
        <div className="gap-component-sm flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            aria-label="Refresh bridges"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setSelectedBridgeId('new')}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
        <Input
          placeholder="Search bridges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-component-lg"
          aria-label="Search bridges"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-component-xl flex items-center justify-center">
          <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <Card className="border-error">
          <CardContent className="pt-component-lg">
            <p className="text-error text-sm">Failed to load bridges: {hasError.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !hasError && bridges.length === 0 && (
        <div className="py-component-xl flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground text-lg font-medium">No bridges configured</p>
          <p className="text-muted-foreground mt-component-xs text-sm">
            Create a bridge to connect multiple interfaces
          </p>
          <Button
            onClick={() => setSelectedBridgeId('new')}
            className="mt-component-lg"
            size="sm"
          >
            <Plus className="mr-component-sm h-4 w-4" />
            Add Bridge
          </Button>
        </div>
      )}

      {/* Bridge Cards */}
      <div
        className="gap-component-md flex flex-col"
        role="list"
        aria-label="Bridge list"
      >
        {bridges.map((bridge: Bridge) => (
          <Card
            key={bridge.id}
            className="hover:bg-accent cursor-pointer transition-colors"
            onClick={() => setSelectedBridgeId(bridge.id)}
            style={{ minHeight: '44px' }} // 44px minimum touch target
            role="listitem"
            aria-label={`Bridge ${bridge.name}`}
          >
            <CardContent className="p-component-md">
              <div className="gap-component-sm flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  {/* Name and Comment */}
                  <div className="gap-component-sm mb-component-sm flex items-center">
                    <h3 className="truncate font-medium">{bridge.name}</h3>
                    {bridge.disabled && (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        Disabled
                      </Badge>
                    )}
                  </div>
                  {bridge.comment && (
                    <p className="text-muted-foreground mb-component-sm line-clamp-2 text-sm">
                      {bridge.comment}
                    </p>
                  )}

                  {/* Status Row */}
                  <div className="gap-component-sm flex flex-wrap items-center text-xs">
                    {/* Running Status */}
                    <Badge
                      variant={bridge.running ? 'success' : 'warning'}
                      className="text-xs"
                    >
                      {bridge.running ? 'Running' : 'Stopped'}
                    </Badge>

                    {/* STP Protocol */}
                    <Badge
                      variant={
                        bridge.protocol === 'NONE' ? 'secondary'
                        : bridge.protocol === 'RSTP' ?
                          'success'
                        : 'info'
                      }
                      className="text-xs"
                    >
                      {bridge.protocol || 'NONE'}
                    </Badge>

                    {/* VLAN Filtering */}
                    {bridge.vlanFiltering && (
                      <Badge
                        variant="info"
                        className="text-xs"
                      >
                        VLAN Filtering
                      </Badge>
                    )}

                    {/* Port Count */}
                    <span className="text-muted-foreground">{bridge.ports?.length || 0} ports</span>
                  </div>

                  {/* MAC Address */}
                  <div className="mt-component-sm">
                    <code className="text-muted-foreground font-mono text-xs">
                      {bridge.macAddress}
                    </code>
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Bridge actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBridgeId(bridge.id);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBridgeId(bridge.id);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(bridge);
                      }}
                      className="text-error"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
