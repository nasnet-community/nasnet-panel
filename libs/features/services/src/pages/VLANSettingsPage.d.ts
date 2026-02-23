/**
 * VLANSettingsPage - Domain Page (Layer 3)
 *
 * Complete VLAN Settings UI with three tabs:
 * - Pool Config: Configure VLAN pool range
 * - Allocations: View and filter allocations
 * - Diagnostics: Orphan cleanup tools
 *
 * @example
 * ```tsx
 * <VLANSettingsPage routerID="router-1" />
 * ```
 */
export interface VLANSettingsPageProps {
    /** Router ID to display settings for */
    routerID: string;
}
/**
 * VLANSettingsPage - VLAN management interface
 *
 * Features:
 * - Pool configuration with validation
 * - Allocation monitoring with filters
 * - Orphan detection and cleanup
 * - Real-time utilization gauge
 * - Platform-aware layout (Mobile: stacked, Desktop: sidebar)
 */
export declare function VLANSettingsPage({ routerID }: VLANSettingsPageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VLANSettingsPage.d.ts.map