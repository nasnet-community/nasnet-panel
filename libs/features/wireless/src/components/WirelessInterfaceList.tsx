/**
 * WirelessInterfaceList Component
 * Displays a list of wireless interfaces with loading and empty states
 * Implements responsive grid layout (stacked mobile, 2-column tablet+)
 */

import * as React from 'react';
import { Wifi } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { WirelessInterfaceCard } from './WirelessInterfaceCard';
import { useWirelessInterfaces } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { Icon } from '@nasnet/ui/primitives';

/**
 * Skeleton loader for wireless interface cards
 * Matches final component structure to prevent layout shift
 */
const WirelessInterfaceSkeleton = React.memo(function WirelessInterfaceSkeletonComponent() {
  return (
    <div
      className="rounded-card-lg border-border p-component-md space-y-component-md animate-pulse border"
      role="status"
      aria-label="Loading wireless interface"
    >
      <div className="flex items-start justify-between">
        <div className="gap-component-sm flex items-center">
          <div className="bg-muted h-9 w-9 rounded-lg" />
          <div className="space-y-component-sm">
            <div className="bg-muted h-5 w-24 rounded" />
            <div className="bg-muted h-4 w-32 rounded" />
          </div>
        </div>
        <div className="bg-muted rounded-pill h-6 w-16" />
      </div>
      <div className="gap-component-md flex items-center">
        <div className="bg-muted h-5 w-16 rounded-md" />
        <div className="bg-muted h-5 w-20 rounded-md" />
      </div>
    </div>
  );
});

/**
 * Empty state component when no wireless interfaces are found
 * Encouraging and helpful, not intimidating
 */
const WirelessInterfacesEmpty = React.memo(function WirelessInterfacesEmptyComponent() {
  return (
    <div
      className="px-component-md flex flex-col items-center justify-center py-16 text-center"
      role="status"
    >
      <div className="p-component-lg bg-muted mb-component-md rounded-full">
        <Icon
          icon={Wifi}
          size="lg"
          className="text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <h3 className="font-display text-foreground mb-component-sm text-lg font-semibold">
        No wireless interfaces found
      </h3>
      <p className="text-muted-foreground max-w-md text-sm">
        Your router doesn't appear to have any wireless interfaces configured. This is normal for
        routers without WiFi capabilities.
      </p>
    </div>
  );
});

/**
 * Error state component when API request fails
 */
const WirelessInterfacesError = React.memo(function WirelessInterfacesErrorComponent({
  error,
}: {
  error: Error;
}) {
  const handleRetry = React.useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div
      className="px-component-md flex flex-col items-center justify-center py-16 text-center"
      role="alert"
    >
      <div className="p-component-lg bg-error/10 mb-component-md rounded-full">
        <Icon
          icon={Wifi}
          size="lg"
          className="text-error"
          aria-hidden="true"
        />
      </div>
      <h3 className="font-display text-foreground mb-component-sm text-lg font-semibold">
        Failed to load wireless interfaces
      </h3>
      <p className="text-muted-foreground mb-component-md max-w-md text-sm">
        {error.message || 'An error occurred while loading wireless interfaces'}
      </p>
      <button
        onClick={handleRetry}
        type="button"
        className="px-component-md py-component-sm bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-[44px] rounded-[var(--semantic-radius-button)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
});

/**
 * Main list component for wireless interfaces
 * - Fetches data using useWirelessInterfaces hook
 * - Shows skeleton loading state
 * - Shows empty state when no interfaces exist
 * - Shows error state on API failure
 * - Displays interfaces in responsive grid
 * - Navigates to detail view on card click
 *
 * @description Responsive list of wireless interfaces with professional loading/error states
 *
 * @example
 * ```tsx
 * <WirelessInterfaceList routerId="router-1" />
 * ```
 */
interface WirelessInterfaceListProps {
  routerId: string;
}

function WirelessInterfaceListComponent({ routerId }: WirelessInterfaceListProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: interfaces, isLoading, error } = useWirelessInterfaces(routerIp);
  const navigate = useNavigate();

  // Memoize click handler for interface cards
  const handleInterfaceClick = React.useCallback(
    (interfaceName: string) => {
      navigate({ to: `/router/${routerId}/wifi/${interfaceName}` as '/' });
    },
    [routerId, navigate]
  );

  // Loading state: show skeleton cards
  if (isLoading) {
    return (
      <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
        <WirelessInterfaceSkeleton />
        <WirelessInterfaceSkeleton />
        <WirelessInterfaceSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return <WirelessInterfacesError error={error} />;
  }

  // Empty state: no interfaces found
  if (!interfaces || interfaces.length === 0) {
    return <WirelessInterfacesEmpty />;
  }

  // Success state: display interface cards in responsive grid
  return (
    <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
      {interfaces.map((iface) => (
        <WirelessInterfaceCard
          key={iface.id}
          interface={iface}
          onClick={() => handleInterfaceClick(iface.name)}
        />
      ))}
    </div>
  );
}

export const WirelessInterfaceList = React.memo(WirelessInterfaceListComponent);
WirelessInterfaceList.displayName = 'WirelessInterfaceList';
