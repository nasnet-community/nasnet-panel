import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TabNavigation } from './components/TabNavigation';
import { RouterHeader } from './components/RouterHeader';
import { ROUTES } from '@nasnet/core/constants';
import { useRouterStore, useConnectionStore } from '@nasnet/state/stores';
import { storeCredentials, clearCredentials } from '@nasnet/api-client/core';
import { loadCredentials } from '@nasnet/features/router-discovery';
import {
  ConfigurationImportWizard,
  useConfigurationCheck,
} from '@nasnet/features/configuration-import';

/**
 * RouterPanel Layout Component
 *
 * Main layout for router-specific views with adaptive navigation.
 * Provides:
 * - Enhanced header with router info and status
 * - Adaptive tab navigation (bottom on mobile, top on desktop)
 * - Router ID from URL params
 * - Outlet for nested tab routes
 * - Card-based design system
 *
 * Route structure:
 * - /router/:id → OverviewTab (index)
 * - /router/:id/wifi → WiFiTab
 * - /router/:id/vpn → VPNTab
 * - /router/:id/firewall → FirewallTab
 * - /router/:id/dhcp → DHCPTab
 * - /router/:id/network → NetworkTab
 * - /router/:id/logs → LogsTab
 * - /router/:id/plugins → PluginStoreTab
 *
 * Layout:
 * - Mobile: Header + Content + Bottom Navigation
 * - Desktop: Header + Top Tabs + Content
 *
 * Design Tokens Applied:
 * - Surface colors for backgrounds
 * - Card elevation with shadows
 * - Responsive spacing (p-4 md:p-6)
 * - Safe area support for mobile
 *
 * Usage:
 * ```tsx
 * <Route path="/router/:id" element={<RouterPanel />}>
 *   <Route index element={<OverviewTab />} />
 *   <Route path="wifi" element={<WiFiTab />} />
 *   // ... other tabs
 * </Route>
 * ```
 */
export function RouterPanel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Get router info from store
  const router = useRouterStore((state) => (id ? state.routers[id] : undefined));
  const routerIp = router?.ipAddress || '';

  // Get credentials for batch job execution
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  // Configuration check hook - determines if wizard should show
  const { showWizard, closeWizard } = useConfigurationCheck(id || '', routerIp);

  // Set the current router in connection store when panel mounts
  // Using getState() directly to avoid stale closures and unnecessary effect re-runs
  useEffect(() => {
    if (id) {
      const routerData = useRouterStore.getState().getRouter(id);
      if (routerData?.ipAddress) {
        useConnectionStore.getState().setCurrentRouter(id, routerData.ipAddress);

        // Load and set saved credentials for API client
        const savedCredentials = loadCredentials(id);
        if (savedCredentials) {
          storeCredentials({
            username: savedCredentials.username,
            password: savedCredentials.password,
          });
          // Store credentials for wizard use
          setCredentials({
            username: savedCredentials.username,
            password: savedCredentials.password,
          });
        }
      }
    }

    // Clear current router and credentials when leaving the panel
    return () => {
      useConnectionStore.getState().clearCurrentRouter();
      clearCredentials();
    };
  }, [id]); // Only depend on id - Zustand actions are stable

  // Keyboard shortcut: Escape key returns to router list
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Only trigger if Escape is pressed and no modal/dialog is open
      // Check for common modal indicators
      const hasOpenModal = document.querySelector('[role="dialog"]');
      const hasOpenAlertDialog = document.querySelector('[role="alertdialog"]');

      if (e.key === 'Escape' && !hasOpenModal && !hasOpenAlertDialog) {
        navigate(ROUTES.ROUTER_LIST);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navigate]);

  return (
    <div className="flex flex-col h-full">
      {/* Router Header with status and info */}
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="max-w-7xl mx-auto">
          <RouterHeader routerId={id || ''} />
        </div>
      </div>

      {/* Tab Navigation (adaptive: top on desktop, bottom on mobile) */}
      <div className="px-4 md:px-6">
        <TabNavigation />
      </div>

      {/* Tab content area - with bottom padding on mobile for bottom nav */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Configuration Import Wizard - shows on first visit if router note is empty */}
      {credentials && (
        <ConfigurationImportWizard
          isOpen={showWizard}
          onClose={closeWizard}
          routerIp={routerIp}
          credentials={credentials}
          onSuccess={() => {
            // Wizard handles marking as checked on close
          }}
          onSkip={() => {
            // Wizard handles marking as checked on close
          }}
        />
      )}
    </div>
  );
}
