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
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bridges</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            aria-label="Refresh bridges"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setSelectedBridgeId('new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bridges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
          aria-label="Search bridges"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load bridges: {hasError.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !hasError && bridges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No bridges configured
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a bridge to connect multiple interfaces
          </p>
          <Button
            onClick={() => setSelectedBridgeId('new')}
            className="mt-4"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bridge
          </Button>
        </div>
      )}

      {/* Bridge Cards */}
      <div className="flex flex-col gap-3" role="list" aria-label="Bridge list">
        {bridges.map((bridge: Bridge) => (
          <Card
            key={bridge.id}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => setSelectedBridgeId(bridge.id)}
            style={{ minHeight: '44px' }} // 44px minimum touch target
            role="listitem"
            aria-label={`Bridge ${bridge.name}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Name and Comment */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium truncate">{bridge.name}</h3>
                    {bridge.disabled && (
                      <Badge variant="secondary" className="text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  {bridge.comment && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {bridge.comment}
                    </p>
                  )}

                  {/* Status Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
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
                        bridge.protocol === 'NONE'
                          ? 'secondary'
                          : bridge.protocol === 'RSTP'
                          ? 'success'
                          : 'info'
                      }
                      className="text-xs"
                    >
                      {bridge.protocol || 'NONE'}
                    </Badge>

                    {/* VLAN Filtering */}
                    {bridge.vlanFiltering && (
                      <Badge variant="info" className="text-xs">
                        VLAN Filtering
                      </Badge>
                    )}

                    {/* Port Count */}
                    <span className="text-muted-foreground">
                      {bridge.ports?.length || 0} ports
                    </span>
                  </div>

                  {/* MAC Address */}
                  <div className="mt-2">
                    <code className="text-xs font-mono text-muted-foreground">
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
                      className="text-destructive"
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
