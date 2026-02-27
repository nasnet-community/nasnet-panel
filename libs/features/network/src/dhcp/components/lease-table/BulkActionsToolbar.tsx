/**
 * BulkActionsToolbar Component
 *
 * Toolbar for bulk operations on selected DHCP leases:
 * - Shows selection count
 * - "Make All Static" button
 * - "Delete Selected" button
 * - "Clear" button to deselect all
 *
 * Uses ConfirmationDialog for destructive actions.
 *
 * @module features/network/dhcp/components/lease-table
 */

import { memo, useState, useCallback } from 'react';
import { Lock, Trash2, X } from 'lucide-react';
import { Button, Icon } from '@nasnet/ui/primitives';
import { ConfirmationDialog } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';

export interface BulkActionsToolbarProps {
  /**
   * Number of selected leases
   */
  selectedCount: number;

  /**
   * Callback for "Make All Static" action
   */
  onMakeStatic: () => void;

  /**
   * Callback for "Delete Selected" action
   */
  onDelete: () => void;

  /**
   * Callback for "Clear" action (deselect all)
   */
  onClear: () => void;

  /**
   * Loading state for async operations
   */
  isLoading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BulkActionsToolbar Component
 *
 * Displays action buttons when leases are selected.
 * Shows confirmation dialog for destructive operations.
 *
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedCount={5}
 *   onMakeStatic={handleMakeStatic}
 *   onDelete={handleDelete}
 *   onClear={handleClear}
 * />
 * ```
 */
function BulkActionsToolbarComponent({
  selectedCount,
  onMakeStatic,
  onDelete,
  onClear,
  isLoading = false,
  className,
}: BulkActionsToolbarProps) {
  const [showMakeStaticConfirm, setShowMakeStaticConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Handle "Make All Static" with confirmation
   */
  const handleMakeStaticConfirm = useCallback(() => {
    setShowMakeStaticConfirm(false);
    onMakeStatic();
  }, [onMakeStatic]);

  /**
   * Handle "Delete Selected" with confirmation
   */
  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    onDelete();
  }, [onDelete]);

  // Don't render if no items selected
  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between rounded-[var(--semantic-radius-card)] border border-category-networking/50 bg-category-networking/5 p-component-sm',
          className
        )}
        role="toolbar"
        aria-label="Bulk actions toolbar"
      >
        {/* Selection count */}
        <div className="flex items-center gap-component-sm">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? 'lease' : 'leases'} selected
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-component-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMakeStaticConfirm(true)}
            disabled={isLoading}
            className="gap-component-sm"
            aria-label="Make selected leases static"
          >
            <Icon icon={Lock} className="h-4 w-4" aria-hidden="true" />
            Make All Static
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="gap-component-sm"
            aria-label="Delete selected leases"
          >
            <Icon icon={Trash2} className="h-4 w-4" aria-hidden="true" />
            Delete Selected
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isLoading}
            aria-label="Clear selection"
          >
            <Icon icon={X} className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      {/* Make Static Confirmation Dialog */}
      <ConfirmationDialog
        open={showMakeStaticConfirm}
        onOpenChange={setShowMakeStaticConfirm}
        title="Make Leases Static?"
        description={`This will convert ${selectedCount} ${
          selectedCount === 1 ? 'lease' : 'leases'
        } to static DHCP ${
          selectedCount === 1 ? 'assignment' : 'assignments'
        }. The ${
          selectedCount === 1 ? 'device' : 'devices'
        } will always receive the same IP address.`}
        confirmLabel="Make Static"
        onConfirm={handleMakeStaticConfirm}
        variant="default"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Selected Leases?"
        description={`This will permanently delete ${selectedCount} ${
          selectedCount === 1 ? 'lease' : 'leases'
        }. The ${
          selectedCount === 1 ? 'device' : 'devices'
        } will need to request a new IP address.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}

// Export with memo wrapper and displayName
export const BulkActionsToolbar = memo(BulkActionsToolbarComponent);
BulkActionsToolbar.displayName = 'BulkActionsToolbar';
