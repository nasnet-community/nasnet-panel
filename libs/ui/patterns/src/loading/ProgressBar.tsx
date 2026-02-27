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

import { cn , Progress } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Size and color configurations
// ============================================================================

const sizeConfig = {
  sm: {
    bar: 'h-1',
    text: 'text-xs',
    spacing: 'gap-1',
  },
  md: {
    bar: 'h-2',
    text: 'text-sm',
    spacing: 'gap-1.5',
  },
  lg: {
    bar: 'h-3',
    text: 'text-base',
    spacing: 'gap-2',
  },
} as const;

const variantConfig = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
} as const;

// ============================================================================
// ProgressBar Component
// ============================================================================

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
export const ProgressBar = React.memo(function ProgressBar({
  value,
  label,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  description,
  onCancel,
  cancelText = 'Cancel',
  className,
}: ProgressBarProps) {
  const config = sizeConfig[size];
  const isIndeterminate = value === undefined;
  const normalizedValue = Math.min(100, Math.max(0, value ?? 0));

  return (
    <div className={cn('w-full flex flex-col', config.spacing, className)}>
      {/* Header row with label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className={cn('text-muted-foreground', config.text)}>
              {label}
            </span>
          )}
          {showPercentage && !isIndeterminate && (
            <span className={cn('font-medium text-foreground', config.text)}>
              {Math.round(normalizedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={cn(
          'w-full rounded-full bg-muted overflow-hidden',
          config.bar
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-in-out',
            variantConfig[variant],
            isIndeterminate && 'motion-safe:animate-progress w-1/3'
          )}
          style={!isIndeterminate ? { width: `${normalizedValue}%` } : undefined}
        />
      </div>

      {/* Footer row with description and cancel */}
      {(description || onCancel) && (
        <div className="flex items-center justify-between">
          {description && (
            <span className={cn('text-muted-foreground', sizeConfig.sm.text)}>
              {description}
            </span>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'text-muted-foreground hover:text-foreground',
                'underline underline-offset-2',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                sizeConfig.sm.text
              )}
            >
              {cancelText}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
