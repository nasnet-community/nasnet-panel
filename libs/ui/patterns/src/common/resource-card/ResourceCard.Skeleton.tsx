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
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Status badge skeleton */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-16 bg-muted rounded-[var(--semantic-radius-badge)] animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-6 w-1/2 bg-muted rounded-[var(--semantic-radius-input)] animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded-[var(--semantic-radius-input)] animate-pulse" />
            </div>
          </div>
          {/* Action button skeleton */}
          <div className="h-9 w-10 bg-muted rounded-[var(--semantic-radius-button)] animate-pulse flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

ResourceCardSkeleton.displayName = 'ResourceCardSkeleton';
