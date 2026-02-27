/**
 * Resource Health Indicator
 *
 * Displays the runtime health status of a resource.
 * Part of Universal State v2 Resource Model.
 *
 * Visual Spec:
 * - Compact: inline-flex items-center gap-1.5
 * - Dot: h-2.5 w-2.5 rounded-full (status color)
 * - Text: text-xs font-medium
 * - Healthy: text-success
 * - Warning: text-warning
 * - Critical: text-error
 *
 * @see NAS-4.7: Universal State v2 Resource Model
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import type { RuntimeState } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// Dot Variants
// ============================================================================

const healthDotVariants = cva(
  'inline-block rounded-full',
  {
    variants: {
      health: {
        HEALTHY: 'bg-success',
        WARNING: 'bg-warning',
        DEGRADED: 'bg-warning',
        CRITICAL: 'bg-error',
        FAILED: 'bg-error',
        UNKNOWN: 'bg-muted-foreground',
      },
      size: {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
      },
      pulse: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      health: 'UNKNOWN',
      size: 'md',
      pulse: false,
    },
  }
);

const healthLabelVariants = cva(
  'text-xs font-medium',
  {
    variants: {
      health: {
        HEALTHY: 'text-success',
        WARNING: 'text-warning',
        DEGRADED: 'text-warning',
        CRITICAL: 'text-error',
        FAILED: 'text-error',
        UNKNOWN: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      health: 'UNKNOWN',
    },
  }
);

// ============================================================================
// Health Display Info
// ============================================================================

const HEALTH_INFO: Record<
  RuntimeState['health'],
  { label: string; description: string }
> = {
  HEALTHY: {
    label: 'Healthy',
    description: 'Resource is running normally',
  },
  WARNING: {
    label: 'Warning',
    description: 'Resource is running with warnings',
  },
  DEGRADED: {
    label: 'Degraded',
    description: 'Resource is running with issues',
  },
  CRITICAL: {
    label: 'Critical',
    description: 'Resource is in critical state',
  },
  FAILED: {
    label: 'Failed',
    description: 'Resource has critical issues',
  },
  UNKNOWN: {
    label: 'Unknown',
    description: 'Health status is unavailable',
  },
};

// ============================================================================
// Component
// ============================================================================

export interface ResourceHealthIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof healthDotVariants>, 'health'> {
  /** Runtime health status */
  health: RuntimeState['health'] | undefined | null;
  /** Show label next to dot */
  showLabel?: boolean;
  /** Custom label override */
  label?: string;
  /** Show pulse animation for active states */
  animate?: boolean;
  /** Layout direction */
  direction?: 'row' | 'column';
}

export const ResourceHealthIndicator = React.forwardRef<
  HTMLDivElement,
  ResourceHealthIndicatorProps
>(
  (
    {
      className,
      health,
      size,
      showLabel = false,
      label,
      animate = false,
      direction = 'row',
      ...props
    },
    ref
  ) => {
    const resolvedHealth = health ?? 'UNKNOWN';
    const info = HEALTH_INFO[resolvedHealth];
    const displayLabel = label ?? info.label;
    const shouldPulse = animate && resolvedHealth === 'HEALTHY';

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center',
          direction === 'row' ? 'gap-1.5' : 'flex-col gap-1',
          className
        )}
        title={info.description}
        {...props}
      >
        <span
          className={cn(
            healthDotVariants({
              health: resolvedHealth,
              size,
              pulse: shouldPulse,
            })
          )}
          aria-hidden="true"
        />
        {showLabel && (
          <span className={healthLabelVariants({ health: resolvedHealth })}>
            {displayLabel}
          </span>
        )}
      </div>
    );
  }
);

ResourceHealthIndicator.displayName = 'ResourceHealthIndicator';

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Inline health indicator with dot and label
 */
export const ResourceHealthBadge = React.memo(
  (props: Omit<ResourceHealthIndicatorProps, 'showLabel' | 'direction'>) => (
    <ResourceHealthIndicator {...props} showLabel direction="row" />
  )
);

ResourceHealthBadge.displayName = 'ResourceHealthBadge';

/**
 * Compact health dot only
 */
export const ResourceHealthDot = React.memo(
  (props: Omit<ResourceHealthIndicatorProps, 'showLabel' | 'direction'>) => (
    <ResourceHealthIndicator {...props} showLabel={false} direction="row" />
  )
);

ResourceHealthDot.displayName = 'ResourceHealthDot';

export { healthDotVariants, healthLabelVariants };
export default ResourceHealthIndicator;
