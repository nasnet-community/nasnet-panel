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
 *
 * Implements comprehensive accessibility with ARIA labels, keyboard navigation support,
 * and semantic color variants. All numeric values are formatted with locale-aware
 * number formatting.
 */
export interface MetricDisplayProps {
  /**
   * Metric label/title - displayed prominently above the value
   * @example "CPU Usage", "Memory", "Network Uptime"
   */
  label: string;

  /**
   * Current metric value - can be numeric or string
   * Numeric values are formatted with thousands separators
   * @example 85, 2.4, "Active"
   */
  value: string | number;

  /**
   * Optional unit suffix (e.g., 'MB', '%', 'ms', '°C')
   * Displayed after the value with proper spacing
   * @example "%", "GB", "Mbps"
   */
  unit?: string;

  /**
   * Optional trend direction indicator
   * - 'up': indicates increasing trend (green, up arrow)
   * - 'down': indicates decreasing trend (red, down arrow)
   * - 'stable': indicates no change (gray, minus sign)
   */
  trend?: MetricTrend;

  /**
   * Optional trend value text - only displayed if trend is set
   * Should include the direction symbol and magnitude
   * @example "+5%", "-10 MB", "+0.5s"
   */
  trendValue?: string;

  /**
   * Semantic color variant for the value
   * - 'default': neutral color (slate)
   * - 'success': healthy/positive (green)
   * - 'warning': caution/warning (amber)
   * - 'error': critical/failed (red)
   * - 'info': informational (blue)
   * @default 'default'
   */
  variant?: MetricVariant;

  /**
   * Size variant for responsive scaling
   * - 'sm': compact (3px padding, text-lg)
   * - 'md': medium (4px padding, text-2xl) - default
   * - 'lg': large/hero (6px padding, text-4xl)
   * @default 'md'
   */
  size?: MetricSize;

  /**
   * Optional icon component (Lucide React icon)
   * Icon color inherits from variant for semantic meaning
   * @example Cpu, HardDrive, Wifi, Activity
   */
  icon?: React.ComponentType<{ className?: string }>;

  /**
   * Optional description or subtitle text
   * Displayed below the value in smaller text
   * Useful for additional context or timestamps
   * @example "Last 30 days", "Updated 2 minutes ago"
   */
  description?: string;

  /**
   * Whether the metric is in loading state
   * When true, displays skeleton loaders instead of content
   * @default false
   */
  isLoading?: boolean;

  /**
   * Optional click handler - when provided, makes component interactive (button role)
   * Component becomes keyboard accessible (Enter/Space keys)
   * @example () => navigate('/dashboard/cpu-details')
   */
  onClick?: () => void;

  /**
   * Additional CSS classes to apply to the container
   * Used for custom spacing, alignment, or layout adjustments
   * @example "w-full" "col-span-2"
   */
  className?: string;

  /**
   * Manual platform presenter override
   * When not specified, automatically detects platform using usePlatform()
   * Only use for specific testing or special layout scenarios
   * @example "mobile" | "tablet" | "desktop"
   */
  presenter?: 'mobile' | 'tablet' | 'desktop';
}
