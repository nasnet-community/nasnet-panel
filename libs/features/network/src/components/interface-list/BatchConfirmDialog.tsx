import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from '@nasnet/ui/primitives';
import { BatchInterfaceAction } from '@nasnet/api-client/generated';

export interface BatchConfirmDialogProps {
  open: boolean;
  action: BatchInterfaceAction | null;
  interfaces: any[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Batch Confirm Dialog Component
 * Provides safety confirmation for batch operations with countdown for dangerous actions
 */
export function BatchConfirmDialog({
  open,
  action,
  interfaces,
  onConfirm,
  onCancel,
}: BatchConfirmDialogProps) {
  const [countdown, setCountdown] = useState(3);

  // Detect if any interface is used by gateway (critical)
  const hasGateway = interfaces.some(
    (iface) => iface.usedBy && iface.usedBy.includes('gateway')
  );

  // Detect if disabling operation on gateway interface
  const isCritical = action === BatchInterfaceAction.Disable && hasGateway;

  // Countdown timer for critical operations
  useEffect(() => {
    if (open && isCritical) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [open, isCritical]);

  if (!action) return null;

  const actionLabel = action === BatchInterfaceAction.Disable
    ? 'Disable'
    : action === BatchInterfaceAction.Enable
    ? 'Enable'
    : 'Update';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionLabel} {interfaces.length} Interface{interfaces.length !== 1 ? 's' : ''}?
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              {isCritical && (
                <div className="p-3 border border-destructive bg-destructive/10 rounded-md">
                  <p className="text-destructive font-semibold text-sm">
                    ⚠️ Warning: Critical Operation
                  </p>
                  <p className="text-sm mt-1">
                    This will disable interfaces used by the gateway. You may lose connection to the router.
                  </p>
                </div>
              )}

              <p className="text-sm">
                {action === BatchInterfaceAction.Disable
                  ? 'This will disable the following interfaces:'
                  : action === BatchInterfaceAction.Enable
                  ? 'This will enable the following interfaces:'
                  : 'This will update the following interfaces:'}
              </p>

              {/* Interface list */}
              <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {interfaces.map((iface) => {
                    const isGateway = iface.usedBy && iface.usedBy.includes('gateway');
                    return (
                      <div
                        key={iface.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          isGateway ? 'bg-destructive/10 border border-destructive' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{iface.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {iface.type}
                          </Badge>
                        </div>
                        {isGateway && (
                          <Badge variant="error" className="text-xs">
                            Gateway
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isCritical && (
                <p className="text-xs text-muted-foreground">
                  This action can be undone by running the opposite operation.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={isCritical && countdown > 0}
            className={isCritical ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isCritical && countdown > 0
              ? `Confirm (${countdown})`
              : `Confirm ${actionLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
