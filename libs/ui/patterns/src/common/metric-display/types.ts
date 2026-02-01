/**
 * MetricDisplay Types
 *
 * Types for the metric display pattern component.
 * Used for showing key performance indicators, statistics, and measurements.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

/**
 * Trend direction for the metric
 */
export type MetricTrend = 'up' | 'down' | 'stable';

/**
 * Semantic color variants for metrics
 */
export type MetricVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Size variants for the metric display
 */
export type MetricSize = 'sm' | 'md' | 'lg';

/**
 * Props for the MetricDisplay component
 */
export interface MetricDisplayProps {
  /** Metric label/title */
  label: string;

  /** Current metric value */
  value: string | number;

  /** Optional unit (e.g., 'MB', '%', 'ms') */
  unit?: string;

  /** Optional trend direction */
  trend?: MetricTrend;

  /** Optional trend value (e.g., '+5%', '-10 MB') */
  trendValue?: string;

  /** Semantic color variant */
  variant?: MetricVariant;

  /** Size variant */
  size?: MetricSize;

  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;

  /** Optional description or subtitle */
  description?: string;

  /** Whether the metric is loading */
  isLoading?: boolean;

  /** Optional click handler */
  onClick?: () => void;

  /** Additional CSS classes */
  className?: string;
}
