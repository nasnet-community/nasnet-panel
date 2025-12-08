/**
 * Resource Gauge Component
 * Visual gauge for displaying resource usage (CPU, Memory, Disk) with color-coded status
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Skeleton } from '@nasnet/ui/primitives';
import { getStatusColor } from '@nasnet/core/utils';
import type { ResourceStatus } from '@nasnet/core/types';

/**
 * ResourceGauge Props
 */
export interface ResourceGaugeProps {
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
export function ResourceGauge({
  label,
  value = 0,
  status = 'healthy',
  isLoading = false,
  subtitle,
}: ResourceGaugeProps) {
  const colors = getStatusColor(status);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Card className="rounded-card-sm md:rounded-card-lg shadow-sm">
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
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Label */}
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
                className="text-slate-200 dark:text-slate-700"
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
                className={colors.text}
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
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {Math.round(value)}%
              </span>
            </div>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
