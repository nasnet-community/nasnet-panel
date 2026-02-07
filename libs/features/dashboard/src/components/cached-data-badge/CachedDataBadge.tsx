/**
 * CachedDataBadge Component
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Displays cache age and freshness status with color coding.
 * Indicates data staleness and provides retry action for offline scenarios.
 *
 * Color coding:
 * - Green (<1 min): Fresh data
 * - Amber (1-5 min): Warning - slightly stale
 * - Red (>5 min): Critical - very stale, mutations disabled
 *
 * @see Story 5.1 Dev Notes: Offline Cache Architecture
 */

import { RefreshCw, WifiOff, Clock } from 'lucide-react';
import { Badge, Button } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { CacheStatus } from '../../types/dashboard.types';

export interface CachedDataBadgeProps {
  /** Data freshness status */
  status: CacheStatus;
  /** Age of cached data in minutes */
  ageMinutes: number;
  /** Last successful sync timestamp */
  lastSeenAt: Date;
  /** Retry callback */
  onRetry?: () => void;
  /** Show inline or as banner */
  variant?: 'inline' | 'banner';
  /** Additional CSS classes */
  className?: string;
}

/**
 * CachedDataBadge - Cache age indicator with retry action
 *
 * Inline variant: Compact badge for cards
 * Banner variant: Full-width alert for dashboard header
 *
 * @example Inline usage
 * ```tsx
 * <CachedDataBadge
 *   status="warning"
 *   ageMinutes={3}
 *   lastSeenAt={lastUpdateTime}
 *   variant="inline"
 * />
 * ```
 *
 * @example Banner usage
 * ```tsx
 * <CachedDataBadge
 *   status="critical"
 *   ageMinutes={6}
 *   lastSeenAt={lastUpdateTime}
 *   onRetry={handleRetry}
 *   variant="banner"
 * />
 * ```
 */
export function CachedDataBadge({
  status,
  ageMinutes,
  lastSeenAt,
  onRetry,
  variant = 'inline',
  className,
}: CachedDataBadgeProps) {
  if (variant === 'banner') {
    return (
      <CachedDataBanner
        status={status}
        ageMinutes={ageMinutes}
        lastSeenAt={lastSeenAt}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  return (
    <CachedDataInlineBadge
      status={status}
      ageMinutes={ageMinutes}
      className={className}
    />
  );
}

/**
 * Inline badge variant - compact for cards
 */
function CachedDataInlineBadge({
  status,
  ageMinutes,
  className,
}: Pick<CachedDataBadgeProps, 'status' | 'ageMinutes' | 'className'>) {
  const statusConfig = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5',
        statusConfig.bgClass,
        statusConfig.textClass,
        statusConfig.borderClass,
        className
      )}
      role="status"
      aria-label={`Cache status: ${status}. Data is ${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} old.`}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      <span className="text-xs font-medium">
        {ageMinutes}m old
      </span>
    </Badge>
  );
}

/**
 * Banner variant - full-width alert for critical staleness
 */
function CachedDataBanner({
  status,
  ageMinutes,
  lastSeenAt,
  onRetry,
  className,
}: Omit<CachedDataBadgeProps, 'variant'>) {
  const statusConfig = getStatusConfig(status);

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        statusConfig.bgClass,
        statusConfig.borderClass,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1">
        <WifiOff className={cn('h-5 w-5', statusConfig.textClass)} aria-hidden="true" />
        <div className="flex-1">
          <p className={cn('text-sm font-medium', statusConfig.textClass)}>
            {statusConfig.message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last seen: {formatLastSeen(lastSeenAt)} • Data {ageMinutes}m old
          </p>
        </div>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-3 h-9"
          aria-label="Retry connection"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Helper functions

interface StatusConfig {
  bgClass: string;
  textClass: string;
  borderClass: string;
  message: string;
}

function getStatusConfig(status: CacheStatus): StatusConfig {
  const configs: Record<CacheStatus, StatusConfig> = {
    fresh: {
      bgClass: 'bg-success-light/10',
      textClass: 'text-success-dark',
      borderClass: 'border-success/20',
      message: 'Connected',
    },
    warning: {
      bgClass: 'bg-warning-light/10',
      textClass: 'text-warning-dark',
      borderClass: 'border-warning/20',
      message: 'Connection unstable',
    },
    critical: {
      bgClass: 'bg-error-light/10',
      textClass: 'text-error-dark',
      borderClass: 'border-error/20',
      message: 'Router unreachable',
    },
  };

  return configs[status];
}

function formatLastSeen(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
