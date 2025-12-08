/**
 * Router Card Component
 * Displays individual router information in a card format
 */

import { motion } from 'framer-motion';
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
}

/**
 * RouterCard Component
 *
 * Displays router information in a card with actions.
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
export function RouterCard({
  router,
  isSelected = false,
  onClick,
  onDoubleClick,
  onConnect,
  onRemove,
}: RouterCardProps) {
  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnect?.(router);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(router);
  };

  return (
    <motion.div
      onClick={() => onClick?.(router)}
      onDoubleClick={() => onDoubleClick?.(router)}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between">
        {/* Router Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {router.name || router.ipAddress}
            </h3>
            <ConnectionStatusBadge status={router.connectionStatus} />
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-mono text-gray-700 dark:text-gray-300">
              {router.ipAddress}
            </p>

            {router.model && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Model:</span> {router.model}
              </p>
            )}

            {router.routerOsVersion && (
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">RouterOS:</span>{' '}
                {router.routerOsVersion}
              </p>
            )}

            {router.macAddress && (
              <p className="font-mono text-xs text-gray-500 dark:text-gray-500">
                MAC: {router.macAddress}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
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
        <div className="flex flex-col gap-2 ml-4">
          {onConnect && router.connectionStatus !== 'online' && (
            <button
              onClick={handleConnect}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          )}

          {onRemove && (
            <button
              onClick={handleRemove}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Connection Status Badge Component
 */
function ConnectionStatusBadge({
  status,
}: {
  status: Router['connectionStatus'];
}) {
  const config = {
    online: {
      label: 'Connected',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    },
    offline: {
      label: 'Offline',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    },
    unknown: {
      label: 'Not tested',
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    },
    connecting: {
      label: 'Connecting...',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
