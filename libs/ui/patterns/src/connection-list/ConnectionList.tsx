/**
 * ConnectionList Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * const connectionList = useConnectionList({
 *   connections: data.connections,
 *   onRefresh: refetch,
 * });
 *
 * <ConnectionList
 *   connectionList={connectionList}
 *   onKillConnection={handleKill}
 *   loading={isLoading}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { ConnectionListDesktop } from './ConnectionListDesktop';
import { ConnectionListMobile } from './ConnectionListMobile';

import type { ConnectionEntry } from './types';
import type { UseConnectionListReturn } from './use-connection-list';

export interface ConnectionListProps {
  /** Connection list hook return value */
  connectionList: UseConnectionListReturn;

  /** Callback when kill connection is clicked */
  onKillConnection?: (connection: ConnectionEntry) => void;

  /** Whether kill action is loading */
  isKillingConnection?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * ConnectionList - Display and manage active firewall connections
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Tablet/Desktop (>=640px): Dense table with sortable columns
 *
 * Features:
 * - Virtualized rendering for 10,000+ connections
 * - Real-time filtering (IP with wildcards, port, protocol, state)
 * - Sortable columns (desktop)
 * - Kill connection action
 * - Auto-refresh with pause control
 */
function ConnectionListComponent(props: ConnectionListProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ConnectionListMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <ConnectionListDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const ConnectionList = memo(ConnectionListComponent);

// Set display name for React DevTools
ConnectionList.displayName = 'ConnectionList';
