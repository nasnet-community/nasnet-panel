/**
 * InterfaceGrid Mobile Presenter
 *
 * Mobile-optimized 2-column grid layout for interface status cards.
 * Emphasizes consumer-grade simplicity with touch-first design.
 *
 * Features:
 * - 2-column responsive grid (mobile breakpoint <640px)
 * - 44x44px minimum touch targets (WCAG AAA compliance)
 * - Compact card layout with essential information only
 * - Show all / Show less toggle for >8 interfaces
 * - Loading skeleton state (2 card skeletons)
 * - Error state with full-width retry button
 * - Empty state with concise messaging
 * - Bottom sheet overlay for interface details
 *
 * @see InterfaceGrid.tsx for auto-detection wrapper
 * @see InterfaceGrid.Desktop.tsx for 4-column variant
 * @see InterfaceGrid.Tablet.tsx for 3-column variant
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
import { InterfaceStatusCardMobile } from './InterfaceStatusCard.Mobile';
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { InterfaceGridProps, InterfaceGridData } from './types';

/**
 * Maximum number of interfaces shown before "Show all" pagination toggle.
 * Mobile keeps this low to avoid overwhelming users with scrolling.
 */
const MAX_VISIBLE_INTERFACES = 8;

/**
 * Mobile presenter for InterfaceGrid.
 *
 * Renders a 2-column grid optimized for touch interaction with 44px touch targets.
 * Emphasizes consumer-grade simplicity over information density (mobile paradigm).
 *
 * @param props - Component props
 * @param props.deviceId - Router UUID
 * @param props.className - Optional custom CSS classes
 * @returns Mobile presenter JSX
 */
export const InterfaceGridMobile = memo(function InterfaceGridMobile({
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

  // Loading state: 2 skeleton cards
  if (isLoading) {
    return (
      <div
        className={cn('gap-component-sm grid grid-cols-2', className)}
        role="status"
        aria-label="Loading interfaces"
      >
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-component-sm">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state: actionable error message with full-width retry button
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
        <AlertDescription className="gap-component-sm flex flex-col">
          <span className="text-sm">Failed to load interfaces: {error.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            aria-label="Retry loading interfaces"
            className="w-full"
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

  // Empty state: concise messaging suitable for mobile
  if (interfaces.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-component-lg flex flex-col items-center justify-center text-center">
          <Network
            className="text-muted-foreground mb-component-sm h-10 w-10"
            aria-hidden="true"
          />
          <p className="text-base font-semibold">No interfaces found</p>
          <p className="text-muted-foreground mt-component-sm text-xs">
            No network interfaces configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Grid of interface cards - 2 columns on mobile */}
      <div
        className="gap-component-sm grid grid-cols-2"
        role="list"
        aria-label="Network interfaces"
      >
        {visibleInterfaces.map((iface) => (
          <div
            key={iface.id}
            role="listitem"
          >
            <InterfaceStatusCardMobile
              interface={iface}
              onSelect={handleSelectInterface}
            />
          </div>
        ))}
      </div>

      {/* Show all / Show less pagination toggle */}
      {hasMore && (
        <div className="mt-component-sm text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleShowAll}
            aria-label={
              showAll ?
                `Show only first ${MAX_VISIBLE_INTERFACES} interfaces`
              : `Show all ${interfaces.length} interfaces`
            }
            className="w-full"
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

InterfaceGridMobile.displayName = 'InterfaceGridMobile';
