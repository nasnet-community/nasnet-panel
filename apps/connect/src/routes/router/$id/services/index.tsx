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
 * Service tabs configuration
 */
const serviceTabs: ServiceTab[] = [
  {
    value: 'instances',
    label: 'Instances',
    path: 'plugins',
    icon: Package,
    description: 'Individual service instances',
  },
  {
    value: 'templates',
    label: 'Templates',
    path: 'services/templates',
    icon: Boxes,
    description: 'Multi-service templates',
  },
];

/**
 * Services Index Page Component
 *
 * Renders sub-navigation tabs for services section.
 * Routes between individual instances and templates.
 */
function ServicesIndexPage() {
  const { id: routerId } = Route.useParams();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Determine active tab from URL
  const activeTab = pathname.includes('/templates') ? 'templates' : 'instances';

  /**
   * Handle tab change
   */
  const handleTabClick = (tab: ServiceTab) => {
    navigate({ to: `/router/${routerId}/${tab.path}` });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-default bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-1">
            {serviceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.description}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                    'border-b-2 border-transparent focus-ring',
                    'hover:text-primary-600 dark:hover:text-primary-400',
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Route Configuration
 */
export const Route = createFileRoute('/router/$id/services/')({
  component: ServicesIndexPage,
});
