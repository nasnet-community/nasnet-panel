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
export function OverlapWarning({ overlap, onShowDetails, className }: OverlapWarningProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleShowDetails = React.useCallback(() => {
    setDialogOpen(true);
    onShowDetails?.();
  }, [onShowDetails]);

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={handleShowDetails}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1',
            'bg-warning/10 text-warning hover:bg-warning/20',
            'cursor-pointer transition-colors',
            'focus:ring-warning focus:outline-none focus:ring-2 focus:ring-offset-2',
            className
          )}
          aria-label="Subnet overlap warning - click for details"
        >
          <AlertTriangle
            className="h-4 w-4"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">Overlap Detected</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-warning flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Subnet Overlap Detected
          </DialogTitle>
          <DialogDescription>
            The subnet you entered conflicts with an existing resource.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="border-warning/20 bg-warning/5 rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Conflicting Resource</span>
                <Badge
                  variant="outline"
                  className="font-mono"
                >
                  {overlap.resourceType}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Name</span>
                <span className="font-medium">{overlap.resourceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Subnet</span>
                <span className="font-mono">{overlap.overlappingCidr}</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
            <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-muted-foreground text-sm">
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
export function OverlapBadge({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('border-warning/50 text-warning hover:bg-warning/10 cursor-pointer', className)}
      onClick={onClick}
    >
      <AlertTriangle className="mr-1 h-3 w-3" />
      Overlap
    </Badge>
  );
}

OverlapWarning.displayName = 'OverlapWarning';
OverlapBadge.displayName = 'OverlapBadge';
