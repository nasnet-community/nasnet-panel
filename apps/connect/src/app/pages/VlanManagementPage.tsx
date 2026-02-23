/**
 * VLAN Management Page
 *
 * Comprehensive page for managing VLANs with multiple views:
 * - List view (create, edit, delete)
 * - Topology view (visualize VLAN hierarchy)
 *
 * Story: NAS-6.7 - Implement VLAN Management
 */

import React, { useState } from 'react';

import { Plus, List, Network } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateVlan } from '@nasnet/api-client/queries';
import { useTranslation } from '@nasnet/core/i18n';
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


export interface VlanManagementPageProps {
  routerId: string;
}

export const VlanManagementPage = React.memo(function VlanManagementPage({ routerId }: VlanManagementPageProps) {
  const { t } = useTranslation('network');
  const [activeTab, setActiveTab] = useState<'list' | 'topology'>('list');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { createVlan, loading } = useCreateVlan(routerId);

  const handleCreateVlan = async (values: {
    name: string;
    vlanId: number;
    interface: string;
    mtu?: number | null;
    comment?: string | null;
    disabled?: boolean;
  }) => {
    try {
      const sanitized = {
        ...values,
        mtu: values.mtu ?? undefined,
        comment: values.comment ?? undefined,
      };
      const result = await createVlan(sanitized) as any;

      if (result?.vlan) {
        toast.success(t('vlan.created'), {
          description: `${values.name} (VLAN ID: ${values.vlanId})`,
        });
        setCreateDialogOpen(false);
      } else {
        const errors = result?.errors || [];
        errors.forEach((err: { message: string }) => toast.error(err.message));
      }
    } catch (err) {
      toast.error(t('vlan.createFailed'));
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('vlan.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('vlan.description')}
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          {t('vlan.addVlan')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'topology')}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            {t('vlan.listView')}
          </TabsTrigger>
          <TabsTrigger value="topology">
            <Network className="h-4 w-4 mr-2" />
            {t('vlan.topologyView')}
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
            <DialogTitle>{t('vlan.createDialog')}</DialogTitle>
          </DialogHeader>
          <VlanForm
            routerId={routerId}
            mode="create"
            onSubmit={handleCreateVlan}
            onCancel={() => setCreateDialogOpen(false)}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});
VlanManagementPage.displayName = 'VlanManagementPage';
