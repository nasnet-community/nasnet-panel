/**
 * Resource Gauge Component
 * Visual gauge for displaying resource usage (CPU, Memory, Disk) with color-coded status
 *
 * Features:
 * - Circular SVG gauge with animated fill
 * - Color-coded status (healthy, warning, critical)
 * - Centered percentage label
 * - Optional subtitle
 * - Loading skeleton
 * - WCAG AA accessible
 * - Semantic color tokens
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
import { getStatusColor } from '@nasnet/core/utils';
import { Card, CardContent, Skeleton, cn } from '@nasnet/ui/primitives';

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
 * Displays resource usage with color-coded progress bar and percentage
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
  const colors = getStatusColor(status);

  // Map status to semantic color tokens
  const statusColorClass = React.useMemo(() => {
    switch (status) {
      case 'healthy':
        return 'text-semantic-success';
      case 'warning':
        return 'text-semantic-warning';
      case 'critical':
        return 'text-semantic-error';
      default:
        return 'text-muted-foreground';
    }
  }, [status]);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Card className={cn('rounded-lg shadow-sm', className)} {...props}>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Circular gauge variant
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Card className={cn('rounded-lg shadow-sm transition-shadow hover:shadow-md', className)} {...props}>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Label */}
          <div className="text-sm font-semibold text-foreground">
            {label}
          </div>

          {/* Circular Gauge */}
          <div className="relative" style={{ width: size, height: size }}>
            {/* Background Circle */}
            <svg className="transform -rotate-90" width={size} height={size}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                className="text-border"
              />
              {/* Progress Circle */}
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

            {/* Percentage Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">
                {Math.round(value)}%
              </span>
            </div>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-xs text-muted-foreground text-center font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const ResourceGauge = React.memo(ResourceGaugeBase);

ResourceGauge.displayName = 'ResourceGauge';
