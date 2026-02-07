/**
 * IPAddressDeleteDialog Component
 * NAS-6.2: IP Address Management
 *
 * Confirmation dialog for deleting IP addresses with dependency checking.
 * Shows warnings if the IP is used by DHCP servers, routes, or firewall rules.
 */

import { useEffect } from 'react';
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
  loading?: boolean;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Callback when dialog is cancelled */
  onCancel: () => void;
}

export function IPAddressDeleteDialog({
  open,
  routerId,
  ipAddress,
  loading = false,
  onConfirm,
  onCancel,
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

  const hasDependencies = dependencies && (
    (dependencies.dhcpServers?.length || 0) > 0 ||
    (dependencies.routes?.length || 0) > 0 ||
    (dependencies.natRules?.length || 0) > 0 ||
    (dependencies.firewallRules?.length || 0) > 0
  );

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash className="h-5 w-5 text-destructive" />
            Delete IP Address
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this IP address?
          </DialogDescription>
        </DialogHeader>

        {/* IP Address Info */}
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="text-sm font-medium mb-1">{ipAddress.address}</div>
          <div className="text-sm text-muted-foreground">
            Interface: {ipAddress.interfaceName}
          </div>
        </div>

        {/* Loading Dependencies */}
        {dependenciesLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking for dependencies...
          </div>
        )}

        {/* No Dependencies - Safe to Delete */}
        {!dependenciesLoading && canDelete && !hasDependencies && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Dependencies</AlertTitle>
            <AlertDescription>
              This IP address is not used by any services and can be safely deleted.
            </AlertDescription>
          </Alert>
        )}

        {/* Has Dependencies - Show Warnings */}
        {!dependenciesLoading && hasDependencies && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
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
                        <code className="text-xs">{server.network}</code>
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
                        <code className="text-xs">{route.destination}</code> via{' '}
                        <code className="text-xs">{route.gateway}</code>
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
                    Chain: {dependencies.natRules[0]?.chain}, Action: {dependencies.natRules[0]?.action}
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
                    Chain: {dependencies.firewallRules[0]?.chain}, Action: {dependencies.firewallRules[0]?.action}
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
            <AlertTriangle className="h-4 w-4" />
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
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading || dependenciesLoading || !canDelete}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete IP Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
