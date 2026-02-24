/**
 * WiFi Dashboard Loading Skeleton
 * Shows placeholder content while data is loading
 */

import React from 'react';

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 bg-muted rounded w-40 mb-2" />
          <div className="h-4 bg-muted rounded w-56" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded w-24" />
          <div className="h-9 bg-muted rounded w-28" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted rounded-xl p-3 md:p-4">
            <div className="h-4 bg-muted rounded w-12 mb-2" />
            <div className="h-6 bg-muted rounded w-8 mb-1" />
            <div className="h-1.5 bg-muted rounded-full mt-2" />
          </div>
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="h-5 bg-muted rounded w-36" />

      {/* Interface cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-card-lg border border-border p-component-md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-muted" />
                <div>
                  <div className="h-5 bg-muted rounded w-24 mb-1" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-5 bg-muted rounded w-16" />
              <div className="h-5 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Clients table skeleton */}
      <div className="h-5 bg-muted rounded w-40" />
      <div className="bg-card rounded-card-sm border border-border p-component-md">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';





















