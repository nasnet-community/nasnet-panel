/**
 * Status Card Component
 * Hero dashboard component showing overall network health
 * Based on UX Design Specification - Direction 1: Clean Minimal
 *
 * @module @nasnet/ui/patterns/status-card
 * @example
 * ```tsx
 * <StatusCard
 *   status="healthy"
 *   message="Network Healthy"
 *   subtitle="All systems operational"
 *   metrics={[
 *     { value: 12, label: 'Interfaces' },
 *     { value: '99.8', label: 'Uptime', unit: '%' },
 *   ]}
 * />
 * ```
 */

import * as React from 'react';
import { useCallback, useMemo } from 'react';

import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

import { Card, CardContent, cn } from '@nasnet/ui/primitives';

/**
 * Network health status types
 */
export type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';

/**
 * Metric data for the status card
 */
export interface StatusMetric {
  /** Metric value (string or number) */
  value: string | number;
  /** Metric label */
  label: string;
  /** Optional unit (e.g., '%', 'ms') */
  unit?: string;
}

/**
 * StatusCard component props
 */
export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Overall network health status */
  status: NetworkStatus;
  /** Status message/title displayed with indicator dot */
  message: string;
  /** Array of metrics to display in grid (typically 3) */
  metrics?: StatusMetric[];
  /** Optional subtitle/description shown above message */
  subtitle?: string;
  /** Optional click handler - adds cursor-pointer and hover effect when provided */
  onClick?: () => void;
}

/**
 * Status configuration mapping
 * Determines icon, colors, and animations based on status type
 */
interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  textColor: string;
  pulseClass: string;
}

/**
 * Get status configuration based on status type
 * Memoized to prevent unnecessary object recreation
 */
const getStatusConfig = (status: NetworkStatus): StatusConfig => {
  switch (status) {
    case 'healthy':
      return {
        icon: CheckCircle2,
        iconColor: 'text-success',
        bgColor: 'bg-success/10 dark:bg-success/20',
        textColor: 'text-success dark:text-success',
        pulseClass: 'animate-pulse-glow',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10 dark:bg-warning/20',
        textColor: 'text-warning dark:text-warning',
        pulseClass: '',
      };
    case 'error':
      return {
        icon: XCircle,
        iconColor: 'text-error',
        bgColor: 'bg-error/10 dark:bg-error/20',
        textColor: 'text-error dark:text-error',
        pulseClass: '',
      };
    case 'loading':
      return {
        icon: Loader2,
        iconColor: 'text-muted-foreground',
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
        pulseClass: 'animate-spin',
      };
  }
};

/**
 * StatusCard Component
 * Displays overall network health with key metrics
 * Features pulse animation on healthy status and optional click handling
 *
 * @param props - StatusCard props
 * @returns Rendered StatusCard component
 */
const StatusCardBase = React.forwardRef<HTMLDivElement, StatusCardProps>(
  (
    {
      status,
      message,
      metrics = [],
      subtitle,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const config = useMemo(() => getStatusConfig(status), [status]);
    const Icon = config.icon;

    const cardClassName = useMemo(
      () =>
        cn(
          'transition-all duration-200',
          onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-1',
          className
        ),
      [onClick, className]
    );

    return (
      <Card
        ref={ref}
        className={cardClassName}
        onClick={onClick}
        role="region"
        aria-label={`Network status: ${message}`}
        {...props}
      >
        <CardContent className="p-6">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              {subtitle && (
                <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    config.iconColor,
                    status === 'healthy' && config.pulseClass
                  )}
                  aria-hidden="true"
                />
                <p
                  className={cn('text-lg font-semibold', config.textColor)}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              </div>
            </div>
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center',
                config.bgColor
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  config.iconColor,
                  config.pulseClass
                )}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Metrics Grid */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              {metrics.map((metric, index) => (
                <div key={index}>
                  <p className="text-2xl font-semibold text-foreground">
                    {metric.value}
                    {metric.unit && (
                      <span className="text-sm text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

StatusCardBase.displayName = 'StatusCard';

/**
 * Memoized StatusCard component
 * Prevents unnecessary re-renders when props don't change
 */
export const StatusCard = React.memo(StatusCardBase);























