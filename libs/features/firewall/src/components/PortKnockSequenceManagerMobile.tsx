/**
 * Port Knock Sequence Manager (Mobile Presenter)
 *
 * Card-based mobile view with touch-friendly actions for managing port knock sequences.
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

/**
 * @description Mobile card presenter for port knock sequence management
 */
export interface PortKnockSequenceManagerMobileProps {
  className?: string;
  onEdit?: (sequenceId: string) => void;
  onCreate?: () => void;
}

// ============================================================================
// Sequence Card Component
// ============================================================================

/**
 * @description Props for individual sequence card
 */
interface SequenceCardProps {
  sequence: PortKnockSequence;
  onEdit?: (sequenceId: string) => void;
  onToggle: (sequence: PortKnockSequence) => void;
  onDelete: (sequence: PortKnockSequence) => void;
}

/**
 * @description Card component for a single port knock sequence
 */
const SequenceCard = memo(function SequenceCard({
  sequence,
  onEdit,
  onToggle,
  onDelete,
}: SequenceCardProps) {
  return (
    <Card className={sequence.isEnabled ? '' : 'opacity-50'}>
      <CardHeader className="pb-component-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="gap-component-md mb-component-sm flex items-center">
              <h3 className="text-base font-semibold">{sequence.name}</h3>
              {sequence.protectedPort === 22 && (
                <ShieldAlert
                  className="text-warning h-4 w-4"
                  aria-label="SSH protected service"
                />
              )}
            </div>
            <div className="gap-component-md flex items-center">
              <Badge
                variant={sequence.isEnabled ? 'success' : 'secondary'}
                className="text-xs"
              >
                {sequence.isEnabled ? 'Active' : 'Disabled'}
              </Badge>
              <Badge
                variant="secondary"
                className="font-mono text-xs"
              >
                {sequence.protectedProtocol.toUpperCase()}:{sequence.protectedPort}
              </Badge>
            </div>
          </div>
          <Switch
            checked={sequence.isEnabled}
            onCheckedChange={() => onToggle(sequence)}
            aria-label={sequence.isEnabled ? 'Disable sequence' : 'Enable sequence'}
            className="ml-2"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-component-md pt-0">
        {/* Knock Sequence */}
        <div>
          <div className="text-muted-foreground mb-component-sm text-xs font-medium">
            Knock Sequence
          </div>
          <div className="gap-component-md flex flex-wrap">
            {sequence.knockPorts.map((port, index) => (
              <Badge
                key={index}
                variant="outline"
                className="font-mono text-xs"
              >
                {port.port}{' '}
                <span className="text-muted-foreground ml-1">{port.protocol.toUpperCase()}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="gap-component-xl text-muted-foreground flex items-center text-xs">
          <div className="gap-component-md flex items-center">
            <Activity
              className="h-3 w-3"
              aria-hidden="true"
            />
            <span>
              Recent: <strong className="font-mono">{sequence.recentAccessCount || 0}</strong>
            </span>
          </div>
          <div className="gap-component-md flex items-center">
            <Clock
              className="h-3 w-3"
              aria-hidden="true"
            />
            <span>Knock: {sequence.knockTimeout}</span>
          </div>
          <div className="gap-component-md flex items-center">
            <Clock
              className="h-3 w-3"
              aria-hidden="true"
            />
            <span>Access: {sequence.accessTimeout}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="gap-component-md pt-component-sm flex">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(sequence.id!)}
            aria-label={`Edit ${sequence.name} sequence`}
            className="min-h-[44px] flex-1"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(sequence)}
            aria-label={`Delete ${sequence.name} sequence`}
            className="min-h-[44px]"
          >
            <Trash2 className="text-error h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

SequenceCard.displayName = 'SequenceCard';

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

  const handleToggle = useCallback(
    async (sequence: PortKnockSequence) => {
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
    },
    [activeRouterId, toggleSequence]
  );

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
          id: sequenceToDelete.id!,
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
      <div className="space-y-component-md flex flex-col items-center justify-center py-12">
        <ShieldAlert className="text-muted-foreground h-12 w-12" />
        <div className="px-4 text-center">
          <h3 className="mb-component-sm font-display text-lg font-semibold">
            No Port Knock Sequences
          </h3>
          <p className="text-muted-foreground mb-component-md text-sm">
            Create a knock sequence to protect sensitive services.
          </p>
          {onCreate && (
            <Button
              onClick={onCreate}
              aria-label="Create first port knock sequence"
              className="min-h-[44px] w-full"
            >
              Create First Sequence
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-component-md', className)}>
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
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Port Knock Sequence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the sequence "{sequenceToDelete?.name}"? This will
              remove all associated firewall rules.
              {sequenceToDelete?.protectedPort === 22 && (
                <div className="mt-component-sm p-component-sm bg-warning/10 border-warning rounded-lg border text-sm">
                  <strong>Warning:</strong> This sequence protects SSH. Ensure you have alternative
                  access before deleting.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-component-md flex-col">
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="min-h-[44px] w-full"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="min-h-[44px] w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

PortKnockSequenceManagerMobile.displayName = 'PortKnockSequenceManagerMobile';
