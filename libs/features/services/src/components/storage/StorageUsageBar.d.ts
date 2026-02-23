/**
 * StorageUsageBar Component
 * @description Visual progress bar with color-coded thresholds for storage usage.
 * Displays current usage percentage, formatted capacity values, and status indicators.
 *
 * @features
 * - Color-coded thresholds: Green (<80%), Amber (80-89%), Red (90%+)
 * - BigInt formatting for precise large values
 * - Smooth CSS transitions for updates
 * - Full keyboard and screen reader support
 * - Responsive spacing and typography
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md - section 4 (Typography)
 */
import * as React from 'react';
/**
 * StorageUsageBar component props
 */
export interface StorageUsageBarProps {
    /** Usage percentage (0-100). Values outside range are clamped. */
    usagePercent: number;
    /** Total capacity in bytes (serialized uint64 as string) */
    totalBytes: string;
    /** Used capacity in bytes (serialized uint64 as string) */
    usedBytes: string;
    /** Optional free bytes (if not provided, calculated as total - used) */
    freeBytes?: string;
    /** Show warning styling (red) even if percentage below 90% threshold */
    showWarning?: boolean;
    /** Optional CSS class name for custom styling */
    className?: string;
}
/**
 * StorageUsageBar component
 * @description Displays storage usage with color-coded progress bar and capacity details
 * @param {StorageUsageBarProps} props - Component props
 * @returns {React.ReactNode} Rendered storage usage indicator
 */
declare function StorageUsageBarComponent({ usagePercent, totalBytes, usedBytes, freeBytes, showWarning, className, }: StorageUsageBarProps): import("react/jsx-runtime").JSX.Element;
/**
 * Exported StorageUsageBar with React.memo() optimization
 */
export declare const StorageUsageBar: React.MemoExoticComponent<typeof StorageUsageBarComponent>;
export {};
//# sourceMappingURL=StorageUsageBar.d.ts.map