/**
 * useMetricDisplay Hook
 *
 * Headless hook for the MetricDisplay pattern.
 * Contains all business logic, computed values, and accessibility attributes.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

import { useMemo } from 'react';

import type { MetricDisplayProps, MetricTrend, MetricVariant, MetricSize } from './types';

export interface UseMetricDisplayReturn {
  /** Formatted value with unit */
  formattedValue: string;

  /** Whether the metric is interactive */
  isInteractive: boolean;

  /** Trend icon name for rendering */
  trendIconName: 'arrow-up' | 'arrow-down' | 'minus' | null;

  /** CSS classes for the trend indicator */
  trendClasses: string;

  /** CSS classes for the value based on variant */
  valueClasses: string;

  /** CSS classes for the container based on size */
  sizeClasses: {
    container: string;
    label: string;
    value: string;
    unit: string;
    trend: string;
    icon: string;
  };

  /** Accessibility attributes */
  ariaProps: {
    role: 'button' | 'article';
    tabIndex: number;
    'aria-label': string;
  };

  /** Semantic status for screen readers */
  statusText: string;
}

/**
 * Formats a numeric value with proper separators
 */
function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return new Intl.NumberFormat().format(value);
  }
  return value;
}

/**
 * Gets trend indicator classes
 * Uses semantic tokens for color consistency across themes
 */
function getTrendClasses(trend: MetricTrend | undefined): string {
  switch (trend) {
    case 'up':
      return 'text-success';
    case 'down':
      return 'text-error';
    case 'stable':
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Gets value classes based on variant
 */
function getValueClasses(variant: MetricVariant): string {
  switch (variant) {
    case 'success':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'error':
      return 'text-error';
    case 'info':
      return 'text-info';
    case 'default':
    default:
      return 'text-foreground';
  }
}

/**
 * Gets size-specific classes
 */
function getSizeClasses(size: MetricSize): UseMetricDisplayReturn['sizeClasses'] {
  switch (size) {
    case 'sm':
      return {
        container: 'p-3',
        label: 'text-xs',
        value: 'text-lg font-semibold',
        unit: 'text-xs',
        trend: 'text-xs',
        icon: 'w-4 h-4',
      };
    case 'lg':
      return {
        container: 'p-6',
        label: 'text-sm',
        value: 'text-4xl font-bold',
        unit: 'text-lg',
        trend: 'text-sm',
        icon: 'w-8 h-8',
      };
    case 'md':
    default:
      return {
        container: 'p-4',
        label: 'text-sm',
        value: 'text-2xl font-semibold',
        unit: 'text-sm',
        trend: 'text-xs',
        icon: 'w-6 h-6',
      };
  }
}

/**
 * Gets trend icon name
 */
function getTrendIconName(
  trend: MetricTrend | undefined
): 'arrow-up' | 'arrow-down' | 'minus' | null {
  switch (trend) {
    case 'up':
      return 'arrow-up';
    case 'down':
      return 'arrow-down';
    case 'stable':
      return 'minus';
    default:
      return null;
  }
}

/**
 * Headless hook for MetricDisplay pattern
 *
 * @example
 * ```tsx
 * const metric = useMetricDisplay({
 *   label: 'CPU Usage',
 *   value: 85,
 *   unit: '%',
 *   variant: 'warning',
 *   trend: 'up',
 *   trendValue: '+5%',
 * });
 *
 * return (
 *   <div className={metric.sizeClasses.container}>
 *     <span className={metric.valueClasses}>{metric.formattedValue}</span>
 *   </div>
 * );
 * ```
 */
export function useMetricDisplay(props: MetricDisplayProps): UseMetricDisplayReturn {
  const {
    label,
    value,
    unit,
    trend,
    trendValue,
    variant = 'default',
    size = 'md',
    onClick,
  } = props;

  const formattedValue = useMemo(() => {
    const formatted = formatValue(value);
    return unit ? `${formatted} ${unit}` : formatted;
  }, [value, unit]);

  const isInteractive = !!onClick;

  const trendIconName = useMemo(() => getTrendIconName(trend), [trend]);
  const trendClasses = useMemo(() => getTrendClasses(trend), [trend]);
  const valueClasses = useMemo(() => getValueClasses(variant), [variant]);
  const sizeClasses = useMemo(() => getSizeClasses(size), [size]);

  const statusText = useMemo(() => {
    const parts = [`${label}: ${formatValue(value)}`];
    if (unit) parts[0] += ` ${unit}`;
    if (trend && trendValue) {
      const trendText =
        trend === 'up' ? 'increased by'
        : trend === 'down' ? 'decreased by'
        : 'stable at';
      parts.push(`${trendText} ${trendValue}`);
    }
    return parts.join(', ');
  }, [label, value, unit, trend, trendValue]);

  const ariaProps = useMemo(
    () => ({
      role: isInteractive ? ('button' as const) : ('article' as const),
      tabIndex: isInteractive ? 0 : -1,
      'aria-label': statusText,
    }),
    [isInteractive, statusText]
  );

  return {
    formattedValue,
    isInteractive,
    trendIconName,
    trendClasses,
    valueClasses,
    sizeClasses,
    ariaProps,
    statusText,
  };
}
