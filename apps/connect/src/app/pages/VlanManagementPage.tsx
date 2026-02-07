/**
 * VLAN Management Page
 *
 * Comprehensive page for managing VLANs with multiple views:
 * - List view (create, edit, delete)
 * - Topology view (visualize VLAN hierarchy)
 *
 * Story: NAS-6.7 - Implement VLAN Management
 */

import { useState } from 'react';
import { VlanList, VlanTopology, VlanForm } from '@nasnet/features/network';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from '@nasnet/ui/primitives';
import { Plus, List, Network } from 'lucide-react';
import { useCreateVlan } from '@nasnet/api-client/queries';
import { toast } from 'sonner';

export interface VlanManagementPageProps {
  routerId: string;
}

export function VlanManagementPage({ routerId }: VlanManagementPageProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'topology'>('list');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { createVlan, loading } = useCreateVlan(routerId);

  const handleCreateVlan = async (values: any) => {
    try {
      const result = await createVlan(values);

      if (result.data?.vlan) {
        toast.success('VLAN created successfully', {
          description: `${values.name} (VLAN ID: ${values.vlanId})`,
        });
        setCreateDialogOpen(false);
      } else {
        const errors = result.data?.errors || [];
        errors.forEach((err: any) => toast.error(err.message));
      }
    } catch (err) {
      toast.error('Failed to create VLAN');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            VLAN Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage VLAN interfaces for network segmentation
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create VLAN
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="topology">
            <Network className="h-4 w-4 mr-2" />
            Topology View
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <VlanList routerId={routerId} />
        </TabsContent>

        {/* Topology View */}
        <TabsContent value="topology" className="mt-6">
          <VlanTopology routerId={routerId} />
        </TabsContent>
      </Tabs>

      {/* Create VLAN Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create VLAN Interface</DialogTitle>
          </DialogHeader>
          <VlanForm
            routerId={routerId}
            mode="create"
            onSubmit={handleCreateVlan}
            onCancel={() => setCreateDialogOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
