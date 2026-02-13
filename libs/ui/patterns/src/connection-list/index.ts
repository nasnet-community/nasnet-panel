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

// Main component
export { ConnectionList, type ConnectionListProps } from './ConnectionList';

// Headless hook
export {
  useConnectionList,
  type UseConnectionListOptions,
  type UseConnectionListReturn,
} from './use-connection-list';

// Sub-components (exported for testing and custom layouts)
export { ConnectionStateBadge } from './ConnectionStateBadge';
export { ConnectionFilterBar } from './ConnectionFilterBar';
export { ConnectionListDesktop } from './ConnectionListDesktop';
export { ConnectionListMobile } from './ConnectionListMobile';

// Types
export type {
  ConnectionEntry,
  ConnectionFilter,
  ConnectionSort,
  ConnectionSortField,
  ConnectionState,
  ConnectionProtocol,
  TcpState,
  SortDirection,
} from './types';
