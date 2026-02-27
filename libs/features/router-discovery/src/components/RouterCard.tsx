/**
 * Router Card Component
 * Displays individual router information in a card format
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import type { Router } from '@nasnet/core/types';

export interface RouterCardProps {
  /**
   * Router data to display
   */
  router: Router;

  /**
   * Whether this router is currently selected
   */
  isSelected?: boolean;

  /**
   * Callback when router is clicked
   */
  onClick?: (router: Router) => void;

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
   * Optional CSS class name
   */
  className?: string;
}

/**
 * RouterCard Component
 *
 * @description Displays router information in a card with actions.
 *
 * @example
 * ```tsx
 * <RouterCard
 *   router={router}
 *   isSelected={selectedId === router.id}
 *   onClick={(r) => selectRouter(r.id)}
 *   onConnect={(r) => connectToRouter(r)}
 *   onRemove={(r) => removeRouter(r.id)}
 * />
 * ```
 */
export const RouterCard = memo(function RouterCard({
  router,
  isSelected = false,
  onClick,
  onDoubleClick,
  onConnect,
  onRemove,
  className,
}: RouterCardProps) {
  const handleConnect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConnect?.(router);
  }, [router, onConnect]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(router);
  }, [router, onRemove]);

  return (
    <motion.div
      onClick={() => onClick?.(router)}
      onDoubleClick={() => onDoubleClick?.(router)}
      className={cn(
        'p-component-md rounded-lg border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between">
        {/* Router Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-component-sm mb-component-sm">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {router.name || router.ipAddress}
            </h3>
            <ConnectionStatusBadge status={router.connectionStatus} />
          </div>

          <div className="space-y-component-sm text-sm">
            <p className="font-mono text-foreground">
              {router.ipAddress}
            </p>

            {router.model && (
              <p className="text-muted-foreground">
                <span className="font-medium">Model:</span> {router.model}
              </p>
            )}

            {router.routerOsVersion && (
              <p className="text-muted-foreground">
                <span className="font-medium">RouterOS:</span>{' '}
                {router.routerOsVersion}
              </p>
            )}

            {router.macAddress && (
              <p className="font-mono text-xs text-muted-foreground">
                MAC: {router.macAddress}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-component-md flex items-center gap-component-lg text-xs text-muted-foreground">
            <span className="flex items-center gap-component-xs">
              {router.discoveryMethod === 'scan' ? (
                <>
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Auto-discovered
                </>
              ) : (
                <>
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Manually added
                </>
              )}
            </span>

            {router.lastConnected && (
              <span>
                Last: {new Date(router.lastConnected).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-component-sm ml-component-md">
          {onConnect && router.connectionStatus !== 'online' && (
            <button
              onClick={handleConnect}
              className={cn('px-component-sm py-component-sm text-sm rounded-md transition-colors', 'bg-primary text-primary-foreground hover:bg-primary/90')}
            >
              Connect
            </button>
          )}

          {onRemove && (
            <button
              onClick={handleRemove}
              className={cn('px-component-sm py-component-sm text-sm rounded-md transition-colors', 'bg-muted text-foreground hover:bg-muted/80')}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

RouterCard.displayName = 'RouterCard';

/**
 * Connection Status Badge Component
 */
const ConnectionStatusBadge = memo(function ConnectionStatusBadge({
  status,
}: {
  status: Router['connectionStatus'];
}) {
  const config = {
    online: {
      label: 'Connected',
      className: cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', 'bg-success/20 text-success'),
    },
    offline: {
      label: 'Offline',
      className: cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', 'bg-muted text-muted-foreground'),
    },
    unknown: {
      label: 'Not tested',
      className: cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', 'bg-warning/20 text-warning'),
    },
    connecting: {
      label: 'Connecting...',
      className: cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', 'bg-info/20 text-info'),
    },
  }[status];

  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
});

ConnectionStatusBadge.displayName = 'ConnectionStatusBadge';
