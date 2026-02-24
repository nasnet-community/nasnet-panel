// libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizardSkeleton.tsx
import { memo } from 'react';
import { Skeleton, Card } from '@nasnet/ui/primitives';

/**
 * Desktop skeleton (>1024px)
 *
 * Pulse animation skeleton matching desktop presenter layout.
 * Shows header, horizontal stepper, and content card placeholders.
 *
 * @see TroubleshootWizardDesktop for full component
 */
const TroubleshootWizardSkeletonDesktopComponent = memo(
  function TroubleshootWizardSkeletonDesktop() {
    return (
      <div className="space-y-component-lg animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Horizontal stepper skeleton */}
        <div className="flex justify-between items-center px-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-component-sm">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <Card className="p-component-lg">
          <div className="space-y-component-md">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            {/* Fix suggestion skeleton */}
            <div className="mt-component-lg p-component-md border rounded-[var(--semantic-radius-button)] space-y-component-sm">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-component-md mt-component-md">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

TroubleshootWizardSkeletonDesktopComponent.displayName =
  'TroubleshootWizardSkeletonDesktop';

export const TroubleshootWizardSkeletonDesktop =
  TroubleshootWizardSkeletonDesktopComponent;

/**
 * Mobile skeleton (<640px)
 *
 * Pulse animation skeleton matching mobile presenter layout.
 * Shows progress bar, step cards, and bottom action buttons.
 *
 * @see TroubleshootWizardMobile for full component
 */
const TroubleshootWizardSkeletonMobileComponent = memo(
  function TroubleshootWizardSkeletonMobile() {
    return (
      <div className="space-y-component-md animate-pulse p-component-md">
        {/* Progress bar skeleton */}
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-20" />
        {/* Step cards skeleton */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-component-md">
            <div className="flex items-center gap-component-md">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-component-sm">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}

        {/* Action buttons skeleton */}
        <div className="fixed bottom-0 left-0 right-0 p-component-md bg-background border-t">
          <div className="flex gap-component-md">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>
      </div>
    );
  }
);

TroubleshootWizardSkeletonMobileComponent.displayName =
  'TroubleshootWizardSkeletonMobile';

export const TroubleshootWizardSkeletonMobile =
  TroubleshootWizardSkeletonMobileComponent;

/**
 * Auto-selecting skeleton based on viewport
 *
 * Renders either desktop or mobile skeleton depending on breakpoint.
 * Uses `hidden` + `lg:block` pattern for responsive display.
 */
const TroubleshootWizardSkeletonComponent = memo(
  function TroubleshootWizardSkeleton() {
    return (
      <>
        <div className="hidden lg:block">
          <TroubleshootWizardSkeletonDesktop />
        </div>
        <div className="lg:hidden">
          <TroubleshootWizardSkeletonMobile />
        </div>
      </>
    );
  }
);

TroubleshootWizardSkeletonComponent.displayName = 'TroubleshootWizardSkeleton';

export const TroubleshootWizardSkeleton = TroubleshootWizardSkeletonComponent;
