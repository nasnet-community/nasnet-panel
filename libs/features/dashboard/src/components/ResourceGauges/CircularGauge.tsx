/**
 * CircularGauge Component
 * @description SVG-based circular progress indicator with threshold-based semantic coloring
 * SVG-based circular progress indicator with threshold-based coloring
 *
 * AC 5.2.3: Colors change based on configurable thresholds
 * - Supports three sizes: sm (80px), md (120px), lg (160px)
 * - Smooth 500ms transition animation
 * - WCAG AAA accessible with proper ARIA attributes
 */

import { memo, useCallback } from 'react';
import { cn } from '@nasnet/ui/utils';

/**
 * Threshold configuration for warning and critical states
 */
export interface GaugeThresholds {
  warning: number;   // Amber threshold (e.g., 70%)
  critical: number;  // Red threshold (e.g., 90%)
}

/**
 * CircularGauge props
 */
export interface CircularGaugeProps {
  /** Current value (0-100) */
  value: number;
  /** Primary label (e.g., "CPU") */
  label: string;
  /** Optional secondary label (e.g., "4 cores") */
  sublabel?: string;
  /** Threshold configuration for color changes */
  thresholds?: GaugeThresholds;
  /** Gauge size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size configurations for gauges
 */
const SIZES = {
  sm: { diameter: 80, strokeWidth: 6, fontSize: 'text-lg' },
  md: { diameter: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { diameter: 160, strokeWidth: 10, fontSize: 'text-3xl' },
} as const;

/**
 * CircularGauge Component
 *
 * Renders a circular progress indicator with:
 * - SVG-based visual with smooth animations
 * - Threshold-based semantic coloring (green/amber/red)
 * - Full WCAG AAA accessibility support
 * - Responsive sizing
 */
export const CircularGauge = memo(function CircularGauge({
  value,
  label,
  sublabel,
  thresholds = { warning: 70, critical: 90 },
  size = 'md',
  onClick,
  className,
}: CircularGaugeProps) {
  // Size configuration
  const { diameter, strokeWidth, fontSize } = SIZES[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash offset for progress
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  // AC 5.2.3: Threshold-based semantic colors
  const color = clampedValue >= thresholds.critical
    ? 'stroke-error'      // Red: Critical state
    : clampedValue >= thresholds.warning
    ? 'stroke-warning'    // Amber: Warning state
    : 'stroke-success';   // Green: Normal state

  // Determine if clickable
  const isClickable = !!onClick;

  // Memoize onClick handler
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Base element props
  const elementProps = {
    role: 'meter' as const,
    'aria-valuenow': clampedValue,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-label': `${label}: ${clampedValue}%${sublabel ? `, ${sublabel}` : ''}`,
  };

  // Content JSX
  const content = (
    <>
      <div className="relative" style={{ width: diameter, height: diameter }}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" role="img" aria-label={`${label} gauge at ${clampedValue}%`}>
          {/* Base track (muted gray) */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />

          {/* Progress circle with threshold-based color */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              color,
              // AC: 500ms ease-out transition
              'transition-all duration-500 ease-out'
            )}
          />
        </svg>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold font-mono', fontSize)}>
            {clampedValue}%
          </span>
        </div>
      </div>

      {/* Labels below gauge */}
      <div className="text-center">
        <p className="font-medium">{label}</p>
        {sublabel && (
          <p className="text-sm text-muted-foreground font-mono">{sublabel}</p>
        )}
      </div>
    </>
  );

  // Render as button if clickable, div otherwise
  if (isClickable) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex flex-col items-center gap-2',
          'cursor-pointer hover:opacity-80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-opacity',
          className
        )}
        {...elementProps}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      {...elementProps}
    >
      {content}
    </div>
  );
});
