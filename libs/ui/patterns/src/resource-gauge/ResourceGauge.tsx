/**
 * Resource Gauge Component
 * Visual gauge for displaying resource usage (CPU, Memory, Disk) with color-coded status
 *
 * Features:
 * - Circular SVG gauge with animated fill (80-120px diameter)
 * - Color-coded status (healthy, warning, critical)
 * - Centered percentage label (text-2xl font-bold)
 * - Optional subtitle
 * - Loading skeleton
 * - WCAG AAA accessible
 * - Semantic color tokens
 *
 * Visual Spec:
 * - Container: flex flex-col items-center gap-2
 * - Gauge: SVG circle, 80-120px diameter
 * - Track: stroke-muted stroke-width-8
 * - Fill: stroke-primary (or status color) stroke-width-8
 * - Value text: text-2xl font-bold font-display text-foreground
 * - Label: text-sm text-muted-foreground
 * - Colors: <60% bg-success, 60-80% bg-warning, >80% bg-error
 *
 * @example
 * ```tsx
 * <ResourceGauge label="CPU" value={45} status="healthy" />
 * <ResourceGauge label="Memory" value={78} status="warning" subtitle="39 MB / 50 MB" />
 * <ResourceGauge label="Disk" value={92} status="critical" isLoading={false} />
 * ```
 */

import * as React from 'react';

import { motion } from 'framer-motion';

import type { ResourceStatus } from '@nasnet/core/types';
import { Skeleton, cn } from '@nasnet/ui/primitives';

/**
 * ResourceGauge Props
 */
export interface ResourceGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Resource label (e.g., "CPU", "Memory", "Disk") */
  label: string;
  /** Current usage value (0-100) */
  value?: number;
  /** Resource status (healthy, warning, critical) */
  status?: ResourceStatus;
  /** Loading state */
  isLoading?: boolean;
  /** Optional subtitle/description */
  subtitle?: string;
}

/**
 * ResourceGauge Component
 * Displays resource usage with color-coded circular gauge and percentage
 */
function ResourceGaugeBase({
  label,
  value = 0,
  status = 'healthy',
  isLoading = false,
  subtitle,
  className,
  ...props
}: ResourceGaugeProps) {
  // Map status to semantic color tokens (color variable kept for reference)
  const statusColorClass = React.useMemo(() => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  }, [status]);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div
        className={cn('flex flex-col items-center gap-2', className)}
        {...props}
      >
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    );
  }

  // Circular gauge variant (100px diameter)
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      {...props}
    >
      {/* Label */}
      <div className="text-muted-foreground text-sm">{label}</div>

      {/* Circular Gauge Container */}
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* SVG Gauge */}
        <svg
          className="-rotate-90 transform"
          width={size}
          height={size}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${Math.round(value)}%`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          {/* Progress Fill */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={statusColorClass}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Percentage Text (centered) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-foreground text-2xl font-bold">
            {Math.round(value)}%
          </span>
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && <div className="text-muted-foreground text-center text-sm">{subtitle}</div>}
    </div>
  );
}

export const ResourceGauge = React.memo(ResourceGaugeBase);

ResourceGauge.displayName = 'ResourceGauge';
