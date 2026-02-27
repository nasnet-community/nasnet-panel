import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

import { useServiceHealthBadge } from './useServiceHealthBadge';

import type { ServiceHealthBadgeProps } from './ServiceHealthBadge';

/**
 * Mobile presenter for service health badge
 *
 * Shows compact dot indicator only - no text or metrics
 * to conserve space on mobile screens.
 * Uses semantic color tokens matching the visual spec.
 */
function ServiceHealthBadgeMobileComponent({
  health,
  loading,
  animate,
  className,
}: ServiceHealthBadgeProps) {
  const { healthState } = useServiceHealthBadge(health);

  const getDotColor = () => {
    switch (healthState) {
      case 'HEALTHY':
        return 'bg-success dark:bg-green-400';
      case 'FAILED':
        return 'bg-error dark:bg-red-400';
      case 'DEGRADED':
        return 'bg-warning dark:bg-amber-400';
      case 'UNKNOWN':
      default:
        return 'bg-muted-foreground';
    }
  };

  const shouldPulse = !loading && (healthState === 'DEGRADED' || healthState === 'HEALTHY');

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        getDotColor(),
        shouldPulse && 'animate-pulse',
        'transition-colors duration-150',
        className
      )}
      aria-label={loading ? 'Loading health status' : healthState}
      title={loading ? 'Checking health status...' : healthState}
    />
  );
}

// Wrap with memo for performance optimization
export const ServiceHealthBadgeMobile = memo(ServiceHealthBadgeMobileComponent);

// Set display name for React DevTools
ServiceHealthBadgeMobile.displayName = 'ServiceHealthBadgeMobile';
