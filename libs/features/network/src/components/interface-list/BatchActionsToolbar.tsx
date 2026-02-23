import { useState, useCallback, memo } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useToast,
} from '@nasnet/ui/primitives';
import { useBatchInterfaceOperation } from '@nasnet/api-client/queries';
import { BatchInterfaceAction } from '@nasnet/api-client/generated';
import { BatchConfirmDialog } from './BatchConfirmDialog';

export interface BatchActionsToolbarProps {
  /** Router ID for API requests */
  routerId: string;
  /** Set of selected interface IDs */
  selectedIds: Set<string>;
  /** Full interface objects for safety checks and context */
  selectedInterfaces: any[];
  /** Callback to clear the current selection */
  onClearSelection: () => void;
}

/**
 * Batch Actions Toolbar Component.
 *
 * Provides bulk enable/disable operations on selected interfaces with safety
 * checks via confirmation dialog and comprehensive error handling.
 *
 * @description Toolbar for batch interface operations with confirmation and status feedback
 */
export const BatchActionsToolbar = memo(function BatchActionsToolbar({
  routerId,
  selectedIds,
  selectedInterfaces,
  onClearSelection,
}: BatchActionsToolbarProps) {
  const [batchOperation, { loading }] = useBatchInterfaceOperation();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<BatchInterfaceAction | null>(null);

  const handleMenuClick = useCallback((action: BatchInterfaceAction) => {
    // Show confirmation dialog before executing
    setConfirmDialog(action);
  }, []);

  const handleBatchAction = useCallback(async (action: BatchInterfaceAction) => {
    try {
      const result = await batchOperation({
        variables: {
          routerId,
          input: {
            interfaceIds: Array.from(selectedIds),
            action,
          },
        },
      });

      const data = result.data?.batchInterfaceOperation;
      if (data) {
        const { succeeded, failed } = data;

        if (failed.length === 0) {
          toast({
            title: 'Batch operation complete',
            description: `${succeeded.length} interface${succeeded.length !== 1 ? 's' : ''} updated successfully`,
          });
        } else {
          toast({
            title: 'Batch operation partial',
            description: `${succeeded.length} succeeded, ${failed.length} failed`,
            variant: 'warning',
          });
        }

        onClearSelection();
      }
    } catch (error) {
      toast({
        title: 'Batch operation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    }
  }, [batchOperation, routerId, selectedIds, onClearSelection, toast]);

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog) return;

    const action = confirmDialog;
    setConfirmDialog(null);

    await handleBatchAction(action);
  }, [confirmDialog, handleBatchAction]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedIds.size} selected
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={loading}>
            {loading ? 'Processing...' : 'Batch Actions'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => handleMenuClick(BatchInterfaceAction.Enable)}
          >
            Enable Selected
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleMenuClick(BatchInterfaceAction.Disable)}
          >
            Disable Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear Selection
      </Button>

      {/* Confirmation dialog */}
      <BatchConfirmDialog
        open={confirmDialog !== null}
        action={confirmDialog}
        interfaces={selectedInterfaces}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
});

BatchActionsToolbar.displayName = 'BatchActionsToolbar';
