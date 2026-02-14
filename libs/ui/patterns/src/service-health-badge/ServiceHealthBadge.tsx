import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';
import { usePlatform } from '@nasnet/ui/layouts';
import { ServiceHealthBadgeMobile } from './ServiceHealthBadgeMobile';
import { ServiceHealthBadgeDesktop } from './ServiceHealthBadgeDesktop';

export interface ServiceHealthBadgeProps {
  /**
   * Health status from GraphQL
   */
  health?: ServiceInstanceHealth | null;

  /**
   * Whether to show loading state
   */
  loading?: boolean;

  /**
   * Whether to animate state transitions
   */
  animate?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Service Health Badge - Platform-aware health status indicator
 *
 * Displays health status with appropriate detail level for each platform:
 * - Mobile: Compact dot indicator
 * - Desktop: Full badge with metrics
 *
 * @example
 * ```tsx
 * const { data, loading } = useInstanceHealth(routerId, instanceId);
 *
 * <ServiceHealthBadge
 *   health={data?.instanceHealth}
 *   loading={loading}
 *   animate
 * />
 * ```
 */
export function ServiceHealthBadge(props: ServiceHealthBadgeProps) {
  const platform = usePlatform();

  // Mobile: Compact dot only
  if (platform === 'mobile') {
    return <ServiceHealthBadgeMobile {...props} />;
  }

  // Desktop/Tablet: Full badge with metrics
  return <ServiceHealthBadgeDesktop {...props} />;
}
