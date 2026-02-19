/**
 * InterfaceGrid Mobile Presenter
 *
 * Mobile-optimized 2-column grid layout for interface cards.
 * Uses compact mobile cards with 44px touch targets.
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
import { InterfaceStatusCardMobile } from './InterfaceStatusCard.Mobile';
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { InterfaceGridProps, InterfaceGridData } from './types';

const MAX_VISIBLE = 8;

/**
 * Mobile presenter for InterfaceGrid.
 * 2-column grid with compact cards and large touch targets.
 */
export function InterfaceGridMobile({ deviceId, className }: InterfaceGridProps) {
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

  // Loading state: 2 skeleton cards
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
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
        <AlertDescription className="flex flex-col gap-2">
          <span className="text-sm">Failed to load interfaces: {error.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="w-full"
          >
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
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Network className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-base font-medium">No interfaces found</p>
          <p className="text-xs text-muted-foreground">
            No network interfaces configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Grid of interface cards - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-2" role="list" aria-label="Network interfaces">
        {visibleInterfaces.map((iface) => (
          <InterfaceStatusCardMobile
            key={iface.id}
            interface={iface}
            onSelect={setSelectedInterface}
          />
        ))}
      </div>

      {/* Show all toggle */}
      {hasMore && (
        <div className="mt-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
          >
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
