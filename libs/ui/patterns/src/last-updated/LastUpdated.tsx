/**
 * Last Updated Component
 * Displays when data was last refreshed with relative time
 */

import { Clock } from 'lucide-react';

import { useRelativeTime } from '@nasnet/core/utils';

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
export function LastUpdated({ timestamp, className = '' }: LastUpdatedProps) {
  const date = timestamp ? new Date(timestamp) : null;
  const relativeTime = useRelativeTime(date);

  if (!timestamp || !relativeTime) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 transition-colors ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      <span className="font-medium">{relativeTime}</span>
    </div>
  );
}
