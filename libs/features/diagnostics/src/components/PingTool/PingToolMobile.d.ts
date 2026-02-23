/**
 * PingToolMobile - Mobile Presenter for Ping Diagnostic Tool
 *
 * Progressive disclosure layout with form on main screen and
 * results in a full-screen bottom sheet (90vh).
 *
 * WCAG AAA Compliance:
 * - 44x44px minimum touch targets (all buttons)
 * - 8px minimum spacing between touch targets
 * - Full-screen sheet for better mobile UX (not floating modal)
 * - Semantic color tokens
 * - ARIA live regions for results
 * - Monospace font for IPs and latency
 */
import type { PingToolProps } from './PingTool.types';
/**
 * PingToolMobile - Mobile presenter component
 *
 * Progressive disclosure layout optimized for touch (<640px):
 * - Main view: Form with essential fields (target, count, timeout)
 * - Bottom sheet: Full results, graph, and stats (triggered by button)
 *
 * Performance optimizations:
 * - useCallback for form submission
 * - React.memo to prevent unnecessary re-renders
 * - Lazy-loaded bottom sheet (only renders when needed)
 * - Virtualized results list (100+ results supported)
 *
 * @param props - Component props (routerId, onComplete, onError callbacks)
 * @returns Mobile layout presenter
 */
export declare const PingToolMobile: import("react").NamedExoticComponent<PingToolProps>;
//# sourceMappingURL=PingToolMobile.d.ts.map