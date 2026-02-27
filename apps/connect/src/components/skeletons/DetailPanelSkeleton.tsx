/**
 * DetailPanelSkeleton Component
 *
 * Loading skeleton for detail/side panel views.
 * Used for resource details, drawer content, etc.
 *
 * @module @/components/skeletons/DetailPanelSkeleton
 */

import { Skeleton, SkeletonAvatar, cn } from '@nasnet/ui/primitives';

export interface DetailPanelSkeletonProps {
  /** Show header with avatar/icon */
  showHeader?: boolean;
  /** Number of detail rows to display */
  rows?: number;
  /** Show action buttons */
  showActions?: boolean;
  /** Show related items section */
  showRelated?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DetailPanelSkeleton Component
 *
 * Provides a skeleton layout for detail panels:
 * - Header with icon/avatar and title
 * - Key-value detail rows
 * - Status indicators
 * - Action buttons
 * - Related items
 *
 * @example
 * ```tsx
 * // Basic detail panel
 * <DetailPanelSkeleton rows={6} />
 *
 * // Full detail panel
 * <DetailPanelSkeleton
 *   showHeader
 *   rows={8}
 *   showActions
 *   showRelated
 * />
 * ```
 */
export function DetailPanelSkeleton({
  showHeader = true,
  rows = 6,
  showActions = true,
  showRelated = false,
  className,
}: DetailPanelSkeletonProps) {
  return (
    <div
      className={cn('space-y-6', className)}
      aria-busy="true"
      aria-label="Loading details"
    >
      {/* Header */}
      {showHeader && (
        <div className="border-border flex items-start gap-4 border-b pb-4">
          <SkeletonAvatar size="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            {/* Status badge */}
            <Skeleton className="rounded-pill h-6 w-20" />
          </div>
        </div>
      )}

      {/* Detail Rows */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="border-border/50 flex items-center justify-between border-b py-2"
          >
            {/* Label */}
            <Skeleton className="h-4 w-24" />
            {/* Value - varying widths */}
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}

      {/* Related Items */}
      {showRelated && (
        <div className="border-border space-y-3 border-t pt-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted/30 flex items-center gap-3 rounded-md p-2 shadow-sm"
              >
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

DetailPanelSkeleton.displayName = 'DetailPanelSkeleton';
