/**
 * PortRegistryViewDesktop Component
 *
 * Desktop presenter for port registry (≥640px viewports).
 * Implements dense data table layout with sorting, filtering, and hover states.
 *
 * Features:
 * - DataTable with 6 sortable columns
 * - Protocol filter (All/TCP/UDP)
 * - Service type filter
 * - Empty state with icon
 * - Dense layout optimized for power users
 * - Hover states with tooltips
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
import React from 'react';
/**
 * PortRegistryViewDesktop props
 */
export interface PortRegistryViewDesktopProps {
    /** Router ID to display allocations for */
    routerId: string;
    /** Optional className for styling */
    className?: string;
}
/**
 * PortRegistryViewDesktop component
 *
 * Desktop-optimized presenter with DataTable, sorting, and filtering.
 */
export declare const PortRegistryViewDesktop: React.NamedExoticComponent<PortRegistryViewDesktopProps>;
//# sourceMappingURL=PortRegistryViewDesktop.d.ts.map