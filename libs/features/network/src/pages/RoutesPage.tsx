/**
 * Routes Page
 * NAS-6.5: Static Route Management
 *
 * Main page for viewing and managing static routes.
 *
 * @description Allows administrators to view, create, edit, and delete static routes.
 * Provides safety confirmations for destructive operations and validates route configuration.
 */

import { useState, useCallback, memo } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  Sheet,
  SheetContent,
  Icon,
} from '@nasnet/ui/primitives';
import { Plus } from 'lucide-react';
import { usePlatform } from '@nasnet/ui/layouts';
import type { Route } from '@nasnet/api-client/generated';
import {
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
} from '@nasnet/api-client/queries';

import { RouteList, useRouteList } from '../components/routes/RouteList';
import { RouteForm } from '../components/routes/RouteForm';
import { RouteDeleteConfirmation } from '../components/routes/RouteDeleteConfirmation';
import type { RouteFormData } from '../components/routes/RouteForm';

export interface RoutesPageProps {
  /** Router ID */
  routerId?: string;
}

/**
 * RoutesPage - Static route management
 *
 * Features:
 * - View all routes with filtering and sorting
 * - Add new static routes
 * - Edit existing static routes
 * - Delete routes with safety confirmation
 * - Gateway reachability checking
 * - Platform-aware UI (mobile/desktop)
 */
export const RoutesPage = memo(function RoutesPage({ routerId = 'default-router' }: RoutesPageProps) {
  const platform = usePlatform();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  // Mutations
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  // Route list hook with actions
  const routeListHook = useRouteList({
    routerId,
    onEdit: useCallback((route: Route) => {
      setSelectedRoute(route);
      setFormMode('edit');
      setIsFormOpen(true);
    }, []),
    onDelete: useCallback((route: Route) => {
      setRouteToDelete(route);
      setIsDeleteOpen(true);
    }, []),
  });

  // Handle add route
  const handleAddRoute = useCallback(() => {
    setSelectedRoute(null);
    setFormMode('create');
    setIsFormOpen(true);
  }, []);

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (data: RouteFormData) => {
      try {
        if (formMode === 'create') {
          await createRoute.createRoute({
            variables: {
              routerId,
              input: {
                destination: data.destination,
                gateway: data.gateway || undefined,
                interface: data.interface || undefined,
                distance: data.distance,
                routingMark: data.routingMark || undefined,
                routingTable: data.routingTable,
                comment: data.comment || undefined,
              },
            },
          });
        } else if (selectedRoute) {
          await updateRoute.updateRoute({
            variables: {
              routerId,
              routeId: selectedRoute.id,
              input: {
                destination: data.destination,
                gateway: data.gateway || undefined,
                interface: data.interface || undefined,
                distance: data.distance,
                routingMark: data.routingMark || undefined,
                routingTable: data.routingTable,
                comment: data.comment || undefined,
              },
            },
          });
        }

        setIsFormOpen(false);
        setSelectedRoute(null);
        routeListHook.refetch();
      } catch (error) {
        console.error('Failed to save route:', error);
        // Error is displayed by the mutation
      }
    },
    [formMode, selectedRoute, routerId, createRoute, updateRoute, routeListHook]
  );

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setSelectedRoute(null);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!routeToDelete) return;

    try {
      await deleteRoute.deleteRoute({
        variables: {
          routerId,
          routeId: routeToDelete.id,
        },
      });

      setIsDeleteOpen(false);
      setRouteToDelete(null);
      routeListHook.refetch();
    } catch (error) {
      console.error('Failed to delete route:', error);
      // Error is displayed by the mutation
    }
  }, [routeToDelete, routerId, deleteRoute, routeListHook]);

  // Mock interfaces for form (TODO: fetch from API)
  const MOCK_INTERFACES = [
    { id: '1', name: 'ether1', type: 'ether' },
    { id: '2', name: 'ether2', type: 'ether' },
    { id: '3', name: 'bridge1', type: 'bridge' },
    { id: '4', name: 'wlan1', type: 'wlan' },
  ];

  return (
    <div className="container mx-auto px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop space-y-component-lg">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Routes</h1>
          <p className="text-muted-foreground mt-1">
            Manage static routes to direct traffic to specific networks
          </p>
        </div>
        <Button
          onClick={handleAddRoute}
          className="min-h-[44px]"
          aria-label="Add new static route"
        >
          <Icon icon={Plus} className="mr-2 h-4 w-4" />
          Add Route
        </Button>
      </div>

      {/* Route List */}
      <RouteList {...routeListHook} routerId={routerId} />

      {/* Form Dialog/Sheet */}
      {platform === 'mobile' ? (
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto p-component-md">
            <RouteForm
              mode={formMode}
              routerId={routerId}
              interfaces={MOCK_INTERFACES}
              availableTables={routeListHook.availableTables}
              initialValues={
                selectedRoute
                  ? {
                      destination: selectedRoute.destination,
                      gateway: selectedRoute.gateway,
                      interface: selectedRoute.interface,
                      distance: selectedRoute.distance,
                      routingMark: selectedRoute.routingMark,
                      routingTable: selectedRoute.routingTable || 'main',
                      comment: selectedRoute.comment,
                    }
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={createRoute.loading || updateRoute.loading}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <RouteForm
              mode={formMode}
              routerId={routerId}
              interfaces={MOCK_INTERFACES}
              availableTables={routeListHook.availableTables}
              initialValues={
                selectedRoute
                  ? {
                      destination: selectedRoute.destination,
                      gateway: selectedRoute.gateway,
                      interface: selectedRoute.interface,
                      distance: selectedRoute.distance,
                      routingMark: selectedRoute.routingMark,
                      routingTable: selectedRoute.routingTable || 'main',
                      comment: selectedRoute.comment,
                    }
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={createRoute.loading || updateRoute.loading}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {routeToDelete && (
        <RouteDeleteConfirmation
          route={routeToDelete}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleDeleteConfirm}
          loading={deleteRoute.loading}
        />
      )}
    </div>
  );
});
