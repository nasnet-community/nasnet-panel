/**
 * InterfaceGrid Tablet Presenter
 *
 * Tablet-optimized 3-column grid layout for interface status cards.
 * Balances information density with touch-friendly interaction.
 *
 * Features:
 * - 3-column responsive grid (tablet breakpoint 640–1024px)
 * - 38–44px touch targets (WCAG AAA compliance)
 * - Balanced information density between mobile and desktop
 * - Show all / Show less toggle for >8 interfaces
 * - Loading skeleton state (3 card skeletons)
 * - Error state with actionable retry button
 * - Empty state with helpful icon and messaging
 * - Sheet overlay for interface details
 *
 * @see InterfaceGrid.tsx for auto-detection wrapper
 * @see InterfaceGrid.Desktop.tsx for 4-column variant
 * @see InterfaceGrid.Mobile.tsx for 2-column variant
 */
import type { InterfaceGridProps } from './types';
/**
 * Tablet presenter for InterfaceGrid.
 *
 * Renders a 3-column grid optimized for tablets with balanced density.
 * Bridges mobile simplicity and desktop power-user features (tablet paradigm).
 *
 * @param props - Component props
 * @param props.deviceId - Router UUID
 * @param props.className - Optional custom CSS classes
 * @returns Tablet presenter JSX
 */
export declare const InterfaceGridTablet: import("react").NamedExoticComponent<InterfaceGridProps>;
//# sourceMappingURL=InterfaceGrid.Tablet.d.ts.map