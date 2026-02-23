import { memo } from 'react';

import { ResourceHealthDot } from '../resource-health-indicator';
import { useServiceHealthBadge } from './useServiceHealthBadge';

import type { ServiceHealthBadgeProps } from './ServiceHealthBadge';

/**
 * Mobile presenter for service health badge
 *
 * Shows compact dot indicator only - no text or metrics
 * to conserve space on mobile screens.
 */
function ServiceHealthBadgeMobileComponent({
  health,
  loading,
  animate,
  className,
}: ServiceHealthBadgeProps) {
  const { healthState } = useServiceHealthBadge(health);

  if (loading) {
    return <ResourceHealthDot health="UNKNOWN" animate className={className} />;
  }

  return (
    <ResourceHealthDot
      health={healthState}
      animate={animate}
      className={className}
    />
  );
}

// Wrap with memo for performance optimization
export const ServiceHealthBadgeMobile = memo(ServiceHealthBadgeMobileComponent);

// Set display name for React DevTools
ServiceHealthBadgeMobile.displayName = 'ServiceHealthBadgeMobile';
