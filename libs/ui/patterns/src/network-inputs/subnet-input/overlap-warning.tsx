/**
 * OverlapWarning Component
 * Displays a warning when the entered subnet overlaps with existing resources
 *
 * Uses semantic warning tokens from the design system.
 *
 * @example
 * ```tsx
 * <OverlapWarning
 *   overlap={{
 *     overlappingCidr: '192.168.1.0/24',
 *     resourceName: 'LAN Pool',
 *     resourceType: 'DHCP Pool',
 *   }}
 *   onShowDetails={() => openDetailsDialog()}
 * />
 * ```
 */

import * as React from 'react';

import { AlertTriangle, Info } from 'lucide-react';

import {
  cn,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@nasnet/ui/primitives';

import type { OverlapWarningProps } from './subnet-input.types';

/**
 * OverlapWarning Component
 *
 * Displays a warning badge/alert when subnet overlap is detected.
 * Clickable to show detailed overlap information.
 */
export function OverlapWarning({
  overlap,
  onShowDetails,
  className,
}: OverlapWarningProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleShowDetails = React.useCallback(() => {
    setDialogOpen(true);
    onShowDetails?.();
  }, [onShowDetails]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={handleShowDetails}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
            'bg-warning/10 text-warning hover:bg-warning/20',
            'transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2',
            className
          )}
          aria-label="Subnet overlap warning - click for details"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Overlap Detected</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Subnet Overlap Detected
          </DialogTitle>
          <DialogDescription>
            The subnet you entered conflicts with an existing resource.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conflicting Resource</span>
                <Badge variant="outline" className="font-mono">
                  {overlap.resourceType}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-medium">{overlap.resourceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subnet</span>
                <span className="font-mono">{overlap.overlappingCidr}</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Overlapping subnets can cause routing conflicts and unexpected network behavior.
              Consider using a different IP range or adjusting the prefix length.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact badge version for inline use
 */
export function OverlapBadge({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'cursor-pointer border-warning/50 text-warning hover:bg-warning/10',
        className
      )}
      onClick={onClick}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Overlap
    </Badge>
  );
}

OverlapWarning.displayName = 'OverlapWarning';
OverlapBadge.displayName = 'OverlapBadge';
