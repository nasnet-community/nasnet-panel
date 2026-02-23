/**
 * CustomTooltip - Custom Recharts tooltip for bandwidth chart
 * Displays timestamp, rates (TX/RX), and total bytes (AC 5.5.3)
 * @description
 * Renders an accessible tooltip with bandwidth metrics. Shows TX/RX rates with
 * color-coded indicators and total bytes. WCAG AAA compliant with proper contrast,
 * semantic HTML, and screen reader support via aria-live updates.
 * @example
 * <CustomTooltip active={true} payload={[...]} label={timestamp} />
 */
import type { CustomTooltipProps } from './types';
/**
 * CustomTooltip component for Recharts
 *
 * Requirements (AC 5.5.3):
 * - Timestamp (e.g., "14:35:22")
 * - TX rate (e.g., "2.5 Mbps")
 * - RX rate (e.g., "15.2 Mbps")
 * - TX bytes total (e.g., "450 MB")
 * - RX bytes total (e.g., "2.1 GB")
 *
 * Accessibility features:
 * - role="tooltip" for semantic structure
 * - aria-live="polite" for screen reader announcements
 * - 7:1 contrast ratio for WCAG AAA compliance
 * - Color paired with text labels (not sole identifier)
 *
 * @param props - Recharts tooltip props with active state, payload, and label
 */
export declare const CustomTooltip: import("react").NamedExoticComponent<CustomTooltipProps>;
//# sourceMappingURL=CustomTooltip.d.ts.map