/**
 * Connection List Pattern Component
 *
 * Headless + Platform Presenters pattern for displaying firewall connection tracking.
 *
 * @example
 * ```tsx
 * import { useConnectionList, ConnectionList } from '@nasnet/ui/patterns';
 *
 * function ConnectionTrackingPage() {
 *   const { data, isLoading, refetch } = useConnectionTrackingQuery();
 *
 *   const connectionList = useConnectionList({
 *     connections: data?.connections || [],
 *     onRefresh: refetch,
 *   });
 *
 *   return (
 *     <ConnectionList
 *       connectionList={connectionList}
 *       onKillConnection={handleKill}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export { ConnectionList, type ConnectionListProps } from './ConnectionList';
export { useConnectionList, type UseConnectionListOptions, type UseConnectionListReturn, } from './use-connection-list';
export { ConnectionStateBadge } from './ConnectionStateBadge';
export { ConnectionFilterBar } from './ConnectionFilterBar';
export { ConnectionListDesktop } from './ConnectionListDesktop';
export { ConnectionListMobile } from './ConnectionListMobile';
export type { ConnectionEntry, ConnectionFilter, ConnectionSort, ConnectionSortField, ConnectionState, SortDirection, } from './types';
//# sourceMappingURL=index.d.ts.map