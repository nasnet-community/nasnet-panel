/**
 * InterfaceGrid Mobile Presenter
 *
 * Mobile-optimized 2-column grid layout for interface status cards.
 * Emphasizes consumer-grade simplicity with touch-first design.
 *
 * Features:
 * - 2-column responsive grid (mobile breakpoint <640px)
 * - 44x44px minimum touch targets (WCAG AAA compliance)
 * - Compact card layout with essential information only
 * - Show all / Show less toggle for >8 interfaces
 * - Loading skeleton state (2 card skeletons)
 * - Error state with full-width retry button
 * - Empty state with concise messaging
 * - Bottom sheet overlay for interface details
 *
 * @see InterfaceGrid.tsx for auto-detection wrapper
 * @see InterfaceGrid.Desktop.tsx for 4-column variant
 * @see InterfaceGrid.Tablet.tsx for 3-column variant
 */
import type { InterfaceGridProps } from './types';
/**
 * Mobile presenter for InterfaceGrid.
 *
 * Renders a 2-column grid optimized for touch interaction with 44px touch targets.
 * Emphasizes consumer-grade simplicity over information density (mobile paradigm).
 *
 * @param props - Component props
 * @param props.deviceId - Router UUID
 * @param props.className - Optional custom CSS classes
 * @returns Mobile presenter JSX
 */
export declare const InterfaceGridMobile: import("react").NamedExoticComponent<InterfaceGridProps>;
//# sourceMappingURL=InterfaceGrid.Mobile.d.ts.map