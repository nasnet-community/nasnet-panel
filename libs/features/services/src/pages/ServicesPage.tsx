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
import { HardDrive, ChevronDown, ChevronUp, Cpu, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useServiceInstances,
  useInstanceMutations,
  useStorageConfig,
  useSystemResources,
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

import type { Service } from '@nasnet/ui/patterns';
import type { BulkOperation, InstanceFilters, InstanceSort } from '@nasnet/ui/patterns';

/**
 * ServicesPage props
 */
export interface ServicesPageProps {
  /** Router ID */
  routerId: string;
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
export function ServicesPage({ routerId }: ServicesPageProps) {
  const { t } = useTranslation();

  // Fetch service instances
  const {
    data: instances,
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

    return instances.map((instance) => ({
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
      // TODO: Navigate to service detail page
      console.log('Navigate to instance:', instance.id);
    },
    []
  );

  // Handle bulk operations
  const handleBulkOperation = React.useCallback(
    async (operation: BulkOperation, instanceIds: string[]) => {
      try {
        switch (operation) {
          case 'start':
            await Promise.all(
              instanceIds.map((id) =>
                startInstance({
                  variables: {
                    input: { routerID: routerId, instanceID: id },
                  },
                })
              )
            );
            break;

          case 'stop':
            await Promise.all(
              instanceIds.map((id) =>
                stopInstance({
                  variables: {
                    input: { routerID: routerId, instanceID: id },
                  },
                })
              )
            );
            break;

          case 'restart':
            await Promise.all(
              instanceIds.map((id) =>
                restartInstance({
                  variables: {
                    input: { routerID: routerId, instanceID: id },
                  },
                })
              )
            );
            break;

          case 'delete':
            // Confirmation handled by InstanceManager
            await Promise.all(
              instanceIds.map((id) =>
                deleteInstance({
                  variables: {
                    input: { routerID: routerId, instanceID: id },
                  },
                })
              )
            );
            break;
        }

        // Clear selection after operation
        clearServiceSelection();

        // Refetch instances
        await refetch();
      } catch (err) {
        console.error('Bulk operation failed:', err);
        // TODO: Show error toast
      }
    },
    [routerId, startInstance, stopInstance, restartInstance, deleteInstance, clearServiceSelection, refetch]
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
      // TODO: Navigate to service detail page
      console.log('Navigate to instance from resource panel:', instance.id);
    },
    []
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Service Instances</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage downloadable network services on your router
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('services.sharing.import.button')}
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => setInstallDialogOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Install Service
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
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Resource Overview</CardTitle>
                  {resourcesData && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {resourcesData.systemResources.instances.length} instances
                    </span>
                  )}
                </div>
                {resourcesOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Separator />
            <CardContent className="pt-6">
              {resourcesLoading ? (
                <div className="space-y-4">
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

      {/* Storage Management Section */}
      <Collapsible.Root open={storageOpen} onOpenChange={setStorageOpen}>
        <Card>
          <Collapsible.Trigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Storage Management</CardTitle>
                  {storageConfig?.enabled && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      Configured
                    </span>
                  )}
                </div>
                {storageOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Separator />
            <CardContent className="pt-0">
              <StorageSettings />
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
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">
              No services installed yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Install network services from the Feature Marketplace to get started
            </p>
            <Button onClick={() => setInstallDialogOpen(true)}>
              Install Your First Service
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
        onClose={() => setImportDialogOpen(false)}
        routerId={routerId}
        onSuccess={async (instanceId) => {
          // Refetch instances
          await refetch();
          // Navigate to new instance detail page
          console.log('Import successful, navigate to:', instanceId);
        }}
        onMissingService={(serviceType) => {
          // Close import, open install dialog
          setImportDialogOpen(false);
          setInstallDialogOpen(true);
          // TODO: Pre-select serviceType in install dialog
        }}
      />
    </div>
  );
}

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
