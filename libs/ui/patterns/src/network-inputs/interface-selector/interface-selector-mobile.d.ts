/**
 * InterfaceSelectorMobile - Mobile presenter for interface selection
 *
 * Features:
 * - Full-screen bottom sheet
 * - 44px minimum touch targets (WCAG 2.5.5)
 * - Scrollable interface list
 * - Search input
 * - Loading and error states
 *
 * @see NAS-4A.9: Build Interface Selector Component
 * @see ADR-018: Headless Platform Presenters
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */
import type { InterfaceSelectorMobileProps } from './interface-selector.types';
/**
 * Mobile presenter for interface selector.
 *
 * Renders as a bottom sheet with:
 * - Full-height scrollable list
 * - Large touch targets (44px minimum)
 * - Search input
 * - Type filter
 *
 * @param props - InterfaceSelectorMobileProps
 */
export declare const InterfaceSelectorMobile: import("react").NamedExoticComponent<InterfaceSelectorMobileProps>;
export default InterfaceSelectorMobile;
//# sourceMappingURL=interface-selector-mobile.d.ts.map