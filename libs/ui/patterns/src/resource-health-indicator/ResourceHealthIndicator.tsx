/**
 * Resource Health Indicator
 *
 * Displays the runtime health status of a resource.
 * Part of Universal State v2 Resource Model.
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
        DEGRADED: 'bg-warning',
        CRITICAL: 'bg-error',
        UNKNOWN: 'bg-slate-400 dark:bg-slate-600',
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
        DEGRADED: 'text-warning',
        CRITICAL: 'text-error',
        UNKNOWN: 'text-slate-500 dark:text-slate-400',
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
  DEGRADED: {
    label: 'Degraded',
    description: 'Resource is running with issues',
  },
  CRITICAL: {
    label: 'Critical',
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
          direction === 'row' ? 'gap-2' : 'flex-col gap-1',
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
export const ResourceHealthBadge: React.FC<
  Omit<ResourceHealthIndicatorProps, 'showLabel' | 'direction'>
> = (props) => <ResourceHealthIndicator {...props} showLabel direction="row" />;

/**
 * Compact health dot only
 */
export const ResourceHealthDot: React.FC<
  Omit<ResourceHealthIndicatorProps, 'showLabel' | 'direction'>
> = (props) => (
  <ResourceHealthIndicator {...props} showLabel={false} direction="row" />
);

export { healthDotVariants, healthLabelVariants };
export default ResourceHealthIndicator;
