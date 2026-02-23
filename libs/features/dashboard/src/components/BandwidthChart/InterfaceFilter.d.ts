/**
 * InterfaceFilter - Dropdown selector for filtering bandwidth by interface
 * WCAG AAA compliant with proper ARIA support and keyboard navigation
 * @description
 * Provides a Select dropdown for choosing specific interface or all interfaces.
 * Fetches interface list via useInterfaces hook, displays type-specific icons,
 * and maintains 44px minimum touch targets. Supports keyboard navigation and
 * screen reader announcements.
 * @example
 * <InterfaceFilter routerId="router1" value="eth0" onChange={setInterface} />
 */
import type { InterfaceFilterProps } from './types';
/**
 * InterfaceFilter component - Select dropdown for interface filtering
 *
 * Provides dropdown for selecting specific interface or "All interfaces"
 * - Integrates with useInterfaces hook from Story 5.3
 * - WCAG AAA compliant: 7:1 contrast, 44px minimum touch targets
 * - Keyboard navigation via Select primitive (arrow keys, Enter, Escape)
 * - Shows interface type icons for visual identification
 * - Memoized getInterfaceLabel callback for performance
 * - Proper ARIA labeling and semantic structure
 *
 * @param props - Component props (routerId, value, onChange, className)
 * @returns Memoized Select component with interface options
 */
export declare const InterfaceFilter: import("react").NamedExoticComponent<InterfaceFilterProps>;
//# sourceMappingURL=InterfaceFilter.d.ts.map