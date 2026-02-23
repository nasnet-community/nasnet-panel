/**
 * InterfaceTypeIcon - Icon component for interface types
 *
 * Displays the appropriate icon for each interface type with
 * design token colors following the design system.
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */
import type { InterfaceType, InterfaceTypeIconProps } from './interface-selector.types';
/**
 * Interface type icon component.
 *
 * Displays the appropriate icon for the given interface type
 * with proper color coding based on design tokens.
 *
 * @param props - InterfaceTypeIconProps
 */
export declare const InterfaceTypeIcon: import("react").NamedExoticComponent<InterfaceTypeIconProps>;
/**
 * Get the display label for an interface type.
 */
export declare function getInterfaceTypeLabel(type: InterfaceType): string;
export default InterfaceTypeIcon;
//# sourceMappingURL=interface-type-icon.d.ts.map