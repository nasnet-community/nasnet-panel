/**
 * AddToAddressListContextMenu Component
 *
 * Context menu for quickly adding IP addresses to address lists.
 * Desktop: Right-click context menu with nested list selection.
 * Mobile: Handled by IPAddressDisplay with Sheet.
 *
 * Layer 3 Domain Component
 *
 * @module @nasnet/features/firewall/components
 */

import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Input } from '@nasnet/ui/primitives';
import { Label } from '@nasnet/ui/primitives';
import { useToast } from '@nasnet/ui/primitives';

// ============================================
// TYPES
// ============================================

export interface AddToAddressListContextMenuProps {
  /** The IP address to add */
  ipAddress: string;
  /** Existing address lists for quick-add */
  existingLists?: string[];
  /** Callback when IP is added to a list */
  onAddToList?: (listName: string, ipAddress: string) => void | Promise<void>;
  /** Child element that triggers the context menu */
  children: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Context menu for adding IP to address lists
 *
 * @example
 * ```tsx
 * <AddToAddressListContextMenu
 *   ipAddress="192.168.1.100"
 *   existingLists={['blocklist', 'allowlist']}
 *   onAddToList={handleAddToList}
 * >
 *   <span className="font-mono">192.168.1.100</span>
 * </AddToAddressListContextMenu>
 * ```
 */
export function AddToAddressListContextMenu({
  ipAddress,
  existingLists = [],
  onAddToList,
  children,
}: AddToAddressListContextMenuProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddToExistingList = async (listName: string) => {
    if (!onAddToList) return;

    try {
      await onAddToList(listName, ipAddress);
      toast({
        title: 'Added to address list',
        description: `${ipAddress} has been added to "${listName}"`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add to list',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNewList = async () => {
    if (!newListName.trim() || !onAddToList) return;

    setIsCreating(true);
    try {
      await onAddToList(newListName.trim(), ipAddress);
      toast({
        title: 'Created address list',
        description: `New list "${newListName}" created with ${ipAddress}`,
      });
      setShowCreateDialog(false);
      setNewListName('');
    } catch (error) {
      toast({
        title: 'Failed to create list',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {existingLists.length > 0 ? (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Add to existing list</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                  {existingLists.map((list) => (
                    <DropdownMenuItem
                      key={list}
                      onClick={() => handleAddToExistingList(list)}
                      className="font-mono"
                    >
                      {list}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No existing lists
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="text-primary"
          >
            Create new list with this IP
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create New List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Address List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-list-name">List Name</Label>
              <Input
                id="new-list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., blocklist, trusted_devices"
                className="font-mono"
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    e.preventDefault();
                    handleCreateNewList();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, underscores, and hyphens allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label>IP Address</Label>
              <div className="px-3 py-2 bg-muted rounded-md">
                <code className="text-sm font-mono">{ipAddress}</code>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewListName('');
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewList}
                disabled={!newListName.trim() || isCreating}
                className="bg-category-firewall hover:bg-category-firewall/90"
              >
                {isCreating ? 'Creating...' : 'Create List'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
