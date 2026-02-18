/**
 * KillConnectionButton Component
 *
 * Action button to kill a firewall connection with confirmation dialog.
 * Uses existing ConfirmationDialog with standard (yellow) warning level.
 */

import * as React from 'react';

import { Button } from '@nasnet/ui/primitives';

import { ConfirmationDialog } from '../confirmation-dialog';
import { useToast } from '../hooks';

import type { ConnectionEntry } from './types';

export interface KillConnectionButtonProps {
  /** Connection to kill */
  connection: ConnectionEntry;

  /** Callback when kill is confirmed */
  onKill: (connection: ConnectionEntry) => Promise<void>;

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';

  /** Button size */
  size?: 'default' | 'sm' | 'lg';

  /** Additional CSS classes */
  className?: string;

  /** Custom button text */
  children?: React.ReactNode;

  /** Whether the action is loading */
  isLoading?: boolean;
}

/**
 * Button to kill a connection with confirmation dialog
 *
 * Features:
 * - Standard level confirmation (yellow warning)
 * - Shows connection details in dialog
 * - Toast notification on success/failure
 * - Loading state during action
 *
 * @example
 * ```tsx
 * <KillConnectionButton
 *   connection={conn}
 *   onKill={async (conn) => {
 *     await killConnectionMutation({ id: conn.id });
 *   }}
 * />
 * ```
 */
export function KillConnectionButton({
  connection,
  onKill,
  variant = 'outline',
  size = 'sm',
  className,
  children = 'Kill',
  isLoading: externalLoading = false,
}: KillConnectionButtonProps) {
  const [showDialog, setShowDialog] = React.useState(false);
  const [internalLoading, setInternalLoading] = React.useState(false);
  const { toast } = useToast();

  const isLoading = externalLoading || internalLoading;

  // Handle confirmation
  const handleConfirm = React.useCallback(async () => {
    setInternalLoading(true);

    try {
      await onKill(connection);

      // Success toast
      toast({
        title: 'Connection killed',
        description: `Terminated connection from ${connection.srcAddress} to ${connection.dstAddress}`,
        variant: 'default',
      });

      setShowDialog(false);
    } catch (error) {
      // Error toast
      toast({
        title: 'Failed to kill connection',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setInternalLoading(false);
    }
  }, [connection, onKill, toast]);

  // Format connection details for dialog
  const connectionDetails = React.useMemo(() => {
    const srcPort = connection.srcPort !== undefined ? `:${connection.srcPort}` : '';
    const dstPort = connection.dstPort !== undefined ? `:${connection.dstPort}` : '';

    return `${connection.protocol.toUpperCase()} connection from ${connection.srcAddress}${srcPort} to ${connection.dstAddress}${dstPort}`;
  }, [connection]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
        className={className}
        aria-label={`Kill connection from ${connection.srcAddress} to ${connection.dstAddress}`}
      >
        {children}
      </Button>

      <ConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Kill Connection?"
        description={`This will terminate the ${connectionDetails}. The connection may be re-established by the client or server.`}
        confirmLabel="Kill Connection"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleConfirm}
        onCancel={() => setShowDialog(false)}
        isLoading={isLoading}
      />
    </>
  );
}

KillConnectionButton.displayName = 'KillConnectionButton';
