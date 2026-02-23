/**
 * InterfaceGrid Desktop Presenter
 *
 * Desktop-optimized 4-column grid layout for interface status cards.
 * Displays full feature set with all interface details visible without expand.
 *
 * Features:
 * - 4-column responsive grid (pro-grade density)
 * - Show all / Show less toggle for >8 interfaces (pagination UI)
 * - Loading skeleton state (4 card skeletons)
 * - Error state with actionable retry button
 * - Empty state with helpful icon and messaging
 * - WCAG AAA keyboard navigation (grid with list semantics)
 * - Clickable cards with detail sheet overlay
 *
 * @see InterfaceGrid.tsx for auto-detection wrapper
 * @see InterfaceGrid.Mobile.tsx for 2-column variant
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
import { InterfaceStatusCardDesktop } from './InterfaceStatusCard.Desktop';
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { InterfaceGridProps, InterfaceGridData } from './types';

/**
 * Maximum number of interfaces shown before "Show all" pagination toggle.
 * Desktop breakpoint shows all interfaces without initial limit.
 */
const MAX_VISIBLE_INTERFACES = 8;

/**
 * Desktop presenter for InterfaceGrid.
 *
 * Renders a 4-column grid optimized for power users with dense information layout.
 * All interface details visible without expand/collapse (desktop paradigm).
 *
 * @param props - Component props
 * @param props.deviceId - Router UUID
 * @param props.className - Optional custom CSS classes
 * @returns Desktop presenter JSX
 */
export const InterfaceGridDesktop = memo(
  function InterfaceGridDesktop({ deviceId, className }: InterfaceGridProps) {
    const { interfaces, isLoading, error, refetch } = useInterfaces({
      deviceId,
    });
    const [showAll, setShowAll] = useState(false);
    const [selectedInterface, setSelectedInterface] =
      useState<InterfaceGridData | null>(null);

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

    // Loading state: 4 skeleton cards
    if (isLoading) {
      return (
        <div
          className={cn('grid grid-cols-4 gap-4', className)}
          role="status"
          aria-label="Loading interfaces"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16 mb-4" />
                <div className="flex gap-4">
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
        <Alert variant="destructive" className={className}>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Failed to load interfaces: {error.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              aria-label="Retry loading interfaces"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
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
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Network
              className="h-12 w-12 text-muted-foreground mb-4"
              aria-hidden="true"
            />
            <p className="text-lg font-semibold">No interfaces found</p>
            <p className="text-sm text-muted-foreground mt-1">
              The router doesn't have any network interfaces configured.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={className}>
        {/* Grid of interface cards - 4 columns on desktop */}
        <div
          className="grid grid-cols-4 gap-4"
          role="list"
          aria-label="Network interfaces"
        >
          {visibleInterfaces.map((iface) => (
            <div key={iface.id} role="listitem">
              <InterfaceStatusCardDesktop
                interface={iface}
                onSelect={handleSelectInterface}
              />
            </div>
          ))}
        </div>

        {/* Show all / Show less pagination toggle */}
        {hasMore && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={handleToggleShowAll}
              aria-label={
                showAll
                  ? `Show only first ${MAX_VISIBLE_INTERFACES} interfaces`
                  : `Show all ${interfaces.length} interfaces`
              }
            >
              {showAll
                ? 'Show less'
                : `Show all (${interfaces.length} total)`}
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
  },
);

InterfaceGridDesktop.displayName = 'InterfaceGridDesktop';
