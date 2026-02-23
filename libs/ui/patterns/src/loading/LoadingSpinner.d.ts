/**
 * LoadingSpinner Component
 *
 * Standalone loading spinner with optional label and size variants.
 * Pattern-level wrapper around the primitive Spinner with additional features.
 *
 * @module @nasnet/ui/patterns/loading
 */
import { type SpinnerProps } from '@nasnet/ui/primitives';
export interface LoadingSpinnerProps extends Omit<SpinnerProps, 'label'> {
    /** Text label to display below the spinner */
    label?: string;
    /** Show the label */
    showLabel?: boolean;
    /** Orientation of the spinner and label */
    orientation?: 'vertical' | 'horizontal';
    /** Center the spinner in its container */
    centered?: boolean;
    /** Add padding around the spinner */
    padded?: boolean;
    /** Additional CSS classes for the container */
    containerClassName?: string;
}
/**
 * LoadingSpinner Component
 *
 * A pattern-level spinner component with label and layout options.
 *
 * @example
 * ```tsx
 * // Simple spinner
 * <LoadingSpinner />
 *
 * // With label
 * <LoadingSpinner label="Fetching data..." showLabel />
 *
 * // Centered in container
 * <LoadingSpinner centered padded size="lg" />
 *
 * // Horizontal layout
 * <LoadingSpinner label="Loading..." showLabel orientation="horizontal" />
 * ```
 */
export declare function LoadingSpinner({ label, showLabel, orientation, centered, padded, size, className, containerClassName, ...props }: LoadingSpinnerProps): import("react/jsx-runtime").JSX.Element;
export declare namespace LoadingSpinner {
    var displayName: string;
}
//# sourceMappingURL=LoadingSpinner.d.ts.map