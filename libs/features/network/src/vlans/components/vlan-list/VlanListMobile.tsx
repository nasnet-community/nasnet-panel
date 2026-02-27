import { useState, useCallback } from 'react';
import { cn } from '@nasnet/ui/utils';
import {
  Card,
  Button,
  Badge,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nasnet/ui/primitives';
import { Plus, Search, Filter, Trash2, Edit, ChevronRight } from 'lucide-react';
import type { UseVlanListReturn } from '../../hooks/use-vlan-list';
import { SafetyConfirmation } from '@nasnet/ui/patterns';

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

export interface VlanListMobileProps extends UseVlanListReturn {
  routerId: string;
}

/**
 * VlanListMobile - Mobile-optimized presenter for VLAN list.
 * Displays VLANs as cards with 44px touch targets and progressive disclosure.
 * Mobile: single-column layout, bottom sheet for filters, swipe actions.
 *
 * @param props - Component props from useVlanList hook and parent
 */
export function VlanListMobile({
  vlans,
  loading,
  error,
  searchQuery,
  setSearchQuery,
  parentInterfaceFilter,
  setParentInterfaceFilter,
  clearFilters,
  setSelectedVlanId,
  handleDelete,
  refetch,
  allVlans,
}: VlanListMobileProps) {
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vlanToDelete, setVlanToDelete] = useState<Vlan | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);

  // Handle confirmed deletion
  const handleConfirmedDelete = useCallback(async () => {
    if (vlanToDelete) {
      await handleDelete(vlanToDelete.id);
      setDeleteConfirmOpen(false);
      setVlanToDelete(null);
    }
  }, [vlanToDelete, handleDelete]);

  return (
    <div className="gap-component-md flex flex-col pb-20">
      {/* Mobile Toolbar */}
      <div className="bg-background pb-component-md space-y-component-sm sticky top-0 z-10">
        {/* Search Bar */}
        <div className="relative">
          <Search
            className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            placeholder="Search VLANs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-9 font-mono"
            aria-label="Search VLANs"
          />
        </div>

        {/* Actions Row */}
        <div className="gap-component-sm flex items-center">
          <Sheet
            open={isFilterSheetOpen}
            onOpenChange={setFilterSheetOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 flex-1"
                aria-label="Open filters"
              >
                <Filter
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                Filters
                {(parentInterfaceFilter || searchQuery) && (
                  <Badge
                    variant="default"
                    className="ml-2"
                  >
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[80vh]"
            >
              <SheetHeader>
                <SheetTitle>Filter VLANs</SheetTitle>
              </SheetHeader>
              <div className="mt-component-lg space-y-component-md">
                {/* Parent Interface Filter */}
                <div className="space-y-component-sm">
                  <p className="text-sm font-medium">Parent Interface</p>
                  <div className="space-y-component-sm">
                    <Button
                      variant={parentInterfaceFilter === null ? 'default' : 'outline'}
                      className="h-11 w-full justify-start"
                      onClick={() => setParentInterfaceFilter(null)}
                    >
                      All Interfaces
                    </Button>
                    {(
                      Array.from(
                        new Set(allVlans.map((v: any) => v.interface.id as string))
                      ) as string[]
                    ).map((ifaceId: string) => {
                      const iface = allVlans.find(
                        (v: any) => v.interface.id === ifaceId
                      )?.interface;
                      if (!iface) return null;
                      return (
                        <Button
                          key={ifaceId}
                          variant={parentInterfaceFilter === ifaceId ? 'default' : 'outline'}
                          className="h-11 w-full justify-start"
                          onClick={() => setParentInterfaceFilter(ifaceId)}
                        >
                          {iface.name}
                          <Badge
                            variant="outline"
                            className="ml-2 capitalize"
                          >
                            {iface.type}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="ghost"
                  className="h-11 w-full"
                  onClick={() => {
                    clearFilters();
                    setFilterSheetOpen(false);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-11"
            aria-label="Create new VLAN"
          >
            <Plus
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Create
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="flex items-center justify-center py-12"
          role="status"
          aria-live="polite"
        >
          <div className="text-muted-foreground animate-pulse">Loading VLANs...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card
          className="p-component-sm border-error"
          role="alert"
        >
          <p className="text-error text-sm">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && vlans.length === 0 && (
        <Card className="p-component-xl text-center">
          <p className="text-muted-foreground">No VLANs found</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="mt-component-md"
            aria-label="Create your first VLAN"
          >
            <Plus
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Create your first VLAN
          </Button>
        </Card>
      )}

      {!loading &&
        !error &&
        vlans.map((vlan: any) => (
          <Card
            key={vlan.id}
            className="p-component-md space-y-component-sm"
            onClick={() => setSelectedVlanId(vlan.id)}
          >
            {/* Header Row */}
            <div className="gap-component-sm flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="gap-component-sm flex items-center">
                  <h3 className="truncate font-medium">{vlan.name}</h3>
                  <Badge
                    variant="outline"
                    className="shrink-0 font-mono tabular-nums"
                  >
                    {vlan.vlanId}
                  </Badge>
                </div>
                {vlan.comment && (
                  <p className="text-muted-foreground mt-component-sm text-sm">{vlan.comment}</p>
                )}
              </div>
              <ChevronRight
                className="text-muted-foreground h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            </div>

            {/* Details Grid */}
            <div className="gap-component-sm grid grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Parent Interface</p>
                <p className="mt-component-sm font-mono font-medium">{vlan.interface.name}</p>
                <p className="text-muted-foreground text-xs capitalize">{vlan.interface.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">MTU</p>
                <p className="mt-component-sm font-mono tabular-nums">
                  {vlan.mtu || <span className="text-muted-foreground">default</span>}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="gap-component-sm flex items-center">
              {vlan.disabled ?
                <Badge variant="secondary">Disabled</Badge>
              : vlan.running ?
                <Badge variant="success">Running</Badge>
              : <Badge variant="warning">Not Running</Badge>}
            </div>

            {/* Action Buttons */}
            <div className="gap-component-sm pt-component-md flex items-center border-t">
              <Button
                variant="outline"
                size="sm"
                className="h-11 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVlanId(vlan.id);
                }}
                aria-label={`Edit VLAN ${vlan.name}`}
              >
                <Edit
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-11 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setVlanToDelete(vlan);
                  setDeleteConfirmOpen(true);
                }}
                aria-label={`Delete VLAN ${vlan.name}`}
              >
                <Trash2
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                Delete
              </Button>
            </div>
          </Card>
        ))}

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

VlanListMobile.displayName = 'VlanListMobile';
