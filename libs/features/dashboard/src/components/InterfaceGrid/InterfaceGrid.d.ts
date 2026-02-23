/**
 * InterfaceGrid Component
 *
 * Displays a responsive grid of network interface status cards.
 * Uses Headless + Platform Presenters pattern (ADR-018) with auto-detection wrapper.
 *
 * Features:
 * - Real-time interface status updates via GraphQL subscriptions
 * - Responsive grid layout: 4-col desktop, 3-col tablet, 2-col mobile
 * - Show all / Show less toggle for >8 interfaces
 * - Loading skeleton, error, and empty states
 * - Interface detail sheet for viewing/managing individual interfaces
 * - WCAG AAA accessible with keyboard navigation support
 *
 * @example
 * ```tsx
 * // Auto-detect platform (mobile/tablet/desktop)
 * <InterfaceGrid deviceId="router-123" />
 *
 * // With custom className
 * <InterfaceGrid deviceId="router-123" className="mt-4" />
 * ```
 *
 * @see libs/ui/patterns/platform-presenter-guide.md for platform presenter pattern
 * @see ADR-018 in architecture docs for Headless + Presenter design
 */
import type { InterfaceGridProps } from './types';
/**
 * Interface grid component with platform-specific layout.
 * Auto-detects platform using `usePlatform()` and renders appropriate presenter.
 *
 * @param props - Component props
 * @param props.deviceId - Router device UUID
 * @param props.className - Optional custom CSS classes (merged with platform defaults)
 * @returns Platform-specific presenter component (Mobile/Tablet/Desktop)
 *
 * @example
 * <InterfaceGrid deviceId="uuid-123" />
 */
export declare const InterfaceGrid: import("react").NamedExoticComponent<InterfaceGridProps>;
export default InterfaceGrid;
//# sourceMappingURL=InterfaceGrid.d.ts.map