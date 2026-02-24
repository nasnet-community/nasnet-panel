/**
 * Port Knock Sequence Manager (Desktop Presenter)
 *
 * Desktop table view with inline actions for managing port knock sequences.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 */

import { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@nasnet/ui/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  usePortKnockSequences,
  useTogglePortKnockSequence,
  useDeletePortKnockSequence,
} from '@nasnet/api-client/queries';
import type { PortKnockSequence } from '@nasnet/core/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { Pencil, Trash2, ShieldAlert, Clock, Activity } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/**
 * @description Desktop table presenter for port knock sequence management
 */
export interface PortKnockSequenceManagerDesktopProps {
  className?: string;
  onEdit?: (sequenceId: string) => void;
  onCreate?: () => void;
}

// ============================================================================
// Status Badge Component
// ============================================================================

/**
 * @description Badge showing enabled/disabled status with semantic colors
 */
function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge variant={enabled ? 'success' : 'secondary'}>
      {enabled ? 'Active' : 'Disabled'}
    </Badge>
  );
}

StatusBadge.displayName = 'StatusBadge';

// ============================================================================
// Main Component
// ============================================================================

export const PortKnockSequenceManagerDesktop = memo(function PortKnockSequenceManagerDesktop({
  className,
  onEdit,
  onCreate,
}: PortKnockSequenceManagerDesktopProps) {
  const { t } = useTranslation('firewall');
  const { activeRouterId } = useConnectionStore();

  const { data, loading, error } = usePortKnockSequences(activeRouterId!);
  const [toggleSequence] = useTogglePortKnockSequence();
  const [deleteSequence] = useDeletePortKnockSequence();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sequenceToDelete, setSequenceToDelete] = useState<PortKnockSequence | null>(null);

  const sequences = data?.portKnockSequences || [];

  const handleToggle = useCallback(async (sequence: PortKnockSequence) => {
    try {
      await toggleSequence({
        variables: {
          routerId: activeRouterId!,
          id: sequence.id!,
          enabled: !sequence.isEnabled,
        },
      });
    } catch (err) {
      console.error('Failed to toggle port knock sequence:', err);
    }
  }, [activeRouterId, toggleSequence]);

  const handleDeleteClick = useCallback((sequence: PortKnockSequence) => {
    setSequenceToDelete(sequence);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!sequenceToDelete) return;

    try {
      await deleteSequence({
        variables: {
          routerId: activeRouterId!,
          id: sequenceToDelete.id!
        },
      });
      setDeleteDialogOpen(false);
      setSequenceToDelete(null);
    } catch (err) {
      console.error('Failed to delete port knock sequence:', err);
    }
  }, [sequenceToDelete, activeRouterId, deleteSequence]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading sequences...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-error">Error loading sequences: {error.message}</div>
      </div>
    );
  }

  if (sequences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-component-md">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-1 font-display">No Port Knock Sequences</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a knock sequence to protect sensitive services.
          </p>
          {onCreate && (
            <Button onClick={onCreate} data-testid="create-sequence-button" aria-label="Create first port knock sequence">
              Create First Sequence
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Table className={cn(className)} data-testid="sequences-table">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Protected Service</TableHead>
            <TableHead>Knock Ports</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Recent Access</TableHead>
            <TableHead>Timeouts</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sequences.map((sequence) => (
            <TableRow
              key={sequence.id}
              className={sequence.isEnabled ? '' : 'opacity-50'}
              data-testid={`sequence-row-${sequence.id}`}
            >
              <TableCell>
                <div className="font-medium">{sequence.name}</div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-component-sm">
                  <Badge variant="secondary" className="font-mono">
                    {sequence.protectedProtocol.toUpperCase()}:{sequence.protectedPort}
                  </Badge>
                  {sequence.protectedPort === 22 && (
                    <ShieldAlert className="h-4 w-4 text-warning" aria-label="SSH protected service" />
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-component-sm">
                  {sequence.knockPorts.map((port, index) => (
                    <Badge key={index} variant="outline" className="font-mono text-xs">
                      {port.port}
                    </Badge>
                  ))}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-component-sm">
                  <Switch
                    checked={sequence.isEnabled}
                    onCheckedChange={() => handleToggle(sequence)}
                    aria-label={sequence.isEnabled ? 'Disable sequence' : 'Enable sequence'}
                    data-testid={`toggle-sequence-${sequence.id}`}
                  />
                  <StatusBadge enabled={sequence.isEnabled} />
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Activity className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  <span className="font-mono text-sm">
                    {sequence.recentAccessCount || 0}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-component-md text-xs text-muted-foreground">
                  <div className="flex items-center gap-component-sm">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>K: {sequence.knockTimeout}</span>
                  </div>
                  <div className="flex items-center gap-component-sm">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>A: {sequence.accessTimeout}</span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-component-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(sequence.id!)}
                    aria-label={`Edit ${sequence.name} sequence`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(sequence)}
                    data-testid={`delete-sequence-${sequence.id}`}
                    aria-label={`Delete ${sequence.name} sequence`}
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Port Knock Sequence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the sequence "{sequenceToDelete?.name}"?
              This will remove all associated firewall rules.
              {sequenceToDelete?.protectedPort === 22 && (
                <div className="mt-2 p-component-sm bg-warning/10 border border-warning rounded-[var(--semantic-radius-button)] text-sm">
                  <strong>Warning:</strong> This sequence protects SSH. Ensure you have alternative
                  access before deleting.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

PortKnockSequenceManagerDesktop.displayName = 'PortKnockSequenceManagerDesktop';
