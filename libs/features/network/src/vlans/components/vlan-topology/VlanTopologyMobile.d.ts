/**
 * VLAN Topology Mobile Presenter
 *
 * Card-based vertical layout for VLAN topology visualization on mobile devices (<640px).
 * Displays parent interfaces with expandable VLAN lists, statistics, and per-VLAN status badges.
 *
 * @description
 * This component presents VLAN topology data optimized for mobile viewing:
 * - Vertical card layout (no horizontal scrolling)
 * - Tap-to-expand interface hierarchy
 * - Quick stats overview (total, running, disabled, interfaces)
 * - Status badges (running/disabled/down) per VLAN
 * - VLAN ID displayed in monospace font for technical clarity
 *
 * @example
 * ```tsx
 * <VlanTopologyMobile
 *   topology={topology}
 *   stats={stats}
 *   loading={false}
 *   error={null}
 *   onVlanSelect={handleSelect}
 * />
 * ```
 */
import type { UseVlanTopologyReturn } from '../../hooks/use-vlan-topology';
export interface VlanTopologyMobileProps extends UseVlanTopologyReturn {
    /** Router ID for context */
    routerId: string;
    /** Callback when a VLAN is selected */
    onVlanSelect?: (vlanId: string) => void;
    /** Optional CSS classes */
    className?: string;
}
/**
 * VlanTopologyMobile component - Render function
 */
declare function VlanTopologyMobileComponent({ topology, stats, isLoading, error, onVlanSelect, className, }: VlanTopologyMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const VlanTopologyMobile: import("react").MemoExoticComponent<typeof VlanTopologyMobileComponent>;
export {};
//# sourceMappingURL=VlanTopologyMobile.d.ts.map