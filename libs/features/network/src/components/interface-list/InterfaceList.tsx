import { useState, useMemo } from 'react';
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
 * @param routerId - Router ID to fetch interfaces for
 */
export interface InterfaceListProps {
  routerId: string;
}

export interface InterfaceFilters {
  type: InterfaceType | null;
  status: InterfaceStatus | null;
  search: string;
}

export function InterfaceList({ routerId }: InterfaceListProps) {
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
          !filters.search ||
          iface.name.toLowerCase().includes(filters.search.toLowerCase())
      );
  }, [interfaces, filters]);

  // Shared props for both presenters
  const sharedProps = {
    interfaces: filteredInterfaces,
    allInterfaces: interfaces, // For batch operations context
    loading,
    error,
    selectedIds,
    onSelect: setSelectedIds,
    filters,
    onFilterChange: setFilters,
    onRefresh: refetch,
    routerId,
    onOpenDetail: setSelectedInterfaceId,
  };

  return (
    <>
      {platform === 'mobile' ? (
        <InterfaceListMobile {...sharedProps} />
      ) : (
        <InterfaceListDesktop {...sharedProps} />
      )}

      {/* Detail panel - shown when an interface is selected */}
      <InterfaceDetail
        routerId={routerId}
        interfaceId={selectedInterfaceId}
        open={selectedInterfaceId !== null}
        onClose={() => setSelectedInterfaceId(null)}
      />
    </>
  );
}
