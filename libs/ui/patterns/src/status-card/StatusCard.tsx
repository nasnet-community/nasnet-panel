/**
 * Status Card Component
 * Hero dashboard component showing overall network health
 * Based on UX Design Specification - Direction 1: Clean Minimal
 */

import * as React from 'react';
import { Card, CardContent } from '@nasnet/ui/primitives';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

/**
 * Network health status types
 */
export type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';

/**
 * Metric data for the status card
 */
export interface StatusMetric {
  /** Metric value */
  value: string | number;
  /** Metric label */
  label: string;
  /** Optional unit */
  unit?: string;
}

/**
 * StatusCard Props
 */
export interface StatusCardProps {
  /** Overall network health status */
  status: NetworkStatus;
  /** Status message/title */
  message: string;
  /** Array of metrics to display (typically 3) */
  metrics?: StatusMetric[];
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Get status configuration based on status type
 */
function getStatusConfig(status: NetworkStatus) {
  switch (status) {
    case 'healthy':
      return {
        icon: CheckCircle2,
        iconColor: 'text-success',
        bgColor: 'bg-success/10 dark:bg-success/20',
        textColor: 'text-success-dark dark:text-success-light',
        pulseClass: 'animate-pulse-glow',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10 dark:bg-warning/20',
        textColor: 'text-warning-dark dark:text-warning-light',
        pulseClass: '',
      };
    case 'error':
      return {
        icon: XCircle,
        iconColor: 'text-error',
        bgColor: 'bg-error/10 dark:bg-error/20',
        textColor: 'text-error-dark dark:text-error-light',
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
}

/**
 * StatusCard Component
 * Displays overall network health with key metrics
 * Features pulse animation on healthy status
 */
export function StatusCard({
  status,
  message,
  metrics = [],
  subtitle,
  onClick,
  className = '',
}: StatusCardProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Card
      className={`
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
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
                className={`w-2 h-2 rounded-full ${config.iconColor} ${
                  status === 'healthy' ? config.pulseClass : ''
                }`}
                aria-hidden="true"
              />
              <p
                className={`text-lg font-semibold ${config.textColor}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            </div>
          </div>
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              ${config.bgColor}
            `}
          >
            <Icon className={`w-6 h-6 ${config.iconColor} ${config.pulseClass}`} />
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








