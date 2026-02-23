/**
 * ResourceUsageBar Component
 *
 * Displays resource usage (memory, CPU, disk, etc.) with platform-adaptive presentation.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Features:
 * - Automatic platform detection (mobile vs desktop)
 * - Threshold-based color coding (idle, normal, warning, critical, danger)
 * - WCAG AAA accessible (7:1 contrast, progressbar role, ARIA labels)
 * - Semantic color tokens (not primitives)
 * - Icon + color indicators (not color alone)
 */
import * as React from 'react';
import { ResourceUsageBarDesktop } from './ResourceUsageBarDesktop';
import { ResourceUsageBarMobile } from './ResourceUsageBarMobile';
import type { ResourceUsageBarProps } from './types';
/**
 * ResourceUsageBar Component
 *
 * Shows resource usage with a progress bar and status indicators.
 * Auto-detects mobile vs desktop based on screen width.
 *
 * **Thresholds:**
 * - 0% = idle (gray)
 * - <60% = normal (green)
 * - 60-79% = warning (amber)
 * - 80-94% = critical (orange)
 * - ≥95% = danger (red)
 *
 * **Accessibility:**
 * - Uses `role="progressbar"` with ARIA attributes
 * - 7:1 contrast ratio (WCAG AAA)
 * - Icon + color indicators (not color alone)
 * - Screen reader announcements
 *
 * @example
 * ```tsx
 * // Auto-detect platform
 * <ResourceUsageBar used={512} total={1024} resourceType="memory" />
 *
 * // Force mobile variant
 * <ResourceUsageBar
 *   used={750}
 *   total={1000}
 *   variant="mobile"
 *   resourceType="cpu"
 *   unit="%"
 * />
 *
 * // Custom thresholds
 * <ResourceUsageBar
 *   used={85}
 *   total={100}
 *   resourceType="disk"
 *   unit="GB"
 *   thresholds={{ normal: 50, warning: 70, critical: 90 }}
 * />
 *
 * // Hide values, show percentage only
 * <ResourceUsageBar
 *   used={256}
 *   total={512}
 *   showValues={false}
 *   showPercentage={true}
 * />
 * ```
 */
declare function ResourceUsageBarBase(props: ResourceUsageBarProps): import("react/jsx-runtime").JSX.Element;
export declare const ResourceUsageBar: React.MemoExoticComponent<typeof ResourceUsageBarBase>;
export { ResourceUsageBarMobile, ResourceUsageBarDesktop };
export * from './types';
export { useResourceUsageBar } from './useResourceUsageBar';
export type { UseResourceUsageBarReturn } from './useResourceUsageBar';
//# sourceMappingURL=ResourceUsageBar.d.ts.map