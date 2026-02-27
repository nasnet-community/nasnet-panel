/**
 * WiFi Dashboard Loading Skeleton
 * Shows placeholder content while data is loading
 */

import React from 'react';

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted mb-2 h-7 w-40 rounded" />
          <div className="bg-muted h-4 w-56 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="bg-muted h-9 w-24 rounded" />
          <div className="bg-muted h-9 w-28 rounded" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-muted rounded-xl p-3 md:p-4"
          >
            <div className="bg-muted mb-2 h-4 w-12 rounded" />
            <div className="bg-muted mb-1 h-6 w-8 rounded" />
            <div className="bg-muted mt-2 h-1.5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="bg-muted h-5 w-36 rounded" />

      {/* Interface cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card rounded-card-sm border-border p-component-md border shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-muted h-9 w-9 rounded-lg" />
                <div>
                  <div className="bg-muted mb-1 h-5 w-24 rounded" />
                  <div className="bg-muted h-4 w-32 rounded" />
                </div>
              </div>
              <div className="bg-muted h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-muted h-5 w-16 rounded" />
              <div className="bg-muted h-5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Clients table skeleton */}
      <div className="bg-muted h-5 w-40 rounded" />
      <div className="bg-card rounded-card-sm border-border p-component-md border shadow-sm">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted h-12 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
