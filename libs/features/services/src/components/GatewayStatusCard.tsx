import { usePlatform } from '@nasnet/ui/primitives';
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
}

/**
 * Platform-adaptive gateway status card following Headless + Platform Presenter pattern.
 * Automatically renders Mobile or Desktop variant based on viewport size.
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
 *   />
 * );
 * ```
 */
export function GatewayStatusCard(props: GatewayStatusCardProps) {
  const platform = usePlatform();

  return platform === 'mobile' ? (
    <GatewayStatusCardMobile {...props} />
  ) : (
    <GatewayStatusCardDesktop {...props} />
  );
}
