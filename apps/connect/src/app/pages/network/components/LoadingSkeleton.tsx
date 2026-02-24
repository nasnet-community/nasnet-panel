/**
 * Loading Skeleton Component
 * Simplified layout skeleton matching new dashboard design
 */

import React from 'react';

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-md md:py-component-lg space-y-component-md max-w-7xl mx-auto animate-pulse">
      {/* Interfaces Section Skeleton */}
      <div className="space-y-component-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-5 bg-muted rounded-full w-10" />
          </div>
          <div className="h-4 bg-muted rounded w-16" />
        </div>

        <div className="grid gap-component-sm md:gap-component-md md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card rounded-card-sm p-component-md border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <div className="w-4 h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
                <div className="w-4 h-4 bg-muted rounded" />
              </div>
              <div className="flex gap-component-md">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section Skeleton */}
      <div className="grid gap-component-md lg:grid-cols-2">
        {/* Connected Devices Skeleton */}
        <div className="bg-card rounded-card-lg border border-border p-component-md">
          <div className="flex items-center gap-component-sm mb-component-md">
            <div className="w-8 h-8 bg-muted rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
          <div className="flex gap-component-md mb-component-md">
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
          <div className="space-y-component-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </div>

        {/* IP Addresses Skeleton */}
        <div className="bg-card rounded-card-lg border border-border p-component-md">
          <div className="flex items-center gap-component-sm mb-component-md">
            <div className="w-8 h-8 bg-muted rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-28" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
          <div className="space-y-component-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* DHCP Section Skeleton */}
      <div className="bg-card rounded-card-lg border border-border p-component-md">
        <div className="flex items-center justify-between mb-component-md">
          <div className="flex items-center gap-component-sm">
            <div className="w-8 h-8 bg-muted rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>
          <div className="h-6 bg-muted rounded w-12" />
        </div>
        <div className="h-2 bg-muted rounded-full mb-component-md" />
        <div className="grid grid-cols-4 gap-component-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-component-sm bg-muted rounded-lg">
              <div className="h-6 bg-muted rounded w-10 mx-auto mb-component-sm" />
              <div className="h-3 bg-muted rounded w-14 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
