/**
 * ResourceUsageBar Mobile Presenter
 *
 * Touch-optimized presenter for small screens.
 * Features:
 * - 44px minimum height (touch target)
 * - Bold, high-contrast text
 * - Larger visual elements
 * - Vertical layout for values
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
 * Background, text, and border colors for each status
 */
const STATUS_COLORS: Record<
  UsageStatus,
  { bg: string; fill: string; text: string; border: string }
> = {
  idle: {
    bg: 'bg-muted',
    fill: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  normal: {
    bg: 'bg-success-light',
    fill: 'bg-success',
    text: 'text-success-dark',
    border: 'border-success',
  },
  warning: {
    bg: 'bg-warning-light',
    fill: 'bg-warning',
    text: 'text-warning-dark',
    border: 'border-warning',
  },
  critical: {
    bg: 'bg-warning-light',
    fill: 'bg-warning',
    text: 'text-warning-dark',
    border: 'border-warning',
  },
  danger: {
    bg: 'bg-error-light',
    fill: 'bg-error',
    text: 'text-error-dark',
    border: 'border-error',
  },
  unknown: {
    bg: 'bg-muted',
    fill: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

// ===== Component =====

/**
 * Mobile presenter for ResourceUsageBar
 *
 * Optimized for touch interaction and small screens.
 * Uses vertical layout with larger text and icons.
 */
function ResourceUsageBarMobileBase(props: ResourceUsageBarProps) {
  const { showValues = true, showPercentage = true, className } = props;
  const state = useResourceUsageBar(props);

  const colors = STATUS_COLORS[state.status];
  const Icon = STATUS_ICONS[state.status];

  return (
    <div
      className={cn('flex flex-col gap-3 p-3 rounded-lg', className)}
      role="region"
      aria-label={state.label}
    >
      {/* Header: Label and Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{state.label}</span>
          <Icon
            className={cn('h-4 w-4', colors.text)}
            aria-label={state.statusLabel}
          />
        </div>

        {showPercentage && (
          <span className={cn('text-base font-bold', colors.text)}>
            {state.percentageText}
          </span>
        )}
      </div>

      {/* Progress Bar - h-2 (8px) rounded-full with larger mobile container */}
      <div
        className={cn(
          'flex items-center gap-2 w-full',
          'transition-all duration-200'
        )}
        role="progressbar"
        aria-label={state.ariaLabel}
        aria-valuenow={state.ariaValueNow}
        aria-valuemin={state.ariaValueMin}
        aria-valuemax={state.ariaValueMax}
        aria-valuetext={state.ariaValueText}
      >
        {/* Track */}
        <div
          className={cn(
            'flex-1 h-2 w-full rounded-full overflow-hidden',
            colors.bg,
            'transition-all duration-200'
          )}
        >
          {/* Fill */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colors.fill
            )}
            style={{ width: `${state.percentage}%` }}
          />
        </div>

        {/* Percentage badge */}
        {showPercentage && (
          <span className={cn('text-xs font-medium whitespace-nowrap', colors.text)}>
            {state.percentageText}
          </span>
        )}
      </div>

      {/* Values Display */}
      {showValues && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Used: <span className={cn('font-medium font-mono', colors.text)}>{state.usedText}</span>
          </span>
          <span className="text-muted-foreground">
            Total: <span className="font-medium font-mono text-foreground">{state.totalText}</span>
          </span>
        </div>
      )}

      {/* Screen reader status announcement */}
      <span className="sr-only">
        {state.label} status: {state.statusLabel}. {state.ariaValueText}.
      </span>
    </div>
  );
}

export const ResourceUsageBarMobile = React.memo(ResourceUsageBarMobileBase);

ResourceUsageBarMobile.displayName = 'ResourceUsageBarMobile';
