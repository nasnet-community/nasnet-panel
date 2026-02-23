/**
 * IPAddressDeleteDialog Component
 * NAS-6.2: IP Address Management
 *
 * Confirmation dialog for deleting IP addresses with dependency checking.
 * Shows warnings if the IP is used by DHCP servers, routes, or firewall rules.
 * Implements safety gates for dangerous operations (section 9 of checklist).
 *
 * @example
 * ```tsx
 * <IPAddressDeleteDialog
 *   open={isOpen}
 *   routerId="r1"
 *   ipAddress={{ id: "ip1", address: "192.168.1.1/24", interfaceName: "ether1" }}
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 * />
 * ```
 */

import { useEffect, useCallback, useMemo } from 'react';
import { cn } from '@nasnet/ui/utils';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { useIPAddressDependencies } from '@nasnet/api-client/queries';
import { AlertCircle, AlertTriangle, Loader2, Trash } from 'lucide-react';

export interface IPAddressDeleteDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Router ID */
  routerId: string;
  /** IP address to delete */
  ipAddress: {
    id: string;
    address: string;
    interfaceName: string;
  };
  /** Loading state during deletion */
  isLoading?: boolean;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Callback when dialog is cancelled */
  onCancel: () => void;
  /** Optional CSS class */
  className?: string;
}

export function IPAddressDeleteDialog({
  open,
  routerId,
  ipAddress,
  isLoading = false,
  onConfirm,
  onCancel,
  className,
}: IPAddressDeleteDialogProps) {
  // Fetch dependencies when dialog opens
  const {
    dependencies,
    canDelete,
    loading: dependenciesLoading,
    refetch,
  } = useIPAddressDependencies(routerId, ipAddress.id, open);

  // Refetch dependencies when dialog opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Memoized dependency check for performance
  const hasDependencies = useMemo(
    () =>
      dependencies &&
      ((dependencies.dhcpServers?.length || 0) > 0 ||
        (dependencies.routes?.length || 0) > 0 ||
        (dependencies.natRules?.length || 0) > 0 ||
        (dependencies.firewallRules?.length || 0) > 0),
    [dependencies]
  );

  // Memoized callback for cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Memoized callback for confirm
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash
              className="h-5 w-5 text-destructive flex-shrink-0"
              aria-hidden="true"
            />
            Delete IP Address
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this IP address?
          </DialogDescription>
        </DialogHeader>

        {/* IP Address Info */}
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="text-sm font-medium mb-1 font-mono">{ipAddress.address}</div>
          <div className="text-sm text-muted-foreground">
            Interface: <span className="font-mono">{ipAddress.interfaceName}</span>
          </div>
        </div>

        {/* Loading Dependencies */}
        {dependenciesLoading && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground py-4"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Checking for dependencies...
          </div>
        )}

        {/* No Dependencies - Safe to Delete */}
        {!dependenciesLoading && canDelete && !hasDependencies && (
          <Alert className="bg-success/10 border-success">
            <AlertCircle className="h-4 w-4 text-success" aria-hidden="true" />
            <AlertTitle className="text-success">No Dependencies</AlertTitle>
            <AlertDescription className="text-success/90">
              This IP address is not used by any services and can be safely deleted.
            </AlertDescription>
          </Alert>
        )}

        {/* Has Dependencies - Show Warnings */}
        {!dependenciesLoading && hasDependencies && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Warning: Dependencies Found</AlertTitle>
            <AlertDescription>
              {dependencies?.warningMessage || 'This IP address is used by the following resources:'}

              {/* DHCP Servers */}
              {dependencies?.dhcpServers && dependencies.dhcpServers.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-sm mb-1">DHCP Servers:</div>
                  <div className="space-y-1">
                    {dependencies.dhcpServers.map((server: any) => (
                      <div key={server.id} className="text-sm flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {server.name}
                        </Badge>
                        <code className="text-xs font-mono">{server.network}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routes */}
              {dependencies?.routes && dependencies.routes.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-sm mb-1">Routes:</div>
                  <div className="space-y-1">
                    {dependencies.routes.map((route: any) => (
                      <div key={route.id} className="text-sm">
                        <code className="text-xs font-mono">{route.destination}</code> via{' '}
                        <code className="text-xs font-mono">{route.gateway}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NAT Rules */}
              {dependencies?.natRules && dependencies.natRules.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-sm mb-1">
                    NAT Rules ({dependencies.natRules.length}):
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chain: <code className="font-mono">{dependencies.natRules[0]?.chain}</code>,
                    Action: <code className="font-mono">{dependencies.natRules[0]?.action}</code>
                    {dependencies.natRules.length > 1 && ` +${dependencies.natRules.length - 1} more`}
                  </div>
                </div>
              )}

              {/* Firewall Rules */}
              {dependencies?.firewallRules && dependencies.firewallRules.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-sm mb-1">
                    Firewall Rules ({dependencies.firewallRules.length}):
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chain: <code className="font-mono">{dependencies.firewallRules[0]?.chain}</code>,
                    Action: <code className="font-mono">{dependencies.firewallRules[0]?.action}</code>
                    {dependencies.firewallRules.length > 1 && ` +${dependencies.firewallRules.length - 1} more`}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Cannot Delete */}
        {!dependenciesLoading && !canDelete && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Cannot Delete</AlertTitle>
            <AlertDescription>
              This IP address cannot be deleted because it is actively used by other resources.
              Please remove or reconfigure the dependent resources first.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || dependenciesLoading || !canDelete}
            aria-label={
              !canDelete
                ? 'Delete button disabled - dependencies found'
                : 'Confirm deletion of IP address'
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Delete IP Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

IPAddressDeleteDialog.displayName = 'IPAddressDeleteDialog';
