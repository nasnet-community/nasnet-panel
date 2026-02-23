/**
 * Service Traffic Statistics Components
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * Exports:
 * - ServiceTrafficPanel (main component with platform detection)
 * - Platform-specific presenters (Desktop/Mobile)
 * - Headless hook for custom implementations
 * - TypeScript types
 */
export { ServiceTrafficPanel, ServiceTrafficPanelDesktop, ServiceTrafficPanelMobile } from './ServiceTrafficPanel';
export { useServiceTrafficPanel } from './use-service-traffic-panel';
export { QuotaSettingsForm } from './QuotaSettingsForm';
export type { ServiceTrafficPanelProps, ServiceTrafficState, TrafficQuotaCardProps, DeviceBreakdownTableProps, } from './service-traffic-panel.types';
export type { UseServiceTrafficPanelOptions } from './use-service-traffic-panel';
export type { QuotaSettingsFormProps } from './QuotaSettingsForm';
//# sourceMappingURL=index.d.ts.map