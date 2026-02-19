/**
 * Port Knock Sequence Manager (Mobile Presenter)
 *
 * Card-based mobile view with touch-friendly actions for managing port knock sequences.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 4
 */

import { useState, memo } from 'react';
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
  Card,
  CardContent,
  CardHeader,
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

export interface PortKnockSequenceManagerMobileProps {
  className?: string;
  onEdit?: (sequenceId: string) => void;
  onCreate?: () => void;
}

// ============================================================================
// Sequence Card Component
// ============================================================================

interface SequenceCardProps {
  sequence: PortKnockSequence;
  onEdit?: (sequenceId: string) => void;
  onToggle: (sequence: PortKnockSequence) => void;
  onDelete: (sequence: PortKnockSequence) => void;
}

function SequenceCard({ sequence, onEdit, onToggle, onDelete }: SequenceCardProps) {
  return (
    <Card className={sequence.enabled ? '' : 'opacity-50'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{sequence.name}</h3>
              {sequence.protectedPort === 22 && (
                <ShieldAlert className="h-4 w-4 text-warning" aria-label="SSH Protected" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sequence.enabled ? 'success' : 'secondary'} className="text-xs">
                {sequence.enabled ? 'Active' : 'Disabled'}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {sequence.protectedProtocol.toUpperCase()}:{sequence.protectedPort}
              </Badge>
            </div>
          </div>
          <Switch
            checked={sequence.enabled}
            onCheckedChange={() => onToggle(sequence)}
            aria-label={sequence.enabled ? 'Disable sequence' : 'Enable sequence'}
            className="ml-2"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Knock Sequence */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Knock Sequence</div>
          <div className="flex flex-wrap gap-1">
            {sequence.knockPorts.map((port, index) => (
              <Badge key={index} variant="outline" className="font-mono text-xs">
                {port.port} <span className="text-muted-foreground ml-1">{port.protocol.toUpperCase()}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>Recent: <strong className="font-mono">{sequence.recentAccessCount || 0}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Knock: {sequence.knockTimeout}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Access: {sequence.accessTimeout}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(sequence.id!)}
            aria-label={`Edit ${sequence.name} sequence`}
            className="flex-1 min-h-[44px]"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(sequence)}
            aria-label={`Delete ${sequence.name} sequence`}
            className="min-h-[44px]"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const PortKnockSequenceManagerMobile = memo(function PortKnockSequenceManagerMobile({
  className,
  onEdit,
  onCreate,
}: PortKnockSequenceManagerMobileProps) {
  const { t } = useTranslation('firewall');
  const { activeRouterId } = useConnectionStore();

  const { data, loading, error } = usePortKnockSequences(activeRouterId!);
  const [toggleSequence] = useTogglePortKnockSequence();
  const [deleteSequence] = useDeletePortKnockSequence();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sequenceToDelete, setSequenceToDelete] = useState<PortKnockSequence | null>(null);

  const sequences = data?.portKnockSequences || [];

  const handleToggle = async (sequence: PortKnockSequence) => {
    try {
      await toggleSequence({
        variables: {
          routerId: activeRouterId!,
          id: sequence.id!,
          enabled: !sequence.enabled,
        },
      });
    } catch (err) {
      console.error('Failed to toggle port knock sequence:', err);
    }
  };

  const handleDeleteClick = (sequence: PortKnockSequence) => {
    setSequenceToDelete(sequence);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sequenceToDelete) return;

    try {
      await deleteSequence({
        variables: {
          routerId: activeRouterId!,
          id: sequenceToDelete.id!,
        },
      });
      setDeleteDialogOpen(false);
      setSequenceToDelete(null);
    } catch (err) {
      console.error('Failed to delete port knock sequence:', err);
    }
  };

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
        <div className="text-destructive">Error loading sequences: {error.message}</div>
      </div>
    );
  }

  if (sequences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <div className="text-center px-4">
          <h3 className="text-lg font-semibold mb-1">No Port Knock Sequences</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a knock sequence to protect sensitive services.
          </p>
          {onCreate && (
            <Button onClick={onCreate} aria-label="Create first port knock sequence" className="w-full min-h-[44px]">Create First Sequence</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {sequences.map((sequence) => (
          <SequenceCard
            key={sequence.id}
            sequence={sequence}
            onEdit={onEdit}
            onToggle={handleToggle}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Port Knock Sequence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the sequence "{sequenceToDelete?.name}"?
              This will remove all associated firewall rules.
              {sequenceToDelete?.protectedPort === 22 && (
                <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded text-sm">
                  <strong>Warning:</strong> This sequence protects SSH. Ensure you have alternative
                  access before deleting.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2">
            <Button variant="destructive" onClick={handleDeleteConfirm} className="min-h-[44px] w-full">
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="min-h-[44px] w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

PortKnockSequenceManagerMobile.displayName = 'PortKnockSequenceManagerMobile';
