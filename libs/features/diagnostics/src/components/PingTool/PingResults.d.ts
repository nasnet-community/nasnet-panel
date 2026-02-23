/**
 * PingResults Component
 *
 * Displays streaming ping results in a virtualized list with intelligent auto-scroll.
 *
 * Features:
 * - Virtualized rendering for 100+ results (uses @tanstack/react-virtual)
 * - Auto-scroll to latest result with pause detection (scroll lock preserves position)
 * - Color-coded results: success (green <100ms), warning (amber <200ms), error (red >=200ms)
 * - Monospace font for latency values and IP addresses (typography standard)
 * - Semantic color tokens: success, warning, destructive
 * - ARIA live region for screen reader announcements
 * - Scroll-to-bottom button appears when new results arrive (not at bottom)
 *
 * WCAG AAA Compliance:
 * - 7:1 contrast ratio on all text
 * - Semantic color + text indicator (not color alone)
 * - Font-mono for technical data (IPs, latency)
 * - ARIA live region with aria-relevant="additions"
 * - Accessible scroll-to-bottom button with aria-label
 *
 * Performance:
 * - Virtualizer with 24px per row + 10 item overscan
 * - React.memo to skip re-renders when props unchanged
 * - Auto-scroll calculation optimized (checks bottom 100px threshold)
 *
 * @example
 * ```tsx
 * <PingResults
 *   results={[
 *     { seq: 1, time: 12.5, bytes: 56, ttl: 52, target: '8.8.8.8', error: undefined },
 *     { seq: 2, time: null, error: 'timeout', target: '8.8.8.8' },
 *   ]}
 * />
 * ```
 *
 * @see useAutoScroll for scroll-lock behavior
 * @see @tanstack/react-virtual for virtualization
 */
import type { PingResult } from './PingTool.types';
/**
 * Props for PingResults component
 * @interface PingResultsProps
 */
export interface PingResultsProps {
    /** Array of ping results to display, ordered by sequence number */
    results: PingResult[];
    /** Optional additional CSS classes for wrapper container */
    className?: string;
}
/**
 * PingResults - Virtualized streaming results list
 *
 * Displays ping results with intelligent auto-scroll and semantic color coding.
 * Optimized for streaming results (100+ items) with virtualization.
 *
 * @param props - Component props (results array, optional className)
 * @returns Virtualized scrollable results container with auto-scroll button
 */
export declare const PingResults: import("react").NamedExoticComponent<PingResultsProps>;
//# sourceMappingURL=PingResults.d.ts.map