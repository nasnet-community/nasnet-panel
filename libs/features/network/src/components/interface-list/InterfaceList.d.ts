import type { InterfaceType, InterfaceStatus } from '@nasnet/api-client/generated';
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
export declare function InterfaceList({ routerId, className }: InterfaceListProps): import("react/jsx-runtime").JSX.Element;
export declare namespace InterfaceList {
    var displayName: string;
}
//# sourceMappingURL=InterfaceList.d.ts.map