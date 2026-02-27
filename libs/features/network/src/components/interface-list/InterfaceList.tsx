import { useState, useMemo, useCallback } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useInterfaceList } from '@nasnet/api-client/queries';
import type { InterfaceType, InterfaceStatus } from '@nasnet/api-client/generated';
import { InterfaceListDesktop } from './InterfaceListDesktop';
import { InterfaceListMobile } from './InterfaceListMobile';
import { InterfaceDetail } from '../interface-detail';

/**
 * Interface List Component - Main wrapper with headless logic
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Manages interface listing, filtering, selection, and detail panel visibility.
 * Automatically detects platform (mobile/desktop) and renders appropriate presenter.
 *
 * @example
 * ```tsx
 * <InterfaceList routerId="r1" />
 * ```
 */
export interface InterfaceListProps {
  /** Router ID to fetch interfaces for */
  routerId: string;
  /** Optional CSS class */
  className?: string;
}

export interface InterfaceFilters {
  /** Filter by interface type (WAN, LAN, etc.) */
  type: InterfaceType | null;
  /** Filter by interface status */
  status: InterfaceStatus | null;
  /** Search by interface name */
  search: string;
}

export function InterfaceList({ routerId, className }: InterfaceListProps) {
  const platform = usePlatform();

  // Headless logic - state shared across presenters
  const { interfaces, loading, error, refetch } = useInterfaceList(routerId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<InterfaceFilters>({
    type: null,
    status: null,
    search: '',
  });
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<string | null>(null);

  // Filtered interfaces (client-side filtering)
  const filteredInterfaces = useMemo(() => {
    return interfaces
      .filter((iface: any) => !filters.type || iface.type === filters.type)
      .filter((iface: any) => !filters.status || iface.status === filters.status)
      .filter(
        (iface: any) =>
          !filters.search || iface.name.toLowerCase().includes(filters.search.toLowerCase())
      );
  }, [interfaces, filters]);

  // Memoized callbacks for stability
  const handleSelectChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  const handleFilterChange = useCallback((newFilters: InterfaceFilters) => {
    setFilters(newFilters);
  }, []);

  const handleOpenDetail = useCallback((id: string | null) => {
    setSelectedInterfaceId(id);
  }, []);

  // Shared props for both presenters
  const sharedProps = {
    interfaces: filteredInterfaces,
    allInterfaces: interfaces, // For batch operations context
    loading,
    error,
    selectedIds,
    onSelect: handleSelectChange,
    filters,
    onFilterChange: handleFilterChange,
    onRefresh: refetch,
    routerId,
    onOpenDetail: handleOpenDetail,
    className,
  };

  return (
    <div className="category-networking">
      {platform === 'mobile' ?
        <InterfaceListMobile {...sharedProps} />
      : <InterfaceListDesktop {...sharedProps} />}

      {/* Detail panel - shown when an interface is selected */}
      <InterfaceDetail
        routerId={routerId}
        interfaceId={selectedInterfaceId}
        open={selectedInterfaceId !== null}
        onClose={() => handleOpenDetail(null)}
      />
    </div>
  );
}

InterfaceList.displayName = 'InterfaceList';
