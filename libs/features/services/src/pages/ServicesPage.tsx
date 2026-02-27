/**
 * ServicesPage
 *
 * Main page for Service Instance Management (Feature Marketplace).
 * Displays installed service instances with filtering, sorting, and bulk operations.
 *
 * @see Task #10: Domain Components & Pages
 */

import * as React from 'react';
import { useState, useMemo } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { HardDrive, ChevronDown, ChevronUp, Cpu, Upload, ArrowUp, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  useServiceInstances,
  useInstanceMutations,
  useStorageConfig,
  useSystemResources,
  useAvailableUpdates,
  useCheckForUpdates,
  useDependencies,
} from '@nasnet/api-client/queries';
import {
  useServiceUIStore,
  useServiceSearch,
  useCategoryFilter,
  useStatusFilter,
  useServiceViewMode,
  useShowResourceMetrics,
  useSelectedServices,
} from '@nasnet/state/stores';
import { InstanceManager, ResourceBudgetPanel, ServiceImportDialog } from '@nasnet/ui/patterns';
import { Button, Card, CardContent, CardHeader, CardTitle, Separator, Skeleton } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { InstallDialog } from '../components/InstallDialog';
import { StorageSettings } from '../components/storage/StorageSettings';
import { UpdateAllPanel } from '../components/UpdateAllPanel';
import { PortRegistryView } from '../components/PortRegistryView';
import { StopDependentsDialog } from '../components/StopDependentsDialog';

import type { Service, BulkOperation, InstanceFilters, InstanceSort } from '@nasnet/ui/patterns';

/**
 * ServicesPage props
 */
export interface ServicesPageProps {
  /** Router ID */
  routerId: string;
  /** Callback when an instance is clicked (for navigation) */
  onInstanceClick?: (instanceId: string) => void;
  /** Callback when import is completed */
  onImportComplete?: (instanceId: string) => void;
}

/**
 * ServicesPage component
 *
 * Features:
 * - List of installed service instances
 * - Filtering by search, category, status
 * - Sorting by name, status, category, CPU, memory
 * - Bulk operations (start, stop, restart, delete)
 * - Install new service dialog
 * - Real-time status updates via subscriptions
 */
