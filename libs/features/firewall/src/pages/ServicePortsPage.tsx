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
        <Button
          onClick={onAction}
          className="min-h-[44px]"
        >
          <Plus
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
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
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-md space-y-component-md flex h-full flex-col">
      {/* Page Header */}
      <div className="space-y-component-sm">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t('servicePorts.title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('servicePorts.description')}</p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        {/* Tab Header with Action Button */}
        <div className="gap-component-sm border-border pb-component-md flex items-center justify-between border-b">
          <TabsList>
            <TabsTrigger value="services">{t('servicePorts.tabs.services')}</TabsTrigger>
            <TabsTrigger value="groups">{t('servicePorts.tabs.groups')}</TabsTrigger>
          </TabsList>

          {/* Action Button - changes based on active tab */}
          {activeTab === 'services' ?
            <Button
              onClick={handleAddService}
              className="min-h-[44px]"
            >
              <Plus
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              {t('servicePorts.addService')}
            </Button>
          : <Button
              onClick={handleCreateGroup}
              className="min-h-[44px]"
            >
              <Plus
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              {t('servicePorts.createGroup')}
            </Button>
          }
        </div>

        {/* Services Tab */}
        <TabsContent
          value="services"
          className="p-component-md m-0 flex-1 overflow-y-auto"
        >
          <ServicePortsTable />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent
          value="groups"
          className="p-component-md m-0 flex-1 overflow-y-auto"
        >
          {serviceGroups.length === 0 ?
            <EmptyState
              type="groups"
              onAction={handleCreateGroup}
            />
          : <Card>
              <CardContent className="py-component-lg">
                <div className="space-y-component-sm text-center">
                  <p className="text-muted-foreground text-sm">
                    {t('servicePorts.groupsTableComingSoon', {
                      defaultValue: 'Service Groups table coming soon (not in current scope)',
                    })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t('servicePorts.groupsCount', {
                      defaultValue: '{{count}} group defined',
                      count: serviceGroups.length,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddServiceDialog
        open={addServiceOpen}
        onOpenChange={setAddServiceOpen}
      />
      <ServiceGroupDialog
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
      />
    </div>
  );
}
