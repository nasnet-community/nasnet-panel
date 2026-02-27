import { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@nasnet/ui/utils';
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
import { AlertTriangle } from 'lucide-react';

export interface BatchConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Batch action type (Enable, Disable, Update) */
  action: BatchInterfaceAction | null;
  /** Interfaces affected by batch operation */
  interfaces: any[];
  /** Callback when action is confirmed */
  onConfirm: () => void;
  /** Callback when dialog is cancelled */
  onCancel: () => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * Batch Confirm Dialog Component
 * Provides safety confirmation for batch operations with countdown for dangerous actions.
 * Shows impact analysis and prevents critical operations like disabling gateway interfaces.
 *
 * @example
 * ```tsx
 * <BatchConfirmDialog
 *   open={isOpen}
 *   action={BatchInterfaceAction.Disable}
 *   interfaces={selectedInterfaces}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function BatchConfirmDialog({
  open,
  action,
  interfaces,
  onConfirm,
  onCancel,
  className,
}: BatchConfirmDialogProps) {
  const [countdown, setCountdown] = useState(3);

  // Detect if any interface is used by gateway (critical)
  const hasGateway = useMemo(
    () => interfaces.some((iface) => iface.usedBy && iface.usedBy.includes('gateway')),
    [interfaces]
  );

  // Detect if disabling operation on gateway interface
  const isCritical = useMemo(
    () => action === BatchInterfaceAction.Disable && hasGateway,
    [action, hasGateway]
  );

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

  // Handle cancel with useCallback for stability
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Handle confirm with useCallback for stability
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  if (!action) return null;

  const ACTION_LABELS: Record<string, string> = {
    [BatchInterfaceAction.Disable]: 'Disable',
    [BatchInterfaceAction.Enable]: 'Enable',
  };

  const actionLabel = ACTION_LABELS[action] || 'Update';

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleCancel()}
    >
      <DialogContent className={cn('category-networking', className)}>
        <DialogHeader>
          <DialogTitle>
            {actionLabel} {interfaces.length} Interface{interfaces.length !== 1 ? 's' : ''}?
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-component-sm">
              {isCritical && (
                <div className="p-component-sm border-error bg-error/10 rounded-md border">
                  <div className="gap-component-sm mb-1 flex items-center">
                    <AlertTriangle
                      className="text-error h-4 w-4 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-error text-sm font-semibold">Warning: Critical Operation</p>
                  </div>
                  <p className="mt-1 text-sm">
                    This will disable interfaces used by the gateway. You may lose connection to the
                    router.
                  </p>
                </div>
              )}

              <p className="text-sm">
                {action === BatchInterfaceAction.Disable ?
                  'This will disable the following interfaces:'
                : action === BatchInterfaceAction.Enable ?
                  'This will enable the following interfaces:'
                : 'This will update the following interfaces:'}
              </p>

              {/* Interface list */}
              <div
                className="border-border p-component-sm max-h-64 overflow-y-auto rounded-md border"
                role="region"
                aria-label="Affected interfaces"
              >
                <div className="space-y-component-sm">
                  {interfaces.map((iface) => {
                    const isGateway = iface.usedBy && iface.usedBy.includes('gateway');
                    return (
                      <div
                        key={iface.id}
                        className={cn(
                          'p-component-xs flex items-center justify-between rounded-md',
                          isGateway ? 'bg-error/10 border-error border' : 'bg-muted'
                        )}
                      >
                        <div className="gap-component-sm flex items-center">
                          <span className="category-networking font-mono text-sm font-medium">
                            {iface.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {iface.type}
                          </Badge>
                        </div>
                        {isGateway && (
                          <Badge
                            variant="error"
                            className="text-xs"
                          >
                            Gateway
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isCritical && (
                <p className="text-muted-foreground text-xs">
                  This action can be undone by running the opposite operation.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-component-sm sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            aria-label="Cancel batch operation"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCritical && countdown > 0}
            variant={isCritical ? 'destructive' : 'default'}
            aria-label={
              isCritical && countdown > 0 ?
                `Confirm operation - ${countdown} seconds remaining`
              : `Confirm ${actionLabel} operation`
            }
          >
            {isCritical && countdown > 0 ? `Confirm (${countdown})` : `Confirm ${actionLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

BatchConfirmDialog.displayName = 'BatchConfirmDialog';
