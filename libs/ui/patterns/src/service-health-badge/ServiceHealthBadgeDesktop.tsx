import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

import { ResourceHealthBadge } from '../resource-health-indicator';
import { useServiceHealthBadge } from './useServiceHealthBadge';

import type { ServiceHealthBadgeProps } from './ServiceHealthBadge';

/**
 * Desktop presenter for service health badge
 *
 * Shows full badge with health indicator and status text.
 * Uses semantic tokens and proper styling per visual spec.
 *
 * Status Badge Styles:
 * - Running: bg-success-light text-success-dark with pulse animation
 * - Stopped: bg-muted text-muted-foreground
 * - Error: bg-error-light text-error-dark
 * - Updating/Starting: bg-info-light text-info-dark with pulse animation
 */
function ServiceHealthBadgeDesktopComponent({
  health,
  loading,
  animate,
  className,
}: ServiceHealthBadgeProps) {
  const { healthState, formattedUptime, formattedLastHealthy, raw } =
    useServiceHealthBadge(health);

  if (loading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-component-sm',
          'rounded-[var(--semantic-radius-badge)] px-2.5 py-0.5',
          'text-xs font-medium',
          'bg-info-light text-info-dark dark:bg-sky-900/20 dark:text-sky-400',
          'animate-pulse transition-colors duration-150',
          className
        )}
      >
        <span className="h-2 w-2 rounded-full bg-info-dark animate-pulse" />
        Checking...
      </div>
    );
  }

  // Determine badge styling based on health state
  const getBadgeClass = () => {
    switch (healthState) {
      case 'HEALTHY':
        return 'bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400';
      case 'FAILED':
        return 'bg-error-light text-error-dark dark:bg-red-900/20 dark:text-red-400';
      case 'DEGRADED':
        return 'bg-warning-light text-warning-dark dark:bg-amber-900/20 dark:text-amber-400 animate-pulse';
      case 'UNKNOWN':
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusDotColor = () => {
    switch (healthState) {
      case 'HEALTHY':
        return 'bg-success-dark dark:bg-green-400';
      case 'FAILED':
        return 'bg-error-dark dark:bg-red-400';
      case 'DEGRADED':
        return 'bg-warning-dark dark:bg-amber-400';
      case 'UNKNOWN':
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    if (!health) return 'Unknown';

    switch (healthState) {
      case 'HEALTHY':
        return 'Running';
      case 'FAILED':
        return 'Error';
      case 'DEGRADED':
        return 'Updating';
      case 'UNKNOWN':
      default:
        return 'Unknown';
    }
  };

  const shouldPulse = healthState === 'DEGRADED' || healthState === 'HEALTHY';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-component-sm',
        'rounded-[var(--semantic-radius-badge)] px-2.5 py-0.5',
        'text-xs font-medium',
        getBadgeClass(),
        shouldPulse && 'animate-pulse',
        'transition-colors duration-150',
        className
      )}
    >
      {/* Status dot matching health color */}
      <span
        className={cn('h-2 w-2 rounded-full', getStatusDotColor())}
        aria-hidden="true"
      />
      {getStatusLabel()}

      {/* Optional: Metadata on hover (for desktop power users) */}
      {health && raw?.latencyMs != null && (
        <span className="text-xs opacity-75">
          ({raw.latencyMs}ms)
        </span>
      )}
    </div>
  );
}

// Wrap with memo for performance optimization
export const ServiceHealthBadgeDesktop = memo(ServiceHealthBadgeDesktopComponent);

// Set display name for React DevTools
ServiceHealthBadgeDesktop.displayName = 'ServiceHealthBadgeDesktop';
