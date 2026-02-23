/**
 * BandwidthChartDesktop - Desktop presenter for bandwidth chart
 * 300px height, full controls, hover tooltips
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 */
import type { BandwidthChartPresenterProps } from './types';
/**
 * BandwidthChartDesktop component
 *
 * @description
 * Desktop presenter with 300px chart height, full controls always visible,
 * hover-activated tooltips, and screen reader accessible data table.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param props - Component props with optional hook override for testing
 */
export declare const BandwidthChartDesktop: import("react").NamedExoticComponent<BandwidthChartPresenterProps>;
//# sourceMappingURL=BandwidthChartDesktop.d.ts.map