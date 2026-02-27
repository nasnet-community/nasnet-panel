/**
 * InterfaceGrid Tablet Presenter
 *
 * Tablet-optimized 3-column grid layout for interface status cards.
 * Balances information density with touch-friendly interaction.
 *
 * Features:
 * - 3-column responsive grid (tablet breakpoint 640–1024px)
 * - 38–44px touch targets (WCAG AAA compliance)
 * - Balanced information density between mobile and desktop
 * - Show all / Show less toggle for >8 interfaces
 * - Loading skeleton state (3 card skeletons)
 * - Error state with actionable retry button
 * - Empty state with helpful icon and messaging
 * - Sheet overlay for interface details
 *
 * @see InterfaceGrid.tsx for auto-detection wrapper
 * @see InterfaceGrid.Desktop.tsx for 4-column variant
 * @see InterfaceGrid.Mobile.tsx for 2-column variant
 */

import { memo, useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Skeleton,
  Button,
  Alert,
  AlertDescription,
  cn,
} from '@nasnet/ui/primitives';
import { RefreshCw, AlertCircle, Network } from 'lucide-react';
import { useInterfaces } from './useInterfaces';
import { InterfaceStatusCardDesktop } from './InterfaceStatusCard.Desktop';
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { InterfaceGridProps, InterfaceGridData } from './types';

/**
 * Maximum number of interfaces shown before "Show all" pagination toggle.
 * Tablet shows reasonable number before requiring scroll.
 */
const MAX_VISIBLE_INTERFACES = 8;

/**
 * Tablet presenter for InterfaceGrid.
 *
 * Renders a 3-column grid optimized for tablets with balanced density.
 * Bridges mobile simplicity and desktop power-user features (tablet paradigm).
 *
 * @param props - Component props
 * @param props.deviceId - Router UUID
 * @param props.className - Optional custom CSS classes
 * @returns Tablet presenter JSX
 */
export const InterfaceGridTablet = memo(function InterfaceGridTablet({
  deviceId,
  className,
}: InterfaceGridProps) {
  const { interfaces, isLoading, error, refetch } = useInterfaces({
    deviceId,
  });
  const [showAll, setShowAll] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<InterfaceGridData | null>(null);

  // Memoized pagination logic
  const { visibleInterfaces, hasMore } = useMemo(() => {
    const visible = showAll ? interfaces : interfaces.slice(0, MAX_VISIBLE_INTERFACES);
    return {
      visibleInterfaces: visible,
      hasMore: interfaces.length > MAX_VISIBLE_INTERFACES,
    };
  }, [interfaces, showAll]);

  // Memoized callbacks for event handlers
  const handleToggleShowAll = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  const handleSelectInterface = useCallback((iface: InterfaceGridData) => {
    setSelectedInterface(iface);
  }, []);

  const handleDetailSheetOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedInterface(null);
    }
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state: 3 skeleton cards
  if (isLoading) {
    return (
      <div
        className={cn('gap-component-sm grid grid-cols-3', className)}
        role="status"
        aria-label="Loading interfaces"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-component-md">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="mb-component-md h-3 w-16" />
              <div className="gap-component-md flex">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state: actionable error message with retry
  if (error) {
    return (
      <Alert
        variant="destructive"
        className={className}
      >
        <AlertCircle
          className="h-4 w-4"
          aria-hidden="true"
        />
        <AlertDescription className="gap-component-md flex items-center justify-between">
          <span>Failed to load interfaces: {error.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            aria-label="Retry loading interfaces"
          >
            <RefreshCw
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state: helpful message with icon
  if (interfaces.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-component-lg flex flex-col items-center justify-center text-center">
          <Network
            className="text-muted-foreground mb-component-md h-12 w-12"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold">No interfaces found</p>
          <p className="text-muted-foreground mt-component-sm text-sm">
            The router doesn't have any network interfaces configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Grid of interface cards - 3 columns on tablet */}
      <div
        className="gap-component-sm grid grid-cols-3"
        role="list"
        aria-label="Network interfaces"
      >
        {visibleInterfaces.map((iface) => (
          <div
            key={iface.id}
            role="listitem"
          >
            <InterfaceStatusCardDesktop
              interface={iface}
              onSelect={handleSelectInterface}
            />
          </div>
        ))}
      </div>

      {/* Show all / Show less pagination toggle */}
      {hasMore && (
        <div className="mt-component-md text-center">
          <Button
            variant="ghost"
            onClick={handleToggleShowAll}
            aria-label={
              showAll ?
                `Show only first ${MAX_VISIBLE_INTERFACES} interfaces`
              : `Show all ${interfaces.length} interfaces`
            }
          >
            {showAll ? 'Show less' : `Show all (${interfaces.length} total)`}
          </Button>
        </div>
      )}

      {/* Detail sheet overlay for selected interface */}
      <InterfaceDetailSheet
        interface={selectedInterface}
        open={!!selectedInterface}
        onOpenChange={handleDetailSheetOpenChange}
      />
    </div>
  );
});

InterfaceGridTablet.displayName = 'InterfaceGridTablet';
