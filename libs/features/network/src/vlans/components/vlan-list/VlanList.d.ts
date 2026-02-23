/**
 * VLAN List Component - Main wrapper with headless logic.
 * Follows Headless + Platform Presenters pattern.
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Desktop (≥640px): DataTable with dense presentation
 *
 * @param routerId - Router ID to fetch VLANs for
 */
export interface VlanListProps {
    routerId: string;
    className?: string;
}
export declare function VlanList({ routerId, className }: VlanListProps): import("react/jsx-runtime").JSX.Element;
export declare namespace VlanList {
    var displayName: string;
}
//# sourceMappingURL=VlanList.d.ts.map