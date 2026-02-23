/**
 * VLAN Topology Component - Main wrapper
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Visualizes VLAN hierarchy: Parent Interfaces → VLANs
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: Hierarchical tree visualization with collapsible nodes
 * - Mobile: Vertical card layout with touch-friendly interactions
 *
 * @example
 * ```tsx
 * <VlanTopology routerId={routerId} onVlanSelect={handleSelect} />
 * ```
 */
export interface VlanTopologyProps {
    /** Router ID to fetch VLANs for */
    routerId: string;
    /** Optional callback when VLAN is selected */
    onVlanSelect?: (vlanId: string) => void;
}
/**
 * VLAN Topology - Main wrapper with platform detection
 */
export declare function VlanTopology({ routerId, onVlanSelect }: VlanTopologyProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VlanTopology.d.ts.map