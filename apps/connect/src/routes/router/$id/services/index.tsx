/**
 * Services Index Route
 *
 * Parent route for service management with tab navigation.
 * Provides access to individual service instances and templates.
 *
 * Route: /router/:id/services
 */

import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Package, Boxes } from 'lucide-react';

import { useTranslation } from '@nasnet/core/i18n';
import { ServicesPage } from '@nasnet/features/services';
import { cn } from '@nasnet/ui/primitives';

/**
 * Service tab definition
 */
interface ServiceTab {
  value: string;
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

/**
 * Route Configuration
 */
export const Route = createFileRoute('/router/$id/services/')({
  component: ServicesIndexPage,
});

/**
 * Services Index Page Component
 *
 * Renders sub-navigation tabs for services section.
 * Routes between individual instances and templates.
 */
function ServicesIndexPage() {
  const { t } = useTranslation('services');
  const { id: routerId } = Route.useParams();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Determine active tab from URL
  const activeTab = pathname.includes('/templates') ? 'templates' : 'instances';

  // Define service tabs with translated labels and descriptions
  const serviceTabs: ServiceTab[] = [
    {
      value: 'instances',
      label: t('tabs.instances'),
      path: '',
      icon: Package,
      description: t('tabs.instancesDescription'),
    },
    {
      value: 'templates',
      label: t('tabs.templates'),
      path: 'services/templates',
      icon: Boxes,
      description: t('tabs.templatesDescription'),
    },
  ];

  /**
   * Handle tab change
   */
  const handleTabClick = (tab: ServiceTab) => {
    if (tab.value === 'instances') {
      navigate({ to: `/router/${routerId}/services` });
    } else {
      navigate({ to: `/router/${routerId}/${tab.path}` });
    }
  };

  /**
   * Handle instance click - navigate to detail page
   */
  const handleInstanceClick = (instanceId: string) => {
    navigate({ to: `/router/${routerId}/services/${instanceId}` });
  };

  /**
   * Handle import complete - navigate to imported instance
   */
  const handleImportComplete = (instanceId: string) => {
    navigate({ to: `/router/${routerId}/services/${instanceId}` });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tab Navigation */}
      <div className="border-default bg-background sticky top-0 z-10 border-b">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div
            className="flex gap-1"
            role="tablist"
            aria-label={t('title')}
          >
            {serviceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${tab.label}: ${tab.description}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                    'focus-ring border-b-2 border-transparent',
                    'hover:text-primary',
                    isActive ? 'border-primary text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'instances' ?
          <ServicesPage
            routerId={routerId}
            onInstanceClick={handleInstanceClick}
            onImportComplete={handleImportComplete}
          />
        : <Outlet />}
      </div>
    </div>
  );
}
