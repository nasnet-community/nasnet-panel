import { useState } from 'react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@nasnet/ui/primitives';
import { useBatchInterfaceOperation } from '@nasnet/api-client/queries';
import { BatchInterfaceAction } from '@nasnet/api-client/generated';
import { useToast } from '@nasnet/ui/primitives';
import { BatchConfirmDialog } from './BatchConfirmDialog';

export interface BatchActionsToolbarProps {
  routerId: string;
  selectedIds: Set<string>;
  selectedInterfaces: any[]; // Full interface objects for safety checks
  onClearSelection: () => void;
}

/**
 * Batch Actions Toolbar Component
 * Provides bulk enable/disable operations with safety checks
 */
export function BatchActionsToolbar({
  routerId,
  selectedIds,
  selectedInterfaces,
  onClearSelection,
}: BatchActionsToolbarProps) {
  const [batchOperation, { loading }] = useBatchInterfaceOperation();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<BatchInterfaceAction | null>(null);

  const handleMenuClick = (action: BatchInterfaceAction) => {
    // Show confirmation dialog before executing
    setConfirmDialog(action);
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;

    const action = confirmDialog;
    setConfirmDialog(null);

    await handleBatchAction(action);
  };

  const handleBatchAction = async (action: BatchInterfaceAction) => {
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
        variant: 'destructive',
      });
    }
  };

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
}
