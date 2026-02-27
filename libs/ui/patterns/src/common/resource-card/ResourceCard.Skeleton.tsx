/**
 * ResourceCard Skeleton / Loading State
 *
 * Skeleton loader for ResourceCard with pulse animation.
 * Shown during lazy loading of tablet presenter.
 */

import * as React from 'react';

import { Card, CardContent, cn } from '@nasnet/ui/primitives';

/**
 * Skeleton loader for ResourceCard
 */
export function ResourceCardSkeleton(): React.ReactElement {
  return (
    <Card className="p-component-lg">
      <CardContent className="space-y-3 p-0">
        <div className="flex items-center justify-between gap-4">
          {/* Status badge skeleton */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-muted h-8 w-16 flex-shrink-0 animate-pulse rounded-[var(--semantic-radius-badge)]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-muted h-6 w-1/2 animate-pulse rounded-[var(--semantic-radius-input)]" />
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded-[var(--semantic-radius-input)]" />
            </div>
          </div>
          {/* Action button skeleton */}
          <div className="bg-muted h-9 w-10 flex-shrink-0 animate-pulse rounded-[var(--semantic-radius-button)]" />
        </div>
      </CardContent>
    </Card>
  );
}

ResourceCardSkeleton.displayName = 'ResourceCardSkeleton';
