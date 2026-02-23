/**
 * BandwidthDataTable - Accessible tabular representation of bandwidth data
 *
 * @description
 * Provides screen reader-optimized table alternative to chart visualization.
 * Hidden visually by default (`sr-only`) but fully accessible to assistive
 * technologies. Includes timestamp, TX/RX rates (in bps, tabular-nums font),
 * and total transferred bytes. Limited to latest 50 points for readability.
 *
 * **Accessibility:** Table has semantic `<caption>`, `<thead>/<tbody>`,
 * `scope="col"` headers, and `role="region"` for easy navigation.
 * All numerical data uses `font-variant-numeric: tabular-nums` for alignment.
 *
 * **Design Tokens:** Uses semantic spacing and color tokens. Supports toggle
 * to make visible for users preferring tabular data via `data-visible=true`.
 *
 * @param props - Component props { dataPoints, timeRange, className? }
 * @param props.dataPoints - Array of bandwidth measurement points
 * @param props.timeRange - Current time range ('5m', '1h', '24h') for caption
 * @param props.className - Optional CSS class name
 *
 * @returns Memoized table component, screen-reader-only by default
 *
 * @example
 * ```tsx
 * <BandwidthDataTable
 *   dataPoints={historicalData}
 *   timeRange="1h"
 *   className="mt-4"
 * />
 * ```
 */
import type { BandwidthDataTableProps } from './types';
export declare const BandwidthDataTable: import("react").NamedExoticComponent<BandwidthDataTableProps>;
//# sourceMappingURL=BandwidthDataTable.d.ts.map