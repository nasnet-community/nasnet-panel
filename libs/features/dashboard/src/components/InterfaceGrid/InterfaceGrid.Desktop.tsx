/**
 * InterfaceGrid Desktop Presenter
 *
 * Desktop-optimized 4-column grid layout for interface cards.
 * Features:
 * - 4-column responsive grid
 * - Show all / Show less toggle for >8 interfaces
 * - Loading skeleton state (4 cards)
 * - Error state with retry button
 * - Empty state with helpful message
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  Skeleton,
  Button,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/primitives';
import { RefreshCw, AlertCircle, Network } from 'lucide-react';
import { useInterfaces } from './useInterfaces';
import { InterfaceStatusCardDesktop } from './InterfaceStatusCard.Desktop';
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { InterfaceGridProps, InterfaceGridData } from './types';

const MAX_VISIBLE = 8;

/**
 * Desktop presenter for InterfaceGrid.
 * 4-column grid with full feature set.
 */
export function InterfaceGridDesktop({
  deviceId,
  className,
}: InterfaceGridProps) {
  const { interfaces, isLoading, error, refetch } = useInterfaces({
    deviceId,
  });
  const [showAll, setShowAll] = useState(false);
  const [selectedInterface, setSelectedInterface] =
    useState<InterfaceGridData | null>(null);

  const visibleInterfaces = showAll
    ? interfaces
    : interfaces.slice(0, MAX_VISIBLE);
  const hasMore = interfaces.length > MAX_VISIBLE;

  // Loading state: 4 skeleton cards
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-4 gap-4', className)}>
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

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load interfaces: {error.message}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Retry loading interfaces">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (interfaces.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Network className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-lg font-medium">No interfaces found</p>
          <p className="text-sm text-muted-foreground">
            The router doesn't have any network interfaces configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Grid of interface cards - 4 columns on desktop */}
      <div className="grid grid-cols-4 gap-4" role="list" aria-label="Network interfaces">
        {visibleInterfaces.map((iface) => (
          <InterfaceStatusCardDesktop
            key={iface.id}
            interface={iface}
            onSelect={setSelectedInterface}
          />
        ))}
      </div>

      {/* Show all toggle */}
      {hasMore && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `Show all (${interfaces.length})`}
          </Button>
        </div>
      )}

      {/* Detail sheet */}
      <InterfaceDetailSheet
        interface={selectedInterface}
        open={!!selectedInterface}
        onOpenChange={(open) => !open && setSelectedInterface(null)}
      />
    </div>
  );
}
