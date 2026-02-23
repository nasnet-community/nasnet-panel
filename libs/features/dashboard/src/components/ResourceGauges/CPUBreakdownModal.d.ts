/**
 * CPUBreakdownModal Component
 * Displays per-core CPU usage in a modal dialog
 *
 * AC 5.2.4: Click CPU gauge to see breakdown of usage per core
 * - Shows horizontal bar chart for each core
 * - Displays core frequency if available
 * - Accessible modal with focus trap and ESC to close
 *
 * @example
 * ```tsx
 * <CPUBreakdownModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   perCoreUsage={[45, 52, 48, 51]}
 *   overallUsage={49}
 *   frequency={2400}
 * />
 * ```
 */
import React from 'react';
/**
 * CPUBreakdownModal props
 */
export interface CPUBreakdownModalProps {
    /** Whether modal is open */
    open: boolean;
    /** Callback to close modal */
    onOpenChange: (open: boolean) => void;
    /** Array of per-core usage percentages */
    perCoreUsage: number[];
    /** Overall CPU usage percentage */
    overallUsage: number;
    /** CPU frequency in MHz (optional) */
    frequency?: number;
    /** Additional CSS classes */
    className?: string;
}
/**
 * CPUBreakdownModal Component
 *
 * Renders a dialog showing:
 * - Per-core CPU usage as horizontal bars
 * - Overall CPU usage summary
 * - CPU frequency if available
 *
 * WCAG AAA compliant:
 * - 7:1 contrast ratio maintained
 * - Role="meter" ARIA attributes on progress bars
 * - Keyboard accessible (ESC to close)
 * - Screen reader support for core metrics
 */
declare const CPUBreakdownModal: React.NamedExoticComponent<CPUBreakdownModalProps>;
export { CPUBreakdownModal };
//# sourceMappingURL=CPUBreakdownModal.d.ts.map