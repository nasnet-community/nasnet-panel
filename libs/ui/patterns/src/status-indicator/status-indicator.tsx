/**
 * Status Indicator Component
 *
 * Compact inline status indicator with color-coded dot and optional label.
 * Supports five semantic statuses, three sizes, and optional pulse animation.
 *
 * @module @nasnet/ui/patterns/status-indicator
 * @example
 * ```tsx
 * <StatusIndicator status="online" label="Connected" />
 * <StatusIndicator status="offline" size="lg" showDot />
 * <StatusIndicator status="warning" pulse />
 * ```
 */

import * as React from 'react';
import { useMemo } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@nasnet/ui/primitives';

const statusIndicatorVariants = cva(
  'inline-flex items-center gap-2 text-sm font-medium transition-colors',
  {
    variants: {
      status: {
        online: 'text-success',
        offline: 'text-error',
        warning: 'text-warning',
        info: 'text-info',
        pending: 'text-muted-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'info',
      size: 'md',
    },
  }
);

const dotVariants = cva('rounded-full transition-all', {
  variants: {
    status: {
      online: 'bg-success',
      offline: 'bg-error',
      warning: 'bg-warning',
      info: 'bg-info',
      pending: 'bg-muted-foreground',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-3 w-3',
    },
    pulse: {
      true: 'animate-pulse-glow',
      false: '',
    },
  },
  defaultVariants: {
    status: 'info',
    size: 'md',
    pulse: false,
  },
});

/**
 * StatusIndicator component props
 */
export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  /** Optional text label shown next to the dot */
  label?: string;
  /** Whether to show the colored status dot (default: true) */
  showDot?: boolean;
  /** Animate the dot with a pulsing glow effect (useful for live/active states) */
  pulse?: boolean;
}

/**
 * StatusIndicator Component
 *
 * Compact inline status indicator with color-coded dot and optional label.
 * Perfect for dashboards, tables, and status displays.
 */
const StatusIndicatorBase = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, label, showDot = true, pulse = false, ...props }, ref) => {
    const containerClassName = useMemo(
      () => cn(statusIndicatorVariants({ status, size }), className),
      [status, size, className]
    );

    const dotClassName = useMemo(
      () => cn(dotVariants({ status, size, pulse })),
      [status, size, pulse]
    );

    return (
      <div
        ref={ref}
        role="status"
        className={containerClassName}
        {...props}
      >
        {showDot && (
          <span
            className={dotClassName}
            aria-hidden="true"
          />
        )}
        {label && <span>{label}</span>}
      </div>
    );
  }
);

StatusIndicatorBase.displayName = 'StatusIndicator';

/**
 * Memoized StatusIndicator component
 */
export const StatusIndicator = React.memo(StatusIndicatorBase);

/**
 * Status indicator variant styles from CVA
 * Exported for external use in other components
 */
export { statusIndicatorVariants };
