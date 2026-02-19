/**
 * DHCP Lease Management Page - Auto-detecting Orchestrator
 *
 * Story: NAS-6.11 - Implement DHCP Lease Management
 *
 * This orchestrator component uses the usePlatform() hook to automatically
 * render the appropriate platform-specific presenter (Desktop or Mobile)
 * based on screen size.
 */

import * as React from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useLeasePage } from '../hooks/useLeasePage';
import { DHCPLeaseManagementDesktop } from './DHCPLeaseManagementDesktop';
import { DHCPLeaseManagementMobile } from './DHCPLeaseManagementMobile';

export interface DHCPLeaseManagementPageProps {
  /** Router IP address to fetch leases from */
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
 */
export const DHCPLeaseManagementPage = React.memo(function DHCPLeaseManagementPage({ routerId }: DHCPLeaseManagementPageProps) {
  const platform = usePlatform();

  // Main orchestration hook - handles all data fetching, filtering, and operations
  const pageData = useLeasePage(routerId);

  // Derived properties for presenters
  const isLoading = pageData.isLoadingLeases || pageData.isLoadingServers;
  const isError = !!(pageData.leasesError || pageData.serversError);
  const error = pageData.leasesError || pageData.serversError || undefined;

  const presenterProps = {
    ...pageData,
    isLoading,
    isError,
    error,
    clearSelection: pageData.clearLeaseSelection,
    exportToCSV: () => { /* TODO: implement CSV export */ },
  };

  // Render platform-specific presenter
  return platform === 'mobile' ? (
    <DHCPLeaseManagementMobile {...presenterProps as any} />
  ) : (
    <DHCPLeaseManagementDesktop {...presenterProps as any} />
  );
});

DHCPLeaseManagementPage.displayName = 'DHCPLeaseManagementPage';
