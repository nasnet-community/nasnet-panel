/**
 * CounterCellDesktop Component
 * Desktop presenter for counter visualization
 *
 * ADR-018: Headless + Platform Presenters
 */
import type { CounterCellProps } from './CounterCell';
/**
 * Desktop Presenter for CounterCell
 *
 * Displays counter statistics in a horizontal layout:
 * - Packets count | Bytes formatted | Rate (if enabled) | Progress bar (if enabled)
 * - Dense layout optimized for data tables
 * - Animated counters (respects prefers-reduced-motion)
 */
export declare const CounterCellDesktop: import("react").NamedExoticComponent<CounterCellProps>;
//# sourceMappingURL=CounterCellDesktop.d.ts.map