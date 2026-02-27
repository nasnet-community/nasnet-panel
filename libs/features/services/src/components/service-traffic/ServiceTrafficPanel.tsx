/**
 * ServiceTrafficPanel Component
 * Main wrapper with headless logic and platform detection
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: Dense data layout with grid sections
 * - Mobile: Card-based layout with 44px touch targets
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';
import { ServiceTrafficPanelDesktop } from './ServiceTrafficPanelDesktop';
import { ServiceTrafficPanelMobile } from './ServiceTrafficPanelMobile';
import type { ServiceTrafficPanelProps } from './service-traffic-panel.types';

/**
 * ServiceTrafficPanel Component
 *
 * Displays service traffic statistics with platform-specific UI:
 * - Total upload/download bytes with real-time rates
 * - Historical traffic chart (last N hours)
 * - Per-device bandwidth breakdown
 * - Traffic quota monitoring with progress bars
 * - Quota configuration interface
 *
 * @description Auto-detecting wrapper that renders platform-optimized presenter
 * for service traffic monitoring and quota management.
 *
 * @example
 * ```tsx
 * <ServiceTrafficPanel
 *   routerID="router-1"
 *   instanceID="xray-instance-1"
 *   instanceName="Xray VPN Service"
 *   historyHours={24}
 *   onClose={() => navigate('/services')}
 * />
 * ```
 */
function ServiceTrafficPanelComponent(props: ServiceTrafficPanelProps) {
  const platform = usePlatform();

  return platform === 'mobile' ?
      <ServiceTrafficPanelMobile {...props} />
    : <ServiceTrafficPanelDesktop {...props} />;
}

export const ServiceTrafficPanel = memo(ServiceTrafficPanelComponent);
ServiceTrafficPanel.displayName = 'ServiceTrafficPanel';

// Re-export presenters for direct usage
export { ServiceTrafficPanelDesktop, ServiceTrafficPanelMobile };
export type { ServiceTrafficPanelProps };
