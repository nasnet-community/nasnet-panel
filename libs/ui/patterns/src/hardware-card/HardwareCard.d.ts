/**
 * Hardware Card Component
 * Displays routerboard hardware details with copy-to-clipboard functionality
 *
 * @see NAS-4.23 - Refactored to use useClipboard hook
 */
import React from 'react';
import type { RouterboardInfo } from '@nasnet/core/types';
export interface HardwareCardProps {
    /**
     * Routerboard hardware information
     */
    data?: RouterboardInfo | null;
    /**
     * Loading state indicator
     */
    isLoading?: boolean;
    /**
     * Error occurred during fetch
     */
    error?: Error | null;
}
/**
 * Hardware Card Component
 * Displays routerboard hardware details including serial number, firmware versions, and revision
 *
 * @example
 * ```tsx
 * import { HardwareCard } from '@nasnet/ui/patterns';
 * import { useRouterboard } from '@nasnet/api-client/queries';
 *
 * function Dashboard() {
 *   const { data, isLoading, error } = useRouterboard();
 *
 *   return <HardwareCard data={data} isLoading={isLoading} error={error} />;
 * }
 * ```
 */
export declare const HardwareCard: React.NamedExoticComponent<HardwareCardProps>;
//# sourceMappingURL=HardwareCard.d.ts.map