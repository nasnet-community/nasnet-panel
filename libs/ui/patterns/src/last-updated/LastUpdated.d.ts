/**
 * Last Updated Component
 * Displays when data was last refreshed with relative time
 *
 * @module @nasnet/ui/patterns/last-updated
 */
import * as React from 'react';
export interface LastUpdatedProps {
    /**
     * Timestamp of last update (from TanStack Query dataUpdatedAt)
     */
    timestamp?: number | null;
    /**
     * Optional className for custom styling
     */
    className?: string;
}
/**
 * Last Updated Component
 * Shows relative time since last data refresh
 *
 * @example
 * ```tsx
 * import { LastUpdated } from '@nasnet/ui/patterns';
 * import { useRouterResource } from '@nasnet/api-client/queries';
 *
 * function Dashboard() {
 *   const { dataUpdatedAt } = useRouterResource();
 *
 *   return <LastUpdated timestamp={dataUpdatedAt} />;
 * }
 * ```
 */
export declare const LastUpdated: React.NamedExoticComponent<LastUpdatedProps>;
//# sourceMappingURL=LastUpdated.d.ts.map