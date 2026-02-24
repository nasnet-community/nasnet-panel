/**
 * InterfaceDetailSheet Component
 *
 * Displays expanded interface details in a sheet (mobile/tablet) or dialog (desktop).
 *
 * Shows:
 * - MAC address, IP address
 * - MTU, Link Speed
 * - Running status
 * - Comment/description
 * - Link partner info
 * - Last seen timestamp (for down interfaces)
 * - Navigation to Network section
 */

import React, { useCallback, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from '@nasnet/ui/primitives';
import { usePlatform } from '@nasnet/ui/layouts';
import { Link } from '@tanstack/react-router';
import { InterfaceTypeIcon } from '@nasnet/ui/patterns/network-inputs/interface-selector';
import { ExternalLink } from 'lucide-react';
import type { InterfaceDetailSheetProps } from './types';

/**
 * Detail sheet/dialog for interface information.
 * Shows MAC, MTU, running status, comment, link partner.
 * Uses Dialog on desktop, Sheet on mobile/tablet.
 *
 * @description
 * Adaptive component that renders as a dialog on desktop screens and
 * a bottom sheet on mobile/tablet for better touch interaction.
 * Displays complete interface details including MAC address (font-mono),
 * IP address (font-mono), MTU, link speed, and operational status.
 *
 * @example
 * <InterfaceDetailSheet
 *   interface={selectedInterface}
 *   open={!!selectedInterface}
 *   onOpenChange={(open) => !open && setSelectedInterface(null)}
 * />
 */
const InterfaceDetailSheetComponent = React.memo(function InterfaceDetailSheet({
  interface: iface,
  open,
  onOpenChange,
}: InterfaceDetailSheetProps) {
  const platform = usePlatform();
  const isDesktop = platform === 'desktop';

  // Memoize openChange callback
  const memoizedOnOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const content = useMemo(() => {
    if (!iface) return null;

    return (
      <div className="space-y-component-md">
        {/* Interface header */}
        <div className="flex items-center gap-component-sm">
          <InterfaceTypeIcon type={iface.type} className="h-8 w-8" />
          <div>
            <p className="font-semibold text-lg">{iface.name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {iface.type}
            </p>
          </div>
        </div>

        {/* Details grid - MAC and IP use font-mono for technical data (WCAG AAA) */}
        <dl className="grid grid-cols-2 gap-x-component-md gap-y-component-sm text-sm">
          <dt className="text-muted-foreground">MAC Address</dt>
          <dd className="font-mono text-xs break-all">{iface.mac || 'N/A'}</dd>

          <dt className="text-muted-foreground">IP Address</dt>
          <dd className="font-mono text-xs break-all">
            {iface.ip || 'Not assigned'}
          </dd>

          <dt className="text-muted-foreground">MTU</dt>
          <dd>{iface.mtu}</dd>

          <dt className="text-muted-foreground">Link Speed</dt>
          <dd>{iface.linkSpeed || 'N/A'}</dd>

          <dt className="text-muted-foreground">Running</dt>
          <dd>{iface.running ? 'Yes' : 'No'}</dd>

          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{iface.status}</dd>

          {iface.linkPartner && (
            <>
              <dt className="text-muted-foreground">Link Partner</dt>
              <dd>{iface.linkPartner}</dd>
            </>
          )}

          {iface.comment && (
            <>
              <dt className="text-muted-foreground">Comment</dt>
              <dd className="col-span-2">{iface.comment}</dd>
            </>
          )}

          {iface.lastSeen && iface.status === 'down' && (
            <>
              <dt className="text-muted-foreground">Last Seen</dt>
              <dd>{new Date(iface.lastSeen).toLocaleString()}</dd>
            </>
          )}
        </dl>

        {/* Navigation link */}
        <Link
          to="/network/interfaces/$interfaceId"
          params={{ interfaceId: iface.id }}
          className="inline-flex items-center gap-component-sm text-primary hover:underline mt-component-md"
        >
          <Button variant="outline" size="sm" className="gap-component-sm">
            View in Network
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }, [iface]);

  if (!content) return null;

  // Desktop: use Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={memoizedOnOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Interface Details</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile/Tablet: use Sheet
  return (
    <Sheet open={open} onOpenChange={memoizedOnOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Interface Details</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
});

InterfaceDetailSheetComponent.displayName = 'InterfaceDetailSheet';

export { InterfaceDetailSheetComponent as InterfaceDetailSheet };
