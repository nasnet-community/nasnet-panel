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

import { useMemo } from 'react';
import { usePlatform } from '@nasnet/ui/patterns';
import { ServicePortsTableDesktop } from './ServicePortsTableDesktop';
import { ServicePortsTableMobile } from './ServicePortsTableMobile';

export interface ServicePortsTableProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Manual platform override ('mobile' | 'tablet' | 'desktop') */
  presenter?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * ServicePortsTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with search/filter/sort
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * Implements the Headless + Platform Presenters pattern.
 *
 * @example
 * ```tsx
 * <ServicePortsTable className="p-4" />
 * <ServicePortsTable presenter="mobile" /> // Manual override
 * ```
 *
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 * @param props - Component props including optional presenter override
 * @returns Platform-appropriate service ports table
 */
export const ServicePortsTable: React.FC<ServicePortsTableProps> = ({
  className,
  presenter,
}: ServicePortsTableProps) => {
  // Auto-detect platform if not manually overridden
  const detectedPlatform = usePlatform();
  const platform = presenter || detectedPlatform;

  const memoizedComponent = useMemo(() => {
    return platform === 'mobile' ?
        <ServicePortsTableMobile className={className} />
      : <ServicePortsTableDesktop className={className} />;
  }, [platform, className]);

  return memoizedComponent;
};

ServicePortsTable.displayName = 'ServicePortsTable';
