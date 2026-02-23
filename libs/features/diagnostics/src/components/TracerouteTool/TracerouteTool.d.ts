/**
 * TracerouteTool - Main Component with Platform Detection
 *
 * Auto-detecting wrapper that selects appropriate presenter based on platform.
 * Uses Headless + Platform Presenters pattern (ADR-018).
 */
import type { TracerouteToolProps } from './TracerouteTool.types';
/**
 * TracerouteTool - Platform-adaptive traceroute diagnostic tool
 *
 * Automatically selects desktop or mobile presenter based on screen size.
 * - Mobile (<640px): Stacked layout with bottom sheet results
 * - Tablet/Desktop (>=640px): Side-by-side layout with real-time hop visualization
 *
 * Features:
 * - Real-time hop discovery via WebSocket subscription
 * - Progressive network path visualization
 * - Latency color-coding (green <50ms, yellow 50-150ms, red >150ms)
 * - Export results to JSON/text
 * - Keyboard shortcuts (Enter to run, Esc to cancel)
 * - WCAG AAA accessible
 *
 * @example
 * ```tsx
 * <TracerouteTool
 *   routerId="router-123"
 *   onComplete={(result) => console.log('Traceroute complete!', result)}
 *   onError={(err) => console.error('Error:', err)}
 *   onHopDiscovered={(hop) => console.log('Hop discovered:', hop)}
 * />
 * ```
 */
export declare const TracerouteTool: import("react").NamedExoticComponent<TracerouteToolProps>;
//# sourceMappingURL=TracerouteTool.d.ts.map