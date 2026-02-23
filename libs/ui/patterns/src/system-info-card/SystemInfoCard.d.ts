/**
 * System Information Card Component
 * Displays router system information including model, version, uptime, and architecture
 */
import React from 'react';
import type { SystemInfo } from '@nasnet/core/types';
/**
 * SystemInfoCard Props
 */
export interface SystemInfoCardProps {
    /** System information data */
    data?: SystemInfo | null;
    /** Loading state */
    isLoading?: boolean;
    /** Error state */
    error?: Error | null;
    /** Retry callback for error state */
    onRetry?: () => void;
}
/**
 * SystemInfoCard Component
 * Shows router model, RouterOS version, uptime, and CPU architecture
 * Includes skeleton loading state and error handling with retry
 */
export declare const SystemInfoCard: React.NamedExoticComponent<SystemInfoCardProps>;
//# sourceMappingURL=SystemInfoCard.d.ts.map