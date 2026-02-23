/**
 * TypeScript type definitions for Service Traffic Statistics Panel
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * @description
 * Type definitions for traffic statistics panels, quota cards, and related
 * components. Provides strong typing for traffic state, quota configuration,
 * and device-level traffic breakdowns.
 */
import type { ServiceTrafficStats, TrafficQuota } from '@nasnet/api-client/generated';
/**
 * Props for the main ServiceTrafficPanel component
 */
export interface ServiceTrafficPanelProps {
    /** Router ID */
    routerID: string;
    /** Service instance ID */
    instanceID: string;
    /** Service instance display name */
    instanceName: string;
    /** Number of hours of historical data to display (default: 24) */
    historyHours?: number;
    /** Callback when panel is closed */
    onClose?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * State returned by useServiceTrafficPanel hook
 */
export interface ServiceTrafficState {
    /** Current traffic statistics */
    stats: ServiceTrafficStats | null;
    /** Calculated upload rate in bytes per second */
    uploadRate: bigint | null;
    /** Calculated download rate in bytes per second */
    downloadRate: bigint | null;
    /** Current quota usage percentage (0-100) */
    quotaUsagePercent: number;
    /** Whether quota warning threshold has been triggered */
    quotaWarning: boolean;
    /** Whether quota limit has been reached */
    quotaExceeded: boolean;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
}
/**
 * Props for the TrafficQuotaCard component
 */
export interface TrafficQuotaCardProps {
    /** Traffic quota configuration (null if not set) */
    quota: TrafficQuota | null;
    /** Callback when quota settings are clicked */
    onConfigureQuota?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Props for the DeviceBreakdownTable component
 */
export interface DeviceBreakdownTableProps {
    /** Router ID */
    routerID: string;
    /** Service instance ID */
    instanceID: string;
    /** Maximum number of devices to display */
    limit?: number;
    /** Additional CSS classes */
    className?: string;
}
//# sourceMappingURL=service-traffic-panel.types.d.ts.map