import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { cn } from '@nasnet/ui/utils';
import type { GatewayInfo } from '@nasnet/api-client/queries';
import { GatewayStatusCardDesktop } from './GatewayStatusCardDesktop';
import { GatewayStatusCardMobile } from './GatewayStatusCardMobile';

/**
 * Props for GatewayStatusCard component
 */
export interface GatewayStatusCardProps {
  /** Gateway information from useGatewayStatus hook */
  gateway: GatewayInfo;
  /** Instance ID for context */
  instanceId: string;
  /** Service name for display */
  serviceName: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional platform override: 'mobile' | 'tablet' | 'desktop' */
  presenter?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * GatewayStatusCard - Platform-adaptive gateway status card
 *
 * Follows Headless + Platform Presenter pattern. Automatically renders Mobile or Desktop
 * variant based on viewport size. Displays gateway state, interface, PID, uptime, and health.
 *
 * Features:
 * - Auto-detect platform or manual override
 * - Dense desktop layout with all info visible
 * - Optimized mobile with essential info only
 * - Live health indicator with pulse animation
 * - Error state with detailed message
 * - Accessibility: ARIA labels, role="status", semantic HTML
 *
 * @example
 * ```tsx
 * const { data } = useGatewayStatus('tor-usa');
 *
 * if (data?.gatewayStatus.state === GatewayState.NOT_NEEDED) return null;
 *
 * return (
 *   <GatewayStatusCard
 *     gateway={data.gatewayStatus}
 *     instanceId="tor-usa"
 *     serviceName="Tor"
 *     className="mb-4"
 *   />
 * );
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#status-indicators
 */
function GatewayStatusCardComponent({
  gateway,
  instanceId,
  serviceName,
  className,
  presenter,
}: GatewayStatusCardProps) {
  const detectedPlatform = usePlatform();
  const platform = presenter || detectedPlatform;

  return platform === 'mobile' ? (
    <GatewayStatusCardMobile
      gateway={gateway}
      instanceId={instanceId}
      serviceName={serviceName}
      className={className}
    />
  ) : (
    <GatewayStatusCardDesktop
      gateway={gateway}
      instanceId={instanceId}
      serviceName={serviceName}
      className={className}
    />
  );
}

export const GatewayStatusCard = memo(GatewayStatusCardComponent);
GatewayStatusCard.displayName = 'GatewayStatusCard';
