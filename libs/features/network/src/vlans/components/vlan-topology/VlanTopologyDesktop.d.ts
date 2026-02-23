/**
 * VLAN Topology Desktop Presenter
 *
 * Hierarchical visualization of VLAN topology with parent interfaces.
 * Desktop-optimized with dense information layout and tree-like expansion.
 */
import type { UseVlanTopologyReturn } from '../../hooks/use-vlan-topology';
/**
 * VlanTopologyDesktop Props
 * @interface VlanTopologyDesktopProps
 */
export interface VlanTopologyDesktopProps extends UseVlanTopologyReturn {
    routerId: string;
    onVlanSelect?: (vlanId: string) => void;
}
declare function VlanTopologyDesktopContent({ topology, stats, isLoading, error, onVlanSelect, }: VlanTopologyDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const VlanTopologyDesktop: import("react").MemoExoticComponent<typeof VlanTopologyDesktopContent>;
export {};
//# sourceMappingURL=VlanTopologyDesktop.d.ts.map