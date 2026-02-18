import { useState } from 'react';
import { Card } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Badge } from '@nasnet/ui/primitives';
import { Input } from '@nasnet/ui/primitives';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nasnet/ui/primitives';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronRight,
} from 'lucide-react';
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

export interface VlanListMobileProps extends UseVlanListReturn {
  routerId: string;
}

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vlanToDelete, setVlanToDelete] = useState<Vlan | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Handle confirmed deletion
  const handleConfirmedDelete = async () => {
    if (vlanToDelete) {
      await handleDelete(vlanToDelete.id);
      setDeleteConfirmOpen(false);
      setVlanToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Mobile Toolbar */}
      <div className="sticky top-0 z-10 bg-background pb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search VLANs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2">
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 h-11">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(parentInterfaceFilter || searchQuery) && (
                  <Badge variant="default" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filter VLANs</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* Parent Interface Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent Interface</label>
                  <div className="space-y-2">
                    <Button
                      variant={parentInterfaceFilter === null ? 'default' : 'outline'}
                      className="w-full justify-start h-11"
                      onClick={() => setParentInterfaceFilter(null)}
                    >
                      All Interfaces
                    </Button>
                    {(Array.from(
                      new Set(allVlans.map((v: any) => v.interface.id as string))
                    ) as string[]).map((ifaceId: string) => {
                      const iface = allVlans.find((v: any) => v.interface.id === ifaceId)?.interface;
                      if (!iface) return null;
                      return (
                        <Button
                          key={ifaceId}
                          variant={
                            parentInterfaceFilter === ifaceId ? 'default' : 'outline'
                          }
                          className="w-full justify-start h-11"
                          onClick={() => setParentInterfaceFilter(ifaceId)}
                        >
                          {iface.name}
                          <Badge variant="outline" className="ml-2 capitalize">
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
                  className="w-full h-11"
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

          <Button onClick={() => setCreateDialogOpen(true)} className="h-11">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading VLANs...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </Card>
      )}

      {/* VLAN Cards */}
      {!loading && !error && vlans.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No VLANs found</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create your first VLAN
          </Button>
        </Card>
      )}

      {!loading && !error && vlans.map((vlan: any) => (
        <Card
          key={vlan.id}
          className="p-4 space-y-3"
          onClick={() => setSelectedVlanId(vlan.id)}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{vlan.name}</h3>
                <Badge variant="outline" className="font-mono shrink-0">
                  {vlan.vlanId}
                </Badge>
              </div>
              {vlan.comment && (
                <p className="text-sm text-muted-foreground mt-1">
                  {vlan.comment}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Parent Interface</p>
              <p className="font-medium mt-1">{vlan.interface.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {vlan.interface.type}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">MTU</p>
              <p className="font-mono mt-1">
                {vlan.mtu || <span className="text-muted-foreground">default</span>}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {vlan.disabled ? (
              <Badge variant="secondary">Disabled</Badge>
            ) : vlan.running ? (
              <Badge variant="success">Running</Badge>
            ) : (
              <Badge variant="warning">Not Running</Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-11"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVlanId(vlan.id);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-11"
              onClick={(e) => {
                e.stopPropagation();
                setVlanToDelete(vlan);
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </Card>
      ))}

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
