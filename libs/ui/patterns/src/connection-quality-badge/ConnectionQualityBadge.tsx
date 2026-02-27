/**
 * Connection Quality Badge Component
 *
 * Displays connection quality metrics (latency, signal strength).
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { memo } from 'react';

import { Signal, SignalHigh, SignalLow, SignalMedium, Zap } from 'lucide-react';

import { Badge, cn } from '@nasnet/ui/primitives';

import { useConnectionIndicator } from '../connection-indicator/useConnectionIndicator';

// ===== Types =====

export type QualityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';

export interface ConnectionQualityBadgeProps {
  /**
   * Show latency value
   * @default true
   */
  showLatency?: boolean;

  /**
   * Show quality icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

// ===== Constants =====

/**
 * Quality level based on latency thresholds
 */
const QUALITY_THRESHOLDS = {
  EXCELLENT: 50, // < 50ms
  GOOD: 100, // < 100ms
  MODERATE: 200, // < 200ms
  // > 200ms = poor
};

/**
 * Badge variant mappings for quality levels
 */
const QUALITY_VARIANTS: Record<QualityLevel, 'default' | 'secondary' | 'error' | 'outline'> = {
  excellent: 'default',
  good: 'default',
  moderate: 'secondary',
  poor: 'error',
  unknown: 'outline',
};

/**
 * Color classes for quality levels
 */
const QUALITY_COLORS: Record<QualityLevel, string> = {
  excellent: 'bg-semantic-success text-white',
  good: 'bg-semantic-success/80 text-white',
  moderate: 'bg-semantic-warning text-white',
  poor: 'bg-semantic-error text-white',
  unknown: 'bg-muted text-muted-foreground',
};

/**
 * Quality labels (localization keys for i18n integration)
 * In production, these should be used with i18n: t(`connection.quality.${quality}`)
 */
const QUALITY_LABELS: Record<QualityLevel, string> = {
  excellent: 'Excellent',
  good: 'Good',
  moderate: 'Moderate',
  poor: 'Poor',
  unknown: 'Unknown',
};

// ===== Helper Functions =====

/**
 * Determine quality level from latency
 */
function getQualityLevel(latencyMs: number | null): QualityLevel {
  if (latencyMs === null) return 'unknown';
  if (latencyMs < QUALITY_THRESHOLDS.EXCELLENT) return 'excellent';
  if (latencyMs < QUALITY_THRESHOLDS.GOOD) return 'good';
  if (latencyMs < QUALITY_THRESHOLDS.MODERATE) return 'moderate';
  return 'poor';
}

/**
 * Get signal icon based on quality
 */
function QualityIcon({ quality, className }: { quality: QualityLevel; className?: string }) {
  const iconClass = cn('h-3.5 w-3.5', className);

  switch (quality) {
    case 'excellent':
      return <SignalHigh className={iconClass} />;
    case 'good':
      return <SignalMedium className={iconClass} />;
    case 'moderate':
      return <SignalLow className={iconClass} />;
    case 'poor':
      return <Signal className={iconClass} />;
    default:
      return <Zap className={iconClass} />;
  }
}

// ===== Component =====

/**
 * Connection Quality Badge
 *
 * Shows connection quality with optional latency display.
 * Auto-updates based on connection store state.
 *
 * @example
 * ```tsx
 * // Default with latency and icon
 * <ConnectionQualityBadge />
 *
 * // Latency only
 * <ConnectionQualityBadge showIcon={false} />
 *
 * // Icon only
 * <ConnectionQualityBadge showLatency={false} />
 *
 * // Small size
 * <ConnectionQualityBadge size="sm" />
 * ```
 */
export const ConnectionQualityBadge = memo(function ConnectionQualityBadge({
  showLatency = true,
  showIcon = true,
  className,
  size = 'default',
}: ConnectionQualityBadgeProps) {
  const { wsStatus, latencyMs } = useConnectionIndicator();

  // Only show when connected
  if (wsStatus !== 'connected') {
    return null;
  }

  const quality = getQualityLevel(latencyMs);
  const label = QUALITY_LABELS[quality];

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      variant={QUALITY_VARIANTS[quality]}
      className={cn(
        'inline-flex items-center gap-1 font-mono',
        QUALITY_COLORS[quality],
        sizeClasses[size],
        className
      )}
      aria-label={`Connection quality: ${label}${latencyMs !== null ? `, ${latencyMs}ms latency` : ''}`}
    >
      {showIcon && <QualityIcon quality={quality} />}
      {showLatency && latencyMs !== null && <span>{latencyMs}ms</span>}
      {!showLatency && !showIcon && <span>{label}</span>}
    </Badge>
  );
});

// ===== Standalone Hook =====

/**
 * Hook for custom quality badge implementations
 */
export function useConnectionQuality() {
  const { wsStatus, latencyMs, latencyQuality } = useConnectionIndicator();

  const quality = getQualityLevel(latencyMs);
  const isConnected = wsStatus === 'connected';

  return {
    quality,
    latencyMs,
    latencyQuality,
    isConnected,
    label: QUALITY_LABELS[quality],
    color: QUALITY_COLORS[quality],
  };
}
