/**
 * ProgressBar Component
 *
 * Progress indicator for long-running operations with percentage display.
 * Supports determinate and indeterminate states.
 *
 * Accessibility:
 * - Uses role="progressbar" with proper ARIA attributes
 * - Announces progress changes via aria-live
 * - Supports both determinate and indeterminate states
 *
 * @module @nasnet/ui/patterns/loading
 */
import * as React from 'react';
export interface ProgressBarProps {
    /** Progress value (0-100). If undefined, shows indeterminate state */
    value?: number;
    /** Label text to display above the progress bar */
    label?: string;
    /** Show percentage text */
    showPercentage?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Color variant */
    variant?: 'default' | 'success' | 'warning' | 'error';
    /** Additional description below the progress bar */
    description?: string;
    /** Whether operation is cancellable */
    onCancel?: () => void;
    /** Custom cancel button text */
    cancelText?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ProgressBar Component
 *
 * Displays progress for long-running operations.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressBar value={75} />
 *
 * // With label and percentage
 * <ProgressBar
 *   value={45}
 *   label="Uploading files"
 *   showPercentage
 * />
 *
 * // With cancel button
 * <ProgressBar
 *   value={30}
 *   label="Processing..."
 *   onCancel={() => cancelOperation()}
 * />
 *
 * // Indeterminate (no value)
 * <ProgressBar label="Loading..." />
 * ```
 */
export declare const ProgressBar: React.NamedExoticComponent<ProgressBarProps>;
//# sourceMappingURL=ProgressBar.d.ts.map