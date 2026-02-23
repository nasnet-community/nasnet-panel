/**
 * InterfaceGrid Desktop Presenter
 *
 * Desktop-optimized 4-column grid layout for interface status cards.
 * Displays full feature set with all interface details visible without expand.
 *
 * Features:
 * - 4-column responsive grid (pro-grade density)
 * - Show all / Show less toggle for >8 interfaces (pagination UI)
 * - Loading skeleton state (4 card skeletons)
 * - Error state with actionable retry button
 * - Empty state with helpful icon and messaging
 * - WCAG AAA keyboard navigation (grid with list semantics)
 * - Clickable cards with detail sheet overlay
 *
 * @see InterfaceGrid.tsx for auto-detection wrapper
 * @see InterfaceGrid.Mobile.tsx for 2-column variant
 * @see InterfaceGrid.Tablet.tsx for 3-column variant
 */
import type { InterfaceGridProps } from './types';
/**
 * Desktop presenter for InterfaceGrid.
 *
 * Renders a 4-column grid optimized for power users with dense information layout.
 * All interface details visible without expand/collapse (desktop paradigm).
 *
 * @param props - Component props
 * @param props.deviceId - Router UUID
 * @param props.className - Optional custom CSS classes
 * @returns Desktop presenter JSX
 */
export declare const InterfaceGridDesktop: import("react").NamedExoticComponent<InterfaceGridProps>;
//# sourceMappingURL=InterfaceGrid.Desktop.d.ts.map