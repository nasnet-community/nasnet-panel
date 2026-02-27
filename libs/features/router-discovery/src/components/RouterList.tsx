/**
 * Router List Component
 * Displays a list of discovered/added routers
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import type { Router } from '@nasnet/core/types';
import { RouterCard } from './RouterCard';

export interface RouterListProps {
  /**
   * Array of routers to display
   */
  routers: Router[];

  /**
   * ID of currently selected router
   */
  selectedRouterId?: string | null;

  /**
   * Callback when router is selected
   */
  onRouterSelect?: (router: Router) => void;

  /**
   * Callback when router is double-clicked
   */
  onDoubleClick?: (router: Router) => void;

  /**
   * Callback when connect button is clicked
   */
  onConnect?: (router: Router) => void;

  /**
   * Callback when remove button is clicked
   */
  onRemove?: (router: Router) => void;

  /**
   * Custom empty state component
   */
  emptyState?: React.ReactNode;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * RouterList Component
 *
 * @description Displays a grid of router cards with filtering and actions.
 *
 * @example
 * ```tsx
 * <RouterList
 *   routers={allRouters}
 *   selectedRouterId={selectedId}
 *   onRouterSelect={(r) => setSelectedId(r.id)}
 *   onConnect={(r) => handleConnect(r)}
 *   onRemove={(r) => handleRemove(r)}
 * />
 * ```
 */
export const RouterList = memo(function RouterList({
  routers,
  selectedRouterId,
  onRouterSelect,
  onDoubleClick,
  onConnect,
  onRemove,
  emptyState,
  className,
}: RouterListProps) {
  // Sort routers: online first, then by last connected, then by name/IP
  const sortedRouters = useMemo(() => {
    return [...routers].sort((a, b) => {
      // Online routers first
      if (a.connectionStatus === 'online' && b.connectionStatus !== 'online')
        return -1;
      if (a.connectionStatus !== 'online' && b.connectionStatus === 'online')
        return 1;

      // Then by last connected (most recent first)
      if (a.lastConnected && b.lastConnected) {
        return (
          new Date(b.lastConnected).getTime() -
          new Date(a.lastConnected).getTime()
        );
      }
      if (a.lastConnected) return -1;
      if (b.lastConnected) return 1;

      // Then alphabetically by name or IP
      const aName = (a.name || a.ipAddress).toLowerCase();
      const bName = (b.name || b.ipAddress).toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [routers]);

  if (routers.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        {emptyState || (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">
              No routers found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan your network or add a router manually to get started
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-component-md', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {routers.length} Router{routers.length !== 1 ? 's' : ''}
        </h3>

        {/* Status Summary */}
        <div className="flex items-center gap-component-lg text-sm text-muted-foreground">
          {routers.filter((r) => r.connectionStatus === 'online').length > 0 && (
            <span className="flex items-center gap-component-sm">
              <div className="h-2 w-2 bg-success rounded-full" />
              {routers.filter((r) => r.connectionStatus === 'online').length}{' '}
              Online
            </span>
          )}
          {routers.filter((r) => r.connectionStatus === 'offline').length >
            0 && (
            <span className="flex items-center gap-component-sm">
              <div className="h-2 w-2 bg-muted-foreground rounded-full" />
              {routers.filter((r) => r.connectionStatus === 'offline').length}{' '}
              Offline
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-component-md">
        <AnimatePresence mode="popLayout">
          {sortedRouters.map((router, index) => (
            <motion.div
              key={router.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <RouterCard
                router={router}
                isSelected={router.id === selectedRouterId}
                onClick={onRouterSelect}
                onDoubleClick={onDoubleClick}
                onConnect={onConnect}
                onRemove={onRemove}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

RouterList.displayName = 'RouterList';
