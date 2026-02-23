/**
 * LeaseFilters Component
 *
 * Provides filtering controls for DHCP lease table:
 * - Status filter (All, Bound, Waiting, Busy, Offered, Static)
 * - Server filter (dropdown populated from available servers)
 * - Active filter badges with dismiss buttons
 *
 * Uses Zustand store for filter state management.
 *
 * @module features/network/dhcp/components/lease-filters
 */
import * as React from 'react';
export interface LeaseFiltersProps {
    /**
     * Available DHCP servers for server filter dropdown
     */
    servers: Array<{
        id: string;
        name: string;
    }>;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Desktop filter controls for DHCP lease management
 *
 * Displays filter dropdowns and active filter badges with dismiss buttons.
 * Integrates with useDHCPUIStore for state management.
 *
 * @example
 * ```tsx
 * <LeaseFilters servers={dhcpServers} />
 * ```
 */
export declare const LeaseFilters: React.NamedExoticComponent<LeaseFiltersProps>;
//# sourceMappingURL=LeaseFilters.d.ts.map