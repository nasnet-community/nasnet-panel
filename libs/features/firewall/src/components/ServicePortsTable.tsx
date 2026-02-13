/**
 * Service Ports Table Component (Platform Wrapper)
 *
 * Wrapper component that detects platform and renders the appropriate presenter.
 * Follows the Headless + Platform Presenters pattern.
 *
 * Features:
 * - Automatic platform detection (Mobile/Desktop)
 * - Search/filter/sort functionality
 * - CRUD actions (Edit, Delete) for custom services
 * - Read-only built-in services with disabled actions
 * - Protocol and category filtering
 *
 * @see NAS-7.8: Implement Service Ports Management - Task 5
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { useMediaQuery } from '@nasnet/ui/primitives';
import { ServicePortsTableDesktop } from './ServicePortsTableDesktop';
import { ServicePortsTableMobile } from './ServicePortsTableMobile';

export interface ServicePortsTableProps {
  className?: string;
}

/**
 * ServicePortsTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with search/filter/sort
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate service ports table
 */
export function ServicePortsTable({ className }: ServicePortsTableProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <ServicePortsTableMobile className={className} />
  ) : (
    <ServicePortsTableDesktop className={className} />
  );
}
