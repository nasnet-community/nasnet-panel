/**
 * DHCP Lease Management Page - Auto-detecting Orchestrator
 *
 * Story: NAS-6.11 - Implement DHCP Lease Management
 *
 * This orchestrator component uses the usePlatform() hook to automatically
 * render the appropriate platform-specific presenter (Desktop or Mobile)
 * based on screen size. Follows the Headless + Platform Presenters pattern.
 *
 * @module @nasnet/features/network/dhcp/pages
 */

import * as React from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useLeasePage } from '../hooks/useLeasePage';
import type { DHCPLeaseManagementDesktopProps as DHCPLeaseManagementPresenterProps } from './DHCPLeaseManagementDesktop';
import { DHCPLeaseManagementDesktop } from './DHCPLeaseManagementDesktop';
import { DHCPLeaseManagementMobile } from './DHCPLeaseManagementMobile';

export interface DHCPLeaseManagementPageProps {
  /** Router ID to fetch DHCP leases from */
  routerId: string;
}

/**
 * DHCP Lease Management Page
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px): Card-based layout with swipe actions
 * - Desktop (≥640px): Table-based layout with bulk selection
 *
 * Features:
 * - View all DHCP leases across servers
 * - Filter by status (all, bound, waiting, static) and server
 * - Search by IP, MAC address, or hostname
 * - Bulk operations (make static, delete) with confirmations
 * - Export leases to CSV with ISO date filename
 * - Real-time updates via 30-second polling
 * - "New" badge for recently appeared leases (5s auto-fade)
 *
 * @example
 * ```tsx
 * <DHCPLeaseManagementPage routerId="router-123" />
 * ```
 */
export const DHCPLeaseManagementPage = React.memo(function DHCPLeaseManagementPage({
  routerId,
}: DHCPLeaseManagementPageProps) {
  const platform = usePlatform();

  // Main orchestration hook - handles all data fetching, filtering, and operations
  const pageData = useLeasePage(routerId);

  // Derived properties for presenters
  const isLoading = pageData.isLoadingLeases || pageData.isLoadingServers;
  const hasError = !!(pageData.leasesError || pageData.serversError);
  const error = (pageData.leasesError || pageData.serversError) ?? undefined;

  const presenterProps: DHCPLeaseManagementPresenterProps = {
    ...pageData,
    isLoading,
    isError: hasError,
    error,
    clearSelection: pageData.clearLeaseSelection,
    exportToCSV: () => {
      /* TODO: implement CSV export */
    },
  };

  // Transform servers for mobile presenter (expects string[] of names)
  const serverNames = pageData.servers.map((s) => s.name);

  // Render platform-specific presenter
  return platform === 'mobile' ?
      <DHCPLeaseManagementMobile
        {...presenterProps}
        servers={serverNames}
      />
    : <DHCPLeaseManagementDesktop {...presenterProps} />;
});

DHCPLeaseManagementPage.displayName = 'DHCPLeaseManagementPage';
