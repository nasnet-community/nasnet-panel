import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { TabNavigation } from './components/TabNavigation';
import { RouterHeader } from './components/RouterHeader';
import { ROUTES } from '@nasnet/core/constants';
import { useRouterStore, useConnectionStore } from '@nasnet/state/stores';
import { storeCredentials, clearCredentials } from '@nasnet/api-client/core';
import {
  loadCredentials,
  saveCredentials,
  CredentialDialog,
} from '@nasnet/features/router-discovery';
import type { RouterCredentials } from '@nasnet/core/types';
import {
  ConfigurationImportWizard,
  useConfigurationCheck,
} from '@nasnet/features/configuration-import';

interface RouterPanelProps {
  routerId: string;
  children?: ReactNode;
}

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
 * Usage (TanStack Router):
 * ```tsx
 * // In routes/router/$id/route.tsx
 * function RouterPanelLayout() {
 *   const { id } = Route.useParams();
 *   return <RouterPanel routerId={id}><Outlet /></RouterPanel>;
 * }
 * ```
 */
export function RouterPanel({ routerId, children }: RouterPanelProps) {
  const id = routerId;
  const navigate = useNavigate();

  // Get router info from store
  const router = useRouterStore((state) => (id ? state.routers[id] : undefined));
  const routerIp = router?.ipAddress || '';

  // Get credentials for batch job execution
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  // Credential dialog state
  const [showCredentialDialog, setShowCredentialDialog] = useState(false);
  const [isValidatingCredentials, setIsValidatingCredentials] = useState(false);
  const [credentialError, setCredentialError] = useState<string>();

  // Configuration check hook - determines if wizard should show
  const { showWizard, closeWizard } = useConfigurationCheck(id || '', routerIp);

  // Set the current router in connection store when panel mounts
  // Using getState() directly to avoid stale closures and unnecessary effect re-runs
  useEffect(() => {
    if (id) {
      const routerData = useRouterStore.getState().getRouter(id);
      
      // If router doesn't exist, navigate back to router list
      if (!routerData) {
        console.warn(`Router ${id} not found, redirecting to router list`);
        navigate({ to: ROUTES.ROUTER_LIST });
        return;
      }
      
      if (routerData?.ipAddress) {
        useConnectionStore.getState().setCurrentRouter(id, routerData.ipAddress);

        // Load saved credentials for API client
        const savedCredentials = loadCredentials(id);
        
        if (savedCredentials) {
          // Use saved credentials
          storeCredentials({
            username: savedCredentials.username,
            password: savedCredentials.password,
          });
          setCredentials({
            username: savedCredentials.username,
            password: savedCredentials.password,
          });
        } else {
          // No saved credentials - show credential dialog
          setShowCredentialDialog(true);
        }
      }
    }

    // Clear current router and credentials when leaving the panel
    return () => {
      useConnectionStore.getState().clearCurrentRouter();
      clearCredentials();
    };
  }, [id, navigate]); // Only depend on id and navigate - Zustand actions are stable

  // Handle credential submission
  const handleCredentialSubmit = (
    creds: RouterCredentials,
    shouldSave: boolean
  ) => {
    if (!id) return;

    setIsValidatingCredentials(true);
    setCredentialError(undefined);

    // Store credentials in API client
    storeCredentials(creds);
    setCredentials(creds);

    // Save to localStorage if requested
    if (shouldSave) {
      saveCredentials(id, creds);
    }

    // Close dialog
    setShowCredentialDialog(false);
    setIsValidatingCredentials(false);
  };

  // Handle credential dialog cancellation
  const handleCredentialCancel = () => {
    setShowCredentialDialog(false);
    // Navigate back to router list since we can't proceed without credentials
    navigate({ to: ROUTES.ROUTER_LIST });
  };

  // Keyboard shortcut: Escape key returns to router list
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Only trigger if Escape is pressed and no modal/dialog is open
      // Check for common modal indicators
      const hasOpenModal = document.querySelector('[role="dialog"]');
      const hasOpenAlertDialog = document.querySelector('[role="alertdialog"]');

      if (e.key === 'Escape' && !hasOpenModal && !hasOpenAlertDialog) {
        navigate({ to: ROUTES.ROUTER_LIST });
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
        {children}
      </div>

      {/* Credential Dialog - shows when no saved credentials exist */}
      <CredentialDialog
        isOpen={showCredentialDialog}
        routerIp={routerIp}
        routerName={router?.name}
        isValidating={isValidatingCredentials}
        validationError={credentialError}
        onSubmit={handleCredentialSubmit}
        onCancel={handleCredentialCancel}
      />

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
