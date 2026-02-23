/**
 * ServicePortsPage Component
 *
 * Main page for managing service ports and service groups.
 * Integrates ServicePortsTable, AddServiceDialog, and ServiceGroupDialog
 * with tab-based navigation between Services and Groups views.
 *
 * Features:
 * - Tab navigation (Services, Groups)
 * - Context-aware action buttons (Add Service / Create Group)
 * - Responsive layout
 * - Full i18n support
 *
 * @see NAS-7.8: Implement Service Ports Management - Task 8
 * @module @nasnet/features/firewall/pages
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives';
import { Plus } from 'lucide-react';
import { ServicePortsTable } from '../components/ServicePortsTable';
import { AddServiceDialog } from '../components/AddServiceDialog';
import { ServiceGroupDialog } from '../components/ServiceGroupDialog';
import { useCustomServices } from '../hooks';

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  /** Empty state type (currently only 'groups') */
  type: 'groups';
  /** Callback when user clicks primary action */
  onAction: () => void;
}

/**
 * EmptyState - Displayed when service groups list is empty
 *
 * @param props - Empty state configuration
 * @returns Empty state UI with action button
 */
function EmptyState({ type, onAction }: EmptyStateProps) {
  const { t } = useTranslation('firewall');

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>{t('servicePorts.emptyStates.noGroups')}</CardTitle>
        <CardDescription>{t('servicePorts.emptyStates.noGroupsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          {t('servicePorts.createGroup')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ServicePortsPage Component
 *
 * Main page for service ports management with tab navigation.
 * Provides access to:
 * - Services tab: Built-in + custom services (ServicePortsTable)
 * - Groups tab: Service groups (placeholder for future implementation)
 *
 * @returns Service Ports management page
 */
export function ServicePortsPage() {
  const { t } = useTranslation('firewall');
  const { serviceGroups } = useCustomServices();

  // Dialog state
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('services');

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAddService = useCallback(() => {
    setAddServiceOpen(true);
  }, []);

  const handleCreateGroup = useCallback(() => {
    setAddGroupOpen(true);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('servicePorts.title')}</h1>
        <p className="text-muted-foreground">{t('servicePorts.description')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Tab Header with Action Button */}
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="services">{t('servicePorts.tabs.services')}</TabsTrigger>
            <TabsTrigger value="groups">{t('servicePorts.tabs.groups')}</TabsTrigger>
          </TabsList>

          {/* Action Button - changes based on active tab */}
          {activeTab === 'services' ? (
            <Button onClick={handleAddService}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('servicePorts.addService')}
            </Button>
          ) : (
            <Button onClick={handleCreateGroup}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('servicePorts.createGroup')}
            </Button>
          )}
        </div>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <ServicePortsTable />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          {serviceGroups.length === 0 ? (
            <EmptyState type="groups" onAction={handleCreateGroup} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-12 space-y-2">
                  <p className="text-muted-foreground">
                    {t('servicePorts.groupsTableComingSoon', {
                      defaultValue: 'Service Groups table coming soon (not in current scope)',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('servicePorts.groupsCount', {
                      defaultValue: '{{count}} group defined',
                      count: serviceGroups.length,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddServiceDialog open={addServiceOpen} onOpenChange={setAddServiceOpen} />
      <ServiceGroupDialog open={addGroupOpen} onOpenChange={setAddGroupOpen} />
    </div>
  );
}
