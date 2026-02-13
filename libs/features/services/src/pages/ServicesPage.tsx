/**
 * ServicesPage
 *
 * Main page for Service Instance Management (Feature Marketplace).
 * Displays installed service instances with filtering, sorting, and bulk operations.
 *
 * @see Task #10: Domain Components & Pages
 */

import * as React from 'react';
import { useState } from 'react';

import {
  useServiceInstances,
  useInstanceMutations,
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
import { InstanceManager } from '@nasnet/ui/patterns';
import { Button, Card, CardContent, CardHeader } from '@nasnet/ui/primitives';

import { InstallDialog } from '../components/InstallDialog';

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
  // Fetch service instances
  const {
    data: instances,
    loading,
    error,
    refetch,
  } = useServiceInstances(routerId);

  // Instance mutations
  const { startInstance, stopInstance, restartInstance, deleteInstance } =
    useInstanceMutations();

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
        </CardHeader>
      </Card>

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