export const ServicesPage = React.memo(function ServicesPage({
  routerId,
  onInstanceClick,
  onImportComplete,
}: ServicesPageProps) {
  const { t } = useTranslation();

  // Fetch service instances
  const {
    instances,
    loading,
    error,
    refetch,
  } = useServiceInstances(routerId);

  // Storage configuration
  const { config: storageConfig } = useStorageConfig();

  // System resources
  const {
    data: resourcesData,
    loading: resourcesLoading,
    error: resourcesError,
  } = useSystemResources(routerId);

  // Available updates (NAS-8.7)
  const { updates: updatesData, loading: updatesLoading } = useAvailableUpdates(
    { routerId },
    { skip: !routerId }
  );

  const [checkForUpdates] = useCheckForUpdates();

  // Instance mutations
  const { startInstance, stopInstance, restartInstance, deleteInstance } =
    useInstanceMutations();

  // TODO: Add real-time subscription for service sharing events when available
  // const { event: sharingEvent } = useServiceConfigSharedSubscription(routerId);

  // UI state from Zustand
  const search = useServiceSearch();
  const categoryFilter = useCategoryFilter();
  const statusFilter = useStatusFilter();
  const viewMode = useServiceViewMode();
  const showMetrics = useShowResourceMetrics();
  const selectedIds = useSelectedServices();

  const {
    setServiceSearch,
    setCategoryFilter,
    setStatusFilter,
    setViewMode,
    toggleServiceSelection,
    clearServiceSelection,
  } = useServiceUIStore();

  // Install dialog state
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Updates section state
  const [updatesOpen, setUpdatesOpen] = useState(false);

  // Port registry section state
  const [portsOpen, setPortsOpen] = useState(false);

  // Stop dependents dialog state (NAS-8.19)
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [pendingStopInstance, setPendingStopInstance] = useState<{ id: string; name: string; featureId: string } | null>(null);

  // Resource overview section state
  const [resourcesOpen, setResourcesOpen] = useState(true); // Expanded by default

  // Storage settings section state
  const [storageOpen, setStorageOpen] = useState(() => {
    // Auto-expand if storage is configured or disconnected
    return storageConfig?.enabled || !storageConfig?.isAvailable || false;
  });

  // TODO: Handle real-time sharing events when subscription is available
  // React.useEffect(() => {
  //   if (sharingEvent) {
  //     if (sharingEvent.type === 'IMPORTED') {
  //       refetch();
  //     }
  //   }
  // }, [sharingEvent, refetch]);

  // Map instances to Service type for pattern component
  const services: Service[] = React.useMemo(() => {
    if (!instances) return [];

    return instances.map((instance: any) => ({
      id: instance.id,
      name: instance.instanceName,
      description: `${instance.featureID} service instance`,
      category: getCategoryFromFeatureId(instance.featureID),
      status: instance.status as any,
      version: instance.binaryVersion,
      metrics: undefined, // TODO: Add real-time metrics from subscriptions
      runtime: {
        installedAt: instance.createdAt,
        lastStarted: instance.updatedAt,
      },
    }));
  }, [instances]);

  // Current filters
  const filters: InstanceFilters = React.useMemo(
    () => ({
      search,
      category: categoryFilter,
      status: statusFilter as any,
    }),
    [search, categoryFilter, statusFilter]
  );

  // Current sort (from URL params or default)
  const [sort, setSort] = useState<InstanceSort>({
    field: 'name',
    direction: 'asc',
  });

  // Handle filter changes
  const handleFiltersChange = React.useCallback(
    (newFilters: InstanceFilters) => {
      if (newFilters.search !== search) {
        setServiceSearch(newFilters.search);
      }
      if (newFilters.category !== categoryFilter) {
        setCategoryFilter(newFilters.category);
      }
      if (newFilters.status !== statusFilter) {
        setStatusFilter(newFilters.status as any);
      }
    },
    [search, categoryFilter, statusFilter, setServiceSearch, setCategoryFilter, setStatusFilter]
  );

  // Handle selection changes
  const handleSelectionChange = React.useCallback(
    (ids: string[]) => {
      // Clear current selection
      clearServiceSelection();
      // Add all new selections
      ids.forEach((id) => toggleServiceSelection(id));
    },
    [clearServiceSelection, toggleServiceSelection]
  );

  // Handle instance click (navigate to detail page)
  const handleInstanceClick = React.useCallback(
    (instance: Service) => {
      onInstanceClick?.(instance.id);
    },
    [onInstanceClick]
  );

  // Handle bulk operations
  const handleBulkOperation = React.useCallback(
    async (operation: BulkOperation, instanceIds: string[]) => {
      try {
        switch (operation) {
          case 'start':
            await Promise.all(
              instanceIds.map((id) =>
                startInstance({ routerID: routerId, instanceID: id })
              )
            );
            toast.success(
              t('services.bulkOperations.startSuccess', { count: instanceIds.length })
            );
            break;

          case 'stop':
            await Promise.all(
              instanceIds.map((id) =>
                stopInstance({ routerID: routerId, instanceID: id })
              )
            );
            toast.success(
              t('services.bulkOperations.stopSuccess', { count: instanceIds.length })
            );
            break;

          case 'restart':
            await Promise.all(
              instanceIds.map((id) =>
                restartInstance({ routerID: routerId, instanceID: id })
              )
            );
            toast.success(
              t('services.bulkOperations.restartSuccess', { count: instanceIds.length })
            );
            break;

          case 'delete':
            // Confirmation handled by InstanceManager
            await Promise.all(
              instanceIds.map((id) =>
                deleteInstance({ routerID: routerId, instanceID: id })
              )
            );
            toast.success(
              t('services.bulkOperations.deleteSuccess', { count: instanceIds.length })
            );
            break;
        }

        // Clear selection after operation
        clearServiceSelection();

        // Refetch instances
        await refetch();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.unknownError');
        toast.error(
          t('services.bulkOperations.error', { operation, message: errorMessage })
        );
      }
    },
    [
      routerId,
      startInstance,
      stopInstance,
      restartInstance,
      deleteInstance,
      clearServiceSelection,
      refetch,
      t,
    ]
  );

  // Handle install success
  const handleInstallSuccess = React.useCallback(async () => {
    setInstallDialogOpen(false);
    await refetch();
  }, [refetch]);

  // Map system resources to ResourceBudgetPanel format
  const resourceBudgetData = React.useMemo(() => {
    if (!resourcesData?.systemResources) {
      return null;
    }

    const resources = resourcesData.systemResources;

    // Map instances to ServiceInstanceResource format
    const resourceInstances = resources.instances.map((instance) => ({
      id: instance.instanceID,
      name: instance.instanceName,
      memoryUsed: instance.usage.currentMB,
      memoryLimit: instance.usage.limitMB,
      status: getInstanceStatus(instance.usage.status),
      cpuUsage: undefined, // TODO: Add CPU usage when available
    }));

    // Calculate system totals
    const systemTotals = {
      totalMemoryUsed: resources.allocatedRAM,
      totalMemoryAvailable: resources.totalRAM,
      runningInstances: resourceInstances.filter((i) => i.status === 'running')
        .length,
      stoppedInstances: resourceInstances.filter((i) => i.status === 'stopped')
        .length,
    };

    return { instances: resourceInstances, systemTotals };
  }, [resourcesData]);

  // Handle resource panel instance click
  const handleResourceInstanceClick = React.useCallback(
    (instance: { id: string }) => {
      onInstanceClick?.(instance.id);
    },
    [onInstanceClick]
  );

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg space-y-component-lg bg-background">
      {/* Page header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-component-md">
              <div>
                <h1 className="text-2xl font-display text-foreground">{t('services.page.title')}</h1>
                <p className="text-sm text-muted-foreground mt-component-sm">
                  {t('services.page.subtitle')}
                </p>
              </div>
              <Cpu className="h-6 w-6 text-category-vpn" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-component-md">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setImportDialogOpen(true)}
                aria-label={t('services.sharing.import.button')}
                className="min-h-[44px]"
              >
                <Upload className="w-4 h-4 mr-component-sm" aria-hidden="true" />
                {t('services.sharing.import.button')}
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => setInstallDialogOpen(true)}
                aria-label={t('services.actions.install')}
                className="min-h-[44px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-component-sm"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('services.actions.install')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resource Overview Section */}
      <Collapsible.Root
        open={resourcesOpen}
        onOpenChange={setResourcesOpen}
      >
        <Card>
          <Collapsible.Trigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" role="button" aria-label={t('services.sections.resourceOverview.toggle')} tabIndex={0}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-component-md">
                  <Cpu className="h-5 w-5 text-category-vpn" aria-hidden="true" />
                  <CardTitle>{t('services.sections.resourceOverview.title')}</CardTitle>
                  {resourcesData && (
                    <span className="text-xs px-component-sm py-component-xs rounded-full bg-category-vpn/10 text-category-vpn">
                      {resourcesData.systemResources.instances.length} instances
                    </span>
                  )}
                </div>
                {resourcesOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Separator />
            <CardContent className="pt-component-lg">
              {resourcesLoading ? (
                <div className="space-y-component-md">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : resourcesError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Failed to load resource data</p>
                  <p className="text-xs mt-1">{resourcesError.message}</p>
                </div>
              ) : resourceBudgetData ? (
                <ResourceBudgetPanel
                  instances={resourceBudgetData.instances}
                  systemTotals={resourceBudgetData.systemTotals}
                  showSystemTotals={true}
                  enableSorting={true}
                  onInstanceClick={handleResourceInstanceClick}
                  emptyMessage="No service instances running"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No resource data available</p>
                </div>
              )}
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      {/* Available Updates Section (NAS-8.7) */}
      {updatesData && updatesData.length > 0 && (
        <Collapsible.Root open={updatesOpen} onOpenChange={setUpdatesOpen}>
          <Card>
            <Collapsible.Trigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" role="button" aria-label={t('services.sections.updates.toggle')} tabIndex={0}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-component-md">
                    <ArrowUp className="h-5 w-5 text-warning" aria-hidden="true" />
                    <CardTitle>{t('services.sections.updates.title')}</CardTitle>
                    <span className="text-xs px-component-sm py-component-xs rounded-full bg-warning/10 text-warning">
                      {updatesData.length} update{updatesData.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {updatesOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </CardHeader>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Separator />
              <CardContent className="pt-component-lg">
                <UpdateAllPanel
                  updates={updatesData}
                  onUpdateAll={() => {
                    // TODO: Trigger update all flow
                    console.log('Update all triggered');
                  }}
                  onUpdate={(instanceId) => {
                    onInstanceClick?.(instanceId);
                  }}
                  loading={updatesLoading}
                />
              </CardContent>
            </Collapsible.Content>
          </Card>
        </Collapsible.Root>
      )}

      {/* Storage Management Section */}
      <Collapsible.Root open={storageOpen} onOpenChange={setStorageOpen}>
        <Card>
          <Collapsible.Trigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" role="button" aria-label={t('services.sections.storage.toggle')} tabIndex={0}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-component-md">
                  <HardDrive className="h-5 w-5 text-category-vpn" aria-hidden="true" />
                  <CardTitle>{t('services.sections.storage.title')}</CardTitle>
                  {storageConfig?.enabled && (
                    <span className="text-xs px-component-sm py-component-xs rounded-full bg-category-vpn/10 text-category-vpn">
                      Configured
                    </span>
                  )}
                </div>
                {storageOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Separator />
            <CardContent className="pt-component-md">
              <StorageSettings />
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      {/* Port Allocations Section (NAS-8.16) */}
      <Collapsible.Root open={portsOpen} onOpenChange={setPortsOpen}>
        <Card>
          <Collapsible.Trigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" role="button" aria-label={t('services.sections.ports.toggle')} tabIndex={0}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-component-md">
                  <Network className="h-5 w-5 text-category-vpn" aria-hidden="true" />
                  <CardTitle>{t('services.sections.ports.title')}</CardTitle>
                </div>
                {portsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Separator />
            <CardContent className="pt-component-lg">
              <PortRegistryView routerId={routerId} />
            </CardContent>
          </Collapsible.Content>
        </Card>
      </Collapsible.Root>

      {/* Instance manager */}
      <InstanceManager
        instances={services}
        loading={loading}
        error={error?.message || null}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onInstanceClick={handleInstanceClick}
        onBulkOperation={handleBulkOperation}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showMetrics={showMetrics}
        emptyState={
          <div className="text-center py-component-lg bg-muted/30 rounded-[var(--semantic-radius-card)]">
            <h3 className="text-lg font-display mb-component-sm text-foreground">
              {t('services.empty.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-component-md">
              {t('services.empty.description')}
            </p>
            <Button onClick={() => setInstallDialogOpen(true)} className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {t('services.empty.action')}
            </Button>
          </div>
        }
      />

      {/* Install dialog */}
      <InstallDialog
        open={installDialogOpen}
        onClose={() => setInstallDialogOpen(false)}
        routerId={routerId}
        onSuccess={handleInstallSuccess}
      />

      {/* Import dialog */}
      <ServiceImportDialog
        open={importDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) setImportDialogOpen(false);
        }}
        routerID={routerId}
        onImportComplete={async (instanceId: string) => {
          // Refetch instances
          await refetch();
          // Call optional import complete callback
          onImportComplete?.(instanceId);
        }}
      />

      {/* Stop Dependents Dialog (NAS-8.19) */}
      {pendingStopInstance && (
        <StopDependentsDialog
          open={stopDialogOpen}
          onOpenChange={setStopDialogOpen}
          instanceName={pendingStopInstance.name}
          featureId={pendingStopInstance.featureId}
          dependents={[]}
          onConfirm={async (mode) => {
            if (pendingStopInstance) {
              await stopInstance({ routerID: routerId, instanceID: pendingStopInstance.id });
              setStopDialogOpen(false);
              setPendingStopInstance(null);
              await refetch();
            }
          }}
        />
      )}
    </div>
  );
});

ServicesPage.displayName = 'ServicesPage';

/**
 * Get category from feature ID
 * TODO: This should come from manifest metadata
 */
function getCategoryFromFeatureId(featureId: string): Service['category'] {
  const categoryMap: Record<string, Service['category']> = {
    tor: 'privacy',
    'sing-box': 'proxy',
    'xray-core': 'proxy',
    mtproxy: 'proxy',
    psiphon: 'privacy',
    'adguard-home': 'dns',
  };

  return categoryMap[featureId] || 'proxy';
}

/**
 * Map resource status to instance status
 * Maps ResourceStatus enum to ServiceInstanceResource status
 */
function getInstanceStatus(
  resourceStatus: string
): 'running' | 'stopped' | 'pending' | 'error' {
  // Resource status comes from backend as OK, WARNING, CRITICAL
  // We map these to instance running states
  // All states except error map to running since resource monitoring
  // only happens for running instances
  switch (resourceStatus) {
    case 'OK':
    case 'WARNING':
    case 'CRITICAL':
      return 'running';
    default:
      return 'stopped';
  }
}
