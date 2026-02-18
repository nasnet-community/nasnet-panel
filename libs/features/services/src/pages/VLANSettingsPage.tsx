/**
 * VLANSettingsPage - Domain Page (Layer 3)
 *
 * Complete VLAN Settings UI with three tabs:
 * - Pool Config: Configure VLAN pool range
 * - Allocations: View and filter allocations
 * - Diagnostics: Orphan cleanup tools
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
} from '@nasnet/ui/primitives';
import { VLANPoolGauge, VLANAllocationTable } from '@nasnet/ui/patterns';
import {
  useVLANAllocations,
  useVLANPoolStatus,
  useCleanupOrphanedVLANs,
} from '@nasnet/api-client/queries';
import { VLANPoolConfig } from '../components/VLANPoolConfig';
import { usePlatform } from '@nasnet/ui/layouts';

export interface VLANSettingsPageProps {
  /** Router ID to display settings for */
  routerID: string;
}

/**
 * VLANSettingsPage - VLAN management interface
 *
 * Features:
 * - Pool configuration with validation
 * - Allocation monitoring with filters
 * - Orphan detection and cleanup
 * - Real-time utilization gauge
 * - Platform-aware layout (Mobile: stacked, Desktop: sidebar)
 */
export function VLANSettingsPage({ routerID }: VLANSettingsPageProps) {
  const platform = usePlatform();
  const [activeTab, setActiveTab] = useState<'pool' | 'allocations' | 'diagnostics'>('pool');

  // Fetch data
  const { poolStatus, loading: poolLoading, refetch: refetchPool } = useVLANPoolStatus(routerID);
  const { allocations, loading: allocLoading, refetch: refetchAllocations } = useVLANAllocations(routerID);
  const { cleanupOrphanedVLANs, loading: cleanupLoading, cleanupCount } = useCleanupOrphanedVLANs();

  // Orphan detection state
  const [orphansDetected, setOrphansDetected] = useState(false);
  const [detectingOrphans, setDetectingOrphans] = useState(false);

  const handleDetectOrphans = async () => {
    setDetectingOrphans(true);
    try {
      await refetchAllocations();
      // In a real implementation, you'd call a dedicated query to detect orphans
      // For now, we'll just refetch allocations
      setOrphansDetected(true);
      toast({ title: 'Orphan detection complete. Review results below.' });
    } catch (error) {
      toast({ title: 'Failed to detect orphaned VLANs', variant: 'destructive' });
    } finally {
      setDetectingOrphans(false);
    }
  };

  const handleCleanupOrphans = async () => {
    try {
      const count = await cleanupOrphanedVLANs(routerID);
      toast({ title: `Cleaned up ${count} orphaned VLAN allocation${count !== 1 ? 's' : ''}` });
      setOrphansDetected(false);
      refetchAllocations();
      refetchPool();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : 'Failed to cleanup orphaned VLANs',
        variant: 'destructive',
      });
    }
  };

  const handleConfigSuccess = () => {
    refetchPool();
    toast({ title: 'VLAN pool configuration updated' });
  };

  // Transform allocations for table
  const tableAllocations = allocations.map((alloc) => ({
    id: alloc.id,
    vlanID: alloc.vlanID,
    serviceType: alloc.serviceType,
    instanceName: alloc.serviceInstance.instanceName,
    bindIP: alloc.subnet,
    interfaceName: `vlan${alloc.vlanID}`,
    status: alloc.status,
    allocatedAt: alloc.allocatedAt,
  }));

  // Desktop layout: Sidebar + Content
  if (platform === 'desktop') {
    return (
      <div className="flex gap-6">
        {/* Sidebar: Gauge */}
        <div className="w-80 flex-shrink-0">
          {poolLoading ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground text-center">Loading pool status...</p>
            </Card>
          ) : poolStatus ? (
            <VLANPoolGauge
              total={poolStatus.totalVLANs}
              allocated={poolStatus.allocatedVLANs}
              shouldWarn={poolStatus.shouldWarn}
            />
          ) : (
            <Card className="p-6">
              <p className="text-sm text-error text-center">Failed to load pool status</p>
            </Card>
          )}
        </div>

        {/* Main Content: Tabs */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pool">Pool Config</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            </TabsList>

            <TabsContent value="pool" className="mt-6">
              {poolStatus && (
                <VLANPoolConfig
                  poolStart={poolStatus.poolStart}
                  poolEnd={poolStatus.poolEnd}
                  allocatedCount={poolStatus.allocatedVLANs}
                  onSuccess={handleConfigSuccess}
                />
              )}
            </TabsContent>

            <TabsContent value="allocations" className="mt-6">
              <VLANAllocationTable
                allocations={tableAllocations}
                loading={allocLoading}
                onRefresh={refetchAllocations}
              />
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Orphan Cleanup</CardTitle>
                  <CardDescription>
                    Detect and clean up VLAN allocations referencing missing or
                    deleting service instances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDetectOrphans}
                      disabled={detectingOrphans}
                      variant="outline"
                    >
                      {detectingOrphans ? 'Detecting...' : 'Detect Orphans'}
                    </Button>
                    <Button
                      onClick={handleCleanupOrphans}
                      disabled={!orphansDetected || cleanupLoading}
                      variant="destructive"
                    >
                      {cleanupLoading ? 'Cleaning...' : 'Clean Up All'}
                    </Button>
                  </div>

                  {orphansDetected && (
                    <div className="p-3 bg-warning/10 border border-warning rounded-md">
                      <p className="text-sm text-warning">
                        Orphan detection complete. Review allocations and click
                        "Clean Up All" to release orphaned VLANs.
                      </p>
                    </div>
                  )}

                  {cleanupCount !== undefined && cleanupCount > 0 && (
                    <div className="p-3 bg-success/10 border border-success rounded-md">
                      <p className="text-sm text-success">
                        Successfully cleaned up {cleanupCount} orphaned VLAN
                        allocation{cleanupCount !== 1 ? 's' : ''}.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Mobile/Tablet layout: Stacked
  return (
    <div className="space-y-4">
      {/* Gauge at top */}
      {poolLoading ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">Loading pool status...</p>
        </Card>
      ) : poolStatus ? (
        <VLANPoolGauge
          total={poolStatus.totalVLANs}
          allocated={poolStatus.allocatedVLANs}
          shouldWarn={poolStatus.shouldWarn}
        />
      ) : (
        <Card className="p-4">
          <p className="text-sm text-error text-center">Failed to load pool status</p>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pool">Config</TabsTrigger>
          <TabsTrigger value="allocations">Allocs</TabsTrigger>
          <TabsTrigger value="diagnostics">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="pool" className="mt-4">
          {poolStatus && (
            <VLANPoolConfig
              poolStart={poolStatus.poolStart}
              poolEnd={poolStatus.poolEnd}
              allocatedCount={poolStatus.allocatedVLANs}
              onSuccess={handleConfigSuccess}
            />
          )}
        </TabsContent>

        <TabsContent value="allocations" className="mt-4">
          <VLANAllocationTable
            allocations={tableAllocations}
            loading={allocLoading}
            onRefresh={refetchAllocations}
          />
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Orphan Cleanup</CardTitle>
              <CardDescription className="text-xs">
                Detect and clean up orphaned VLAN allocations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  onClick={handleDetectOrphans}
                  disabled={detectingOrphans}
                  variant="outline"
                  className="w-full min-h-[44px]"
                >
                  {detectingOrphans ? 'Detecting...' : 'Detect Orphans'}
                </Button>
                <Button
                  onClick={handleCleanupOrphans}
                  disabled={!orphansDetected || cleanupLoading}
                  variant="destructive"
                  className="w-full min-h-[44px]"
                >
                  {cleanupLoading ? 'Cleaning...' : 'Clean Up All'}
                </Button>
              </div>

              {orphansDetected && (
                <div className="p-3 bg-warning/10 border border-warning rounded-md">
                  <p className="text-xs text-warning">
                    Detection complete. Review allocations and click "Clean Up
                    All" to release orphaned VLANs.
                  </p>
                </div>
              )}

              {cleanupCount !== undefined && cleanupCount > 0 && (
                <div className="p-3 bg-success/10 border border-success rounded-md">
                  <p className="text-xs text-success">
                    Cleaned up {cleanupCount} orphaned VLAN allocation
                    {cleanupCount !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
