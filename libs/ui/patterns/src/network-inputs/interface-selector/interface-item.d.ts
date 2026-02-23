/**
 * InterfaceItem - Individual interface row component
 *
 * Displays a single interface with:
 * - Type icon with color
 * - Name and IP address
 * - Status indicator
 * - Usage warning badge with tooltip
 * - Checkbox for multi-select mode
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */
import type { InterfaceItemProps } from './interface-selector.types';
/**
 * InterfaceItem component.
 *
 * Displays a single interface row with all relevant information
 * and interaction handlers.
 *
 * @param props - InterfaceItemProps
 */
export declare const InterfaceItem: import("react").NamedExoticComponent<InterfaceItemProps>;
/**
 * Mobile variant of InterfaceItem with larger touch targets.
 * Uses 44px minimum height for WCAG compliance.
 */
export declare const InterfaceItemMobile: import("react").NamedExoticComponent<InterfaceItemProps>;
export default InterfaceItem;
//# sourceMappingURL=interface-item.d.ts.map