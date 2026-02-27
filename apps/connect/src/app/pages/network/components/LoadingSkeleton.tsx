/**
 * Loading Skeleton Component
 * Simplified layout skeleton matching new dashboard design
 */

import React from 'react';

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-md md:py-component-lg space-y-component-md mx-auto max-w-7xl animate-pulse">
      {/* Interfaces Section Skeleton */}
      <div className="space-y-component-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-muted h-4 w-4 rounded" />
            <div className="bg-muted h-4 w-20 rounded" />
            <div className="bg-muted h-5 w-10 rounded-full" />
          </div>
          <div className="bg-muted h-4 w-16 rounded" />
        </div>

        <div className="gap-component-sm md:gap-component-md grid md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card rounded-card-sm p-component-md border-border border shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-2 w-2 rounded-full" />
                  <div className="bg-muted h-4 w-4 rounded" />
                  <div className="bg-muted h-4 w-20 rounded" />
                </div>
                <div className="bg-muted h-4 w-4 rounded" />
              </div>
              <div className="gap-component-md flex">
                <div className="bg-muted h-3 w-16 rounded" />
                <div className="bg-muted h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section Skeleton */}
      <div className="gap-component-md grid lg:grid-cols-2">
        {/* Connected Devices Skeleton */}
        <div className="bg-card rounded-card-lg border-border p-component-md border shadow-sm">
          <div className="gap-component-sm mb-component-md flex items-center">
            <div className="bg-muted h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <div className="bg-muted h-4 w-32 rounded" />
              <div className="bg-muted h-3 w-20 rounded" />
            </div>
          </div>
          <div className="gap-component-md mb-component-md flex">
            <div className="bg-muted h-4 w-20 rounded" />
            <div className="bg-muted h-4 w-20 rounded" />
          </div>
          <div className="space-y-component-sm">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted h-12 rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* IP Addresses Skeleton */}
        <div className="bg-card rounded-card-lg border-border p-component-md border shadow-sm">
          <div className="gap-component-sm mb-component-md flex items-center">
            <div className="bg-muted h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <div className="bg-muted h-4 w-28 rounded" />
              <div className="bg-muted h-3 w-16 rounded" />
            </div>
          </div>
          <div className="space-y-component-sm">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted h-12 rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>

      {/* DHCP Section Skeleton */}
      <div className="bg-card rounded-card-lg border-border p-component-md border shadow-sm">
        <div className="mb-component-md flex items-center justify-between">
          <div className="gap-component-sm flex items-center">
            <div className="bg-muted h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <div className="bg-muted h-4 w-32 rounded" />
              <div className="bg-muted h-3 w-24 rounded" />
            </div>
          </div>
          <div className="bg-muted h-6 w-12 rounded" />
        </div>
        <div className="bg-muted mb-component-md h-2 rounded-full" />
        <div className="gap-component-sm grid grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-component-sm bg-muted rounded-lg text-center"
            >
              <div className="bg-muted mb-component-sm mx-auto h-6 w-10 rounded" />
              <div className="bg-muted mx-auto h-3 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
