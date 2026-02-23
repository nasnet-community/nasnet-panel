/**
 * PingToolDesktop - Desktop Presenter for Ping Diagnostic Tool
 *
 * Dense side-by-side layout optimized for desktop screens (>1024px).
 * - Left column: form with all advanced options visible
 * - Right column: results, latency graph, and statistics
 *
 * WCAG AAA Compliance:
 * - 7:1 contrast ratio on all text
 * - 32-38px touch/click targets for buttons
 * - IP addresses and latency in monospace font (font-mono)
 * - Semantic color tokens (success/warning/destructive)
 * - ARIA live regions for dynamic results
 * - Keyboard accessible form with proper labels
 */
import type { PingToolProps } from './PingTool.types';
/**
 * PingToolDesktop - Desktop presenter component
 *
 * Grid layout with dense information display:
 * - Left: Ping form (40% width) with all advanced options visible
 * - Right: Streaming results (60% width) with graph and stats below
 *
 * Performance optimizations:
 * - useCallback for form submission to prevent unnecessary re-renders
 * - React.memo to skip re-renders when props unchanged
 * - Stable form schema validation
 * - Virtualized results list for 100+ items
 *
 * @param props - Component props (routerId, onComplete, onError callbacks)
 * @returns Desktop layout presenter
 */
export declare const PingToolDesktop: import("react").NamedExoticComponent<PingToolProps>;
//# sourceMappingURL=PingToolDesktop.d.ts.map