/**
 * ResourceUsageBar Desktop Presenter
 *
 * Compact presenter optimized for desktop/larger screens.
 * Features:
 * - h-2 height (8px) with rounded-full border radius
 * - Inline horizontal layout
 * - Information-dense display
 * - Hover states for interactivity
 * - semantic color tokens (success, warning, error)
 */

import * as React from 'react';

import { AlertCircle, AlertTriangle, Check, Circle, HelpCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { useResourceUsageBar } from './useResourceUsageBar';

import type { ResourceUsageBarProps, UsageStatus } from './types';

// ===== Constants =====

/**
 * Status icon mapping
 */
const STATUS_ICONS: Record<UsageStatus, typeof Circle> = {
  idle: Circle,
  normal: Check,
  warning: AlertTriangle,
  critical: AlertTriangle,
  danger: AlertCircle,
  unknown: HelpCircle,
};

/**
 * Status color classes (semantic tokens)
 * Uses: success (green), warning (amber), error (red), muted (gray)
 */
const STATUS_COLORS: Record<
  UsageStatus,
  { bg: string; fill: string; text: string; icon: string }
> = {
  idle: {
    bg: 'bg-muted',
    fill: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
  normal: {
    bg: 'bg-success-light',
    fill: 'bg-success',
    text: 'text-success-dark',
    icon: 'text-success',
  },
  warning: {
    bg: 'bg-warning-light',
    fill: 'bg-warning',
    text: 'text-warning-dark',
    icon: 'text-warning',
  },
  critical: {
    bg: 'bg-warning-light',
    fill: 'bg-warning',
    text: 'text-warning-dark',
    icon: 'text-warning',
  },
  danger: {
    bg: 'bg-error-light',
    fill: 'bg-error',
    text: 'text-error-dark',
    icon: 'text-error',
  },
  unknown: {
    bg: 'bg-muted',
    fill: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
};

// ===== Component =====

/**
 * Desktop presenter for ResourceUsageBar
 *
 * Compact, information-dense display optimized for larger screens.
 * Uses horizontal inline layout.
 */
function ResourceUsageBarDesktopBase(props: ResourceUsageBarProps) {
  const { showValues = true, className } = props;
  const state = useResourceUsageBar(props);

  const colors = STATUS_COLORS[state.status];
  const Icon = STATUS_ICONS[state.status];

  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="region"
      aria-label={state.label}
    >
      {/* Label and Icon */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <Icon className={cn('h-3.5 w-3.5', colors.icon)} aria-label={state.statusLabel} />
        <span className="text-sm font-medium text-foreground">{state.label}</span>
      </div>

      {/* Progress Bar - h-2 (8px) rounded-full */}
      <div className="flex-1 min-w-[120px]">
        <div
          className={cn(
            'relative h-2 w-full rounded-full overflow-hidden',
            colors.bg,
            'transition-all duration-200'
          )}
          role="progressbar"
          aria-label={state.ariaLabel}
          aria-valuenow={state.ariaValueNow}
          aria-valuemin={state.ariaValueMin}
          aria-valuemax={state.ariaValueMax}
          aria-valuetext={state.ariaValueText}
        >
          {/* Fill - rounded-full to match track */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colors.fill
            )}
            style={{ width: `${state.percentage}%` }}
          />
        </div>
      </div>

      {/* Values Display */}
      {showValues && (
        <div className="flex items-center gap-2 min-w-[160px] text-xs">
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">Used</span>
            <span className={cn('font-medium font-mono', colors.text)}>
              {state.usedText}
            </span>
          </div>
          <span className="text-muted-foreground">/</span>
          <div className="flex flex-col items-start">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium font-mono text-foreground">
              {state.totalText}
            </span>
          </div>
        </div>
      )}

      {/* Screen reader status announcement */}
      <span className="sr-only">
        {state.label} status: {state.statusLabel}. {state.ariaValueText}.
      </span>
    </div>
  );
}

export const ResourceUsageBarDesktop = React.memo(ResourceUsageBarDesktopBase);

ResourceUsageBarDesktop.displayName = 'ResourceUsageBarDesktop';
