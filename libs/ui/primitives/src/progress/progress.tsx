'use client';

import * as React from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '../lib/utils';

/**
 * Progress bar component for showing operation progress or percentages.
 * Built on Radix UI Progress primitive with full accessibility support.
 *
 * Supports three sizes:
 * - sm: h-1 (4px) — Compact, inline usage
 * - md: h-2 (8px) — Default, standard usage
 * - lg: h-3 (12px) — Large, prominent display
 *
 * @example
 * <Progress value={65} size="md" />
 *
 * @example
 * <Progress value={75} max={100} size="lg" aria-label="Download progress" />
 *
 * @example
 * <Progress indeterminate size="sm" /> // For loading states without progress
 */
export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Size variant of the progress bar */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show indeterminate (loading) animation */
  indeterminate?: boolean;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const Progress = React.memo(
  React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    ({ className, value = 0, size = 'md', indeterminate = false, ...props }, ref) => (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'bg-muted relative w-full overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        value={indeterminate ? undefined : value}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'bg-primary h-full flex-1 transition-all duration-500',
            indeterminate && 'animate-progress'
          )}
          style={indeterminate ? undefined : { transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    )
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
