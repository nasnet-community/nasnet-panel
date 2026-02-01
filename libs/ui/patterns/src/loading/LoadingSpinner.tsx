/**
 * LoadingSpinner Component
 *
 * Standalone loading spinner with optional label and size variants.
 * Pattern-level wrapper around the primitive Spinner with additional features.
 *
 * @module @nasnet/ui/patterns/loading
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';
import { Spinner, type SpinnerProps } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// LoadingSpinner Component
// ============================================================================

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
export function LoadingSpinner({
  label = 'Loading...',
  showLabel = false,
  orientation = 'vertical',
  centered = false,
  padded = false,
  size = 'md',
  className,
  containerClassName,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        'inline-flex',
        orientation === 'vertical' ? 'flex-col items-center' : 'flex-row items-center gap-2',
        centered && 'w-full justify-center',
        padded && 'p-4',
        containerClassName
      )}
    >
      <Spinner size={size} className={className} {...props} />

      {showLabel && (
        <span
          className={cn(
            'text-muted-foreground',
            orientation === 'vertical' ? 'mt-2' : '',
            size === 'sm' || size === 'xs' ? 'text-xs' : 'text-sm'
          )}
        >
          {label}
        </span>
      )}

      {/* Screen reader only label when not showing visual label */}
      {!showLabel && <span className="sr-only">{label}</span>}
    </div>
  );
}

LoadingSpinner.displayName = 'LoadingSpinner';
